/**
 * Settings Page - Ohtani Sheet management, Excel export, weight targets
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  getSettings,
  saveSettings,
  getOhtaniSheet,
  saveOhtaniSheet,
  exportAllData,
  getAllBodyLogs,
  getAllRunningRecords,
  getAllSleepRecords,
  getAllTrainingRecords,
} from '@/lib/store';
import type { AppSettings, OhtaniSheet, OhtaniSheetCategory } from '@/lib/types';

function ExcelExport() {
  const handleExport = () => {
    try {
      const bodyLogs = getAllBodyLogs();
      const runningRecords = getAllRunningRecords();
      const sleepRecords = getAllSleepRecords();
      const trainingRecords = getAllTrainingRecords();

      // Create CSV content
      let csv = '\uFEFF'; // BOM for Excel
      
      // Body Logs
      csv += '=== 体重記録 ===\n';
      csv += '日付,体重(kg)\n';
      Object.values(bodyLogs)
        .filter((b) => b.weight)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((b) => {
          csv += `${b.date},${b.weight}\n`;
        });
      
      csv += '\n=== ランニング記録 ===\n';
      csv += '日付,距離(km)\n';
      Object.values(runningRecords)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((r) => {
          csv += `${r.date},${r.distance}\n`;
        });
      
      csv += '\n=== 睡眠記録 ===\n';
      csv += '日付,起床時間,就寝時間,睡眠時間(h)\n';
      Object.values(sleepRecords)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((s) => {
          csv += `${s.date},${s.wakeUpTime || ''},${s.bedTime || ''},${s.sleepHours?.toFixed(1) || ''}\n`;
        });
      
      csv += '\n=== 筋トレ記録 ===\n';
      csv += '日付,部位,完了\n';
      Object.values(trainingRecords)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((t) => {
          csv += `${t.date},${t.muscleGroups.join('・')},${t.completed ? 'はい' : 'いいえ'}\n`;
        });

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lean-bulk-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('データをエクスポートしました');
    } catch (e) {
      toast.error('エクスポートに失敗しました');
    }
  };

  const handleJsonExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lean-bulk-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('バックアップを保存しました');
    } catch (e) {
      toast.error('バックアップに失敗しました');
    }
  };

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold">データエクスポート</h3>
      <Button
        onClick={handleExport}
        className="w-full bg-sunrise-green hover:bg-sunrise-green/90 text-white"
      >
        <Download size={16} className="mr-2" />
        Excel (CSV) でエクスポート
      </Button>
      <Button
        onClick={handleJsonExport}
        variant="outline"
        className="w-full"
      >
        <Download size={16} className="mr-2" />
        JSON バックアップ
      </Button>
    </div>
  );
}

function WeightSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());
  const [startWeight, setStartWeight] = useState(settings.startWeight.toString());
  const [targetWeight, setTargetWeight] = useState(settings.targetWeight.toString());

  const handleSave = () => {
    const sw = parseFloat(startWeight);
    const tw = parseFloat(targetWeight);
    if (isNaN(sw) || isNaN(tw)) {
      toast.error('正しい値を入力してください');
      return;
    }
    const updated = { ...settings, startWeight: sw, targetWeight: tw };
    saveSettings(updated);
    setSettingsState(updated);
    toast.success('体重設定を保存しました');
  };

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold">体重設定</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">開始体重 (kg)</label>
          <Input
            type="number"
            step="0.1"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">目標体重 (kg)</label>
          <Input
            type="number"
            step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <Button onClick={handleSave} className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white">
        保存
      </Button>
    </div>
  );
}

function OhtaniSheetManager() {
  const [sheet, setSheet] = useState<OhtaniSheet>(() => getOhtaniSheet());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ catId: string; itemIdx?: number } | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: OhtaniSheetCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      items: [],
    };
    const updated = { ...sheet, categories: [...sheet.categories, newCat] };
    setSheet(updated);
    saveOhtaniSheet(updated);
    setNewCategoryName('');
    setShowAddCategory(false);
    toast.success(`「${newCat.name}」を追加しました`);
  };

  const handleAddItem = (catId: string) => {
    if (!newItemText.trim()) return;
    const updated = {
      ...sheet,
      categories: sheet.categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, newItemText.trim()] } : c
      ),
    };
    setSheet(updated);
    saveOhtaniSheet(updated);
    setNewItemText('');
    toast.success('項目を追加しました');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    let updated: OhtaniSheet;
    if (deleteTarget.itemIdx !== undefined) {
      updated = {
        ...sheet,
        categories: sheet.categories.map((c) =>
          c.id === deleteTarget.catId
            ? { ...c, items: c.items.filter((_, i) => i !== deleteTarget.itemIdx) }
            : c
        ),
      };
    } else {
      updated = {
        ...sheet,
        categories: sheet.categories.filter((c) => c.id !== deleteTarget.catId),
      };
    }
    setSheet(updated);
    saveOhtaniSheet(updated);
    setDeleteTarget(null);
    toast.success('削除しました');
  };

  return (
    <div className="card-neu p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">大谷シート管理</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddCategory(true)}
          className="text-xs"
        >
          <Plus size={14} className="mr-1" /> カテゴリ追加
        </Button>
      </div>

      <div className="space-y-3">
        {sheet.categories.map((cat) => (
          <div key={cat.id} className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{cat.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingCategory(editingCategory === cat.id ? null : cat.id);
                    setNewItemText('');
                  }}
                  className="p-1 tap-active"
                >
                  <Edit3 size={14} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ catId: cat.id })}
                  className="p-1 tap-active"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full border border-border"
                >
                  {item}
                  {editingCategory === cat.id && (
                    <button
                      onClick={() => setDeleteTarget({ catId: cat.id, itemIdx: idx })}
                      className="text-destructive"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editingCategory === cat.id && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="新しい項目"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(cat.id)}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddItem(cat.id)}
                  className="h-8 bg-sunrise-orange hover:bg-sunrise-orange/90 text-white"
                >
                  追加
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>新しいカテゴリを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="カテゴリ名（例：メンタル）"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <Button
              onClick={handleAddCategory}
              className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white"
            >
              追加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">アプリの設定を管理</p>
      </div>

      <WeightSettings />
      <OhtaniSheetManager />
      <ExcelExport />

      {/* App Info */}
      <div className="card-neu p-5 text-center">
        <h3 className="text-sm font-semibold mb-1">Lean Bulk Tracker</h3>
        <p className="text-xs text-muted-foreground">v2.0.0 — PWA Edition</p>
        <p className="text-xs text-muted-foreground mt-1">
          全データはこのデバイスのローカルストレージに保存されています
        </p>
      </div>
    </div>
  );
}
