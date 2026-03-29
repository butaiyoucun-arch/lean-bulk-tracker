/**
 * Settings Page - Goal mode, Ohtani Sheet, backup/restore, storage info
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download, Upload, Edit3, Save, X, HardDrive, ShieldCheck, AlertTriangle, Calendar, Archive } from 'lucide-react';
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
  importAllData,
  getAllBodyLogs,
  getAllRunningRecords,
  getAllSleepRecords,
  getAllTrainingRecords,
  getSleepRecord,
  saveSleepRecord,
  calculateSleepHours,
  getToday,
} from '@/lib/store';
import {
  exportAllPhotosForBackup,
  importPhotosFromBackup,
  getPhotoCount,
  getStorageEstimate,
  requestPersistentStorage,
  checkDataIntegrity,
} from '@/lib/photoDb';
import type { AppSettings, OhtaniSheet, OhtaniSheetCategory, GoalMode } from '@/lib/types';
import { GOAL_MODE_LABELS } from '@/lib/types';

// ===== Goal Mode & Weight Settings (統合コンポーネント) =====
function GoalModeSelector() {
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());
  const [startWeight, setStartWeight] = useState(() => getSettings().startWeight.toString());
  const [targetWeight, setTargetWeight] = useState(() => getSettings().targetWeight.toString());

  const handleModeChange = (mode: GoalMode) => {
    // 最新のsettingsをlocalStorageから再取得して上書き防止
    const latest = getSettings();
    const updated = { ...latest, goalMode: mode };
    saveSettings(updated);
    setSettingsState(updated);
    toast.success(`目標を「${GOAL_MODE_LABELS[mode]}」に変更しました`);
  };

  const handleWeightSave = () => {
    const sw = parseFloat(startWeight);
    const tw = parseFloat(targetWeight);
    if (isNaN(sw) || isNaN(tw)) {
      toast.error('正しい値を入力してください');
      return;
    }
    // 最新のsettingsをlocalStorageから再取得して上書き防止
    const latest = getSettings();
    const updated = { ...latest, startWeight: sw, targetWeight: tw };
    saveSettings(updated);
    setSettingsState(updated);
    toast.success('体重設定を保存しました');
  };

  const modes: { mode: GoalMode; emoji: string; description: string }[] = [
    { mode: 'bulk', emoji: '💪', description: '筋肉量を増やしながら体重を増やす' },
    { mode: 'maintain', emoji: '⚖️', description: '現在の体重と体型を維持する' },
    { mode: 'cut', emoji: '🔥', description: '体脂肪を減らして体重を落とす' },
  ];

  return (
    <div className="card-neu p-5 space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">目標モード</h3>
        <p className="text-xs text-muted-foreground">
          現在のフェーズに合わせて目標を設定すると、振り返りのアドバイスが変わります
        </p>
        <div className="space-y-2">
          {modes.map(({ mode, emoji, description }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all tap-active ${
                settings.goalMode === mode
                  ? 'bg-sunrise-orange/15 border-2 border-sunrise-orange/50 shadow-sm'
                  : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1">
                <span className={`text-sm font-bold ${settings.goalMode === mode ? 'text-sunrise-orange' : 'text-foreground'}`}>
                  {GOAL_MODE_LABELS[mode]}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              {settings.goalMode === mode && (
                <span className="text-sunrise-orange text-xs font-bold">選択中</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
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
        <Button onClick={handleWeightSave} className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white">
          体重設定を保存
        </Button>
      </div>
    </div>
  );
}

// ===== Full Backup (with photos) =====
function FullBackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPhotoCount().then(setPhotoCount).catch(() => {});
  }, []);

  const handleFullExport = async () => {
    setIsExporting(true);
    try {
      const textData = exportAllData();
      const photos = await exportAllPhotosForBackup();
      const fullBackup = {
        version: 2,
        exportDate: new Date().toISOString(),
        appName: 'lean-bulk-tracker',
        data: textData,
        photos,
      };
      const json = JSON.stringify(fullBackup);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lean-bulk-tracker-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`完全バックアップを保存しました（写真${photos.length}枚含む）`);
    } catch (e) {
      console.error('[Settings] エクスポートエラー:', e);
      toast.error('バックアップに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFullImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // バージョンチェック
      if (!backup.data && !backup.sleepRecords) {
        toast.error('無効なバックアップファイルです');
        return;
      }

      // v2形式（data + photos）
      if (backup.version === 2 && backup.data) {
        const result = importAllData(backup.data);
        let photoImported = 0;
        if (backup.photos && Array.isArray(backup.photos)) {
          photoImported = await importPhotosFromBackup(backup.photos);
        }
        if (result.errors.length > 0) {
          toast.error(`一部のデータのインポートに失敗: ${result.errors.join(', ')}`);
        } else {
          toast.success(`復元完了！ データ${result.imported}件、写真${photoImported}枚`);
        }
      } else {
        // v1形式（旧JSON形式）
        const result = importAllData(backup);
        if (result.errors.length > 0) {
          toast.error(`一部のデータのインポートに失敗: ${result.errors.join(', ')}`);
        } else {
          toast.success(`復元完了！ ${result.imported}件のデータをインポートしました`);
        }
      }

      // 画面をリロードして反映
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('[Settings] インポートエラー:', err);
      toast.error('バックアップファイルの読み込みに失敗しました');
    } finally {
      setIsImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold">データバックアップ・復元</h3>
      <p className="text-xs text-muted-foreground">
        機種変更やデータ消失に備えて、写真を含む全データをバックアップできます。
        定期的にバックアップを取ることをお勧めします。
      </p>
      <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
        現在の写真枚数: <span className="font-bold text-foreground">{photoCount}枚</span>
      </div>
      <Button
        onClick={handleFullExport}
        disabled={isExporting}
        className="w-full bg-sunrise-green hover:bg-sunrise-green/90 text-white"
      >
        <Download size={16} className="mr-2" />
        {isExporting ? 'エクスポート中...' : '完全バックアップ（写真込み）'}
      </Button>
      <Button
        onClick={() => importRef.current?.click()}
        disabled={isImporting}
        variant="outline"
        className="w-full"
      >
        <Upload size={16} className="mr-2" />
        {isImporting ? 'インポート中...' : 'バックアップから復元'}
      </Button>
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFullImport}
      />
    </div>
  );
}

// ===== CSV Export =====
function CsvExport() {
  const handleExport = () => {
    try {
      const bodyLogs = getAllBodyLogs();
      const runningRecords = getAllRunningRecords();
      const sleepRecords = getAllSleepRecords();
      const trainingRecords = getAllTrainingRecords();

      let csv = '\uFEFF';
      csv += '=== 体重記録 ===\n';
      csv += '日付,体重(kg)\n';
      Object.values(bodyLogs)
        .filter((b) => b.weight)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((b) => { csv += `${b.date},${b.weight}\n`; });

      csv += '\n=== ランニング記録 ===\n';
      csv += '日付,距離(km)\n';
      Object.values(runningRecords)
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((r) => { csv += `${r.date},${r.distance}\n`; });

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

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lean-bulk-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSVをエクスポートしました');
    } catch (e) {
      toast.error('エクスポートに失敗しました');
    }
  };

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold">CSVエクスポート</h3>
      <Button
        onClick={handleExport}
        variant="outline"
        className="w-full"
      >
        <Download size={16} className="mr-2" />
        Excel (CSV) でエクスポート
      </Button>
    </div>
  );
}

// ===== Storage Info & Health =====
function StorageHealth() {
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number; usagePercent: number } | null>(null);
  const [integrity, setIntegrity] = useState<{ status: string; message: string } | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const estimate = await getStorageEstimate();
        setStorageInfo(estimate);
      } catch { /* ignore */ }

      try {
        const check = await checkDataIntegrity();
        setIntegrity(check);
      } catch { /* ignore */ }

      try {
        if (navigator.storage && navigator.storage.persisted) {
          const persisted = await navigator.storage.persisted();
          setIsPersisted(persisted);
        }
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const handlePersist = async () => {
    const result = await requestPersistentStorage();
    setIsPersisted(result);
    if (result) {
      toast.success('ストレージが永続化されました。ブラウザがデータを自動削除しなくなります。');
    } else {
      toast.error('永続化リクエストが拒否されました。定期的なバックアップをお勧めします。');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <HardDrive size={14} />
        ストレージ情報
      </h3>

      {storageInfo && storageInfo.quota > 0 && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>使用量: {formatBytes(storageInfo.usage)}</span>
            <span>上限: {formatBytes(storageInfo.quota)}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                storageInfo.usagePercent > 80 ? 'bg-red-500' : storageInfo.usagePercent > 50 ? 'bg-yellow-500' : 'bg-sunrise-green'
              }`}
              style={{ width: `${Math.min(storageInfo.usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{storageInfo.usagePercent}% 使用中</p>
          {storageInfo.usagePercent > 80 && (
            <p className="text-xs text-red-500 font-medium mt-1">
              ストレージ残量が少なくなっています。バックアップを取って古い写真を整理してください。
            </p>
          )}
        </div>
      )}

      {integrity && (
        <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
          integrity.status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {integrity.status === 'ok' ? <ShieldCheck size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
          <span>{integrity.message}</span>
        </div>
      )}

      {isPersisted === false && (
        <Button
          onClick={handlePersist}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          <ShieldCheck size={14} className="mr-1" />
          ストレージを永続化する（データ消失防止）
        </Button>
      )}
      {isPersisted === true && (
        <p className="text-xs text-sunrise-green font-medium flex items-center gap-1">
          <ShieldCheck size={12} /> ストレージ永続化済み
        </p>
      )}
    </div>
  );
}

// ===== Past Sleep Record Entry =====
function PastSleepEntry() {
  const [selectedDate, setSelectedDate] = useState('');
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [savedRecord, setSavedRecord] = useState<{ bedTime: string | null; wakeUpTime: string | null; sleepHours: number | null } | null>(null);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const record = getSleepRecord(date);
      setBedTime(record.bedTime || '');
      setWakeTime(record.wakeUpTime || '');
      setSavedRecord(record);
    } else {
      setSavedRecord(null);
    }
  };

  const handleSave = () => {
    if (!selectedDate) {
      toast.error('日付を選択してください');
      return;
    }
    const existing = getSleepRecord(selectedDate);
    const updated = { ...existing };
    if (bedTime) updated.bedTime = bedTime;
    if (wakeTime) updated.wakeUpTime = wakeTime;
    if (bedTime && wakeTime) {
      updated.sleepHours = calculateSleepHours(bedTime, wakeTime);
    }
    saveSleepRecord(updated);
    setSavedRecord(updated);
    toast.success(`${selectedDate} の睡眠記録を保存しました`);
  };

  const today = getToday();

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Calendar size={14} />
        過去の睡眠記録を入力
      </h3>
      <p className="text-xs text-muted-foreground">
        記録し忘れた日の睡眠時間を後から入力できます。
      </p>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">日付</label>
        <Input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => handleDateChange(e.target.value)}
          className="h-10"
        />
      </div>
      {selectedDate && (
        <>
          {savedRecord && (savedRecord.bedTime || savedRecord.wakeUpTime) && (
            <div className="bg-indigo-50 rounded-lg p-2 text-xs text-indigo-700">
              既存の記録: おやすみ {savedRecord.bedTime || '--'} / おはよう {savedRecord.wakeUpTime || '--'}
              {savedRecord.sleepHours && ` / ${savedRecord.sleepHours.toFixed(1)}h`}
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground mb-1 block w-full">おやすみ時間</label>
              <Input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="h-10 text-center w-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground mb-1 block w-full">おはよう時間</label>
              <Input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="h-10 text-center w-full"
              />
            </div>
          </div>
          {bedTime && wakeTime && (
            <div className="text-center text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg py-2">
              睡眠時間: {calculateSleepHours(bedTime, wakeTime).toFixed(1)}h
            </div>
          )}
          <Button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save size={14} className="mr-2" />
            保存
          </Button>
        </>
      )}
    </div>
  );
}

// ===== Year Archive Export =====
function YearArchive() {
  const handleArchiveYear = (year: number) => {
    try {
      const allSleep = getAllSleepRecords();
      const allBody = getAllBodyLogs();
      const allRunning = getAllRunningRecords();
      const allTraining = getAllTrainingRecords();

      const filterByYear = (records: Record<string, { date: string }>) => {
        return Object.fromEntries(
          Object.entries(records).filter(([, v]) => v.date.startsWith(`${year}-`))
        );
      };

      const archive = {
        version: 'archive-v1',
        year,
        exportDate: new Date().toISOString(),
        appName: 'lean-bulk-tracker',
        data: {
          sleepRecords: filterByYear(allSleep),
          bodyLogs: filterByYear(allBody),
          runningRecords: filterByYear(allRunning),
          trainingRecords: filterByYear(allTraining),
        },
      };

      const json = JSON.stringify(archive, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lean-bulk-tracker-${year}-archive.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${year}年のデータをアーカイブしました`);
    } catch (e) {
      toast.error('アーカイブに失敗しました');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="card-neu p-5 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Archive size={14} />
        年別データアーカイブ
      </h3>
      <p className="text-xs text-muted-foreground">
        特定の年のデータをJSONファイルとして保存できます。10年分のデータ管理に役立ちます。
      </p>
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleArchiveYear(year)}
            className="py-2 px-3 rounded-xl bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-all tap-active"
          >
            {year}年
          </button>
        ))}
      </div>
    </div>
  );
}

// WeightSettings は GoalModeSelector に統合済み

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

      <GoalModeSelector />
      <OhtaniSheetManager />
      <PastSleepEntry />
      <FullBackupRestore />
      <CsvExport />
      <YearArchive />
      <StorageHealth />

      {/* App Info */}
      <div className="card-neu p-5 text-center">
        <h3 className="text-sm font-semibold mb-1">Lean Bulk Tracker</h3>
        <p className="text-xs text-muted-foreground">v4.0.0 — 10年使えるPWA Edition</p>
        <p className="text-xs text-muted-foreground mt-1">
          テキストデータはlocalStorage、写真はIndexedDBに保存されています
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          機種変更時は「完全バックアップ」で全データを移行できます
        </p>
      </div>
    </div>
  );
}
