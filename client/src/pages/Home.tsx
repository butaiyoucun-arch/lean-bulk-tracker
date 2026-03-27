/**
 * Home Page - Lean Bulk Tracker
 * Design: Warm Sunrise - Soft Neumorphism with warm tones
 * Sections: Sleep Record, Morning Body Log, Today's Mission, Ohtani Motivation
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Edit3, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getToday,
  getSleepRecord,
  saveSleepRecord,
  getBodyLog,
  saveBodyLog,
  getScheduleDay,
  getRandomOhtaniQuote,
  calculateSleepHours,
  formatDate,
} from '@/lib/store';
import type { SleepRecord, BodyLog } from '@/lib/types';
import { DAY_NAMES } from '@/lib/types';

export default function Home() {
  const today = getToday();
  const todayDate = new Date();
  const dayName = DAY_NAMES[todayDate.getDay()];
  const monthDay = `${todayDate.getMonth() + 1}/${todayDate.getDate()}`;

  const [sleep, setSleep] = useState<SleepRecord>(() => getSleepRecord(today));
  const [body, setBody] = useState<BodyLog>(() => getBodyLog(today));
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationData, setMotivationData] = useState<{ category: string; item: string; message: string } | null>(null);
  const [showBodyEdit, setShowBodyEdit] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schedule = getScheduleDay(today);

  useEffect(() => {
    setSleep(getSleepRecord(today));
    setBody(getBodyLog(today));
  }, [today]);

  const handleWakeUp = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = { ...sleep, wakeUpTime: timeStr };
    
    // Calculate sleep hours if bedTime exists (from previous night)
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySleep = getSleepRecord(formatDate(yesterday));
    if (yesterdaySleep.bedTime) {
      updated.sleepHours = calculateSleepHours(yesterdaySleep.bedTime, timeStr);
    }
    
    setSleep(updated);
    saveSleepRecord(updated);
    
    // Show motivation
    const quote = getRandomOhtaniQuote();
    setMotivationData(quote);
    setShowMotivation(true);
  };

  const handleBedTime = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = { ...sleep, bedTime: timeStr };
    setSleep(updated);
    saveSleepRecord(updated);
    toast.success('おやすみなさい。良い夢を！');
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = { ...body, photo: dataUrl };
      setBody(updated);
      saveBodyLog(updated);
      toast.success('ボディフォトを保存しました');
    };
    reader.readAsDataURL(file);
  };

  const handleWeightSave = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) {
      toast.error('正しい体重を入力してください');
      return;
    }
    const updated = { ...body, weight: w };
    setBody(updated);
    saveBodyLog(updated);
    setShowBodyEdit(false);
    toast.success('体重を記録しました');
  };

  const getMissionDisplay = () => {
    const s = schedule;
    if (s.dayType === 'rest' && !s.hasRunning && s.trainingMuscles.length === 0) {
      return { emoji: '😴', title: '今日は休養日です', sub: 'しっかり休みましょう。\n筋肉は休んでいる間に成長します。' };
    }
    const parts: string[] = [];
    if (s.trainingMuscles.length > 0) {
      parts.push(s.trainingMuscles.join('・'));
    }
    if (s.hasRunning) {
      parts.push('ランニング');
    }
    if (parts.length === 0) {
      return { emoji: '📋', title: 'ミッション未設定', sub: 'スケジュールタブからメニューを設定しよう！' };
    }
    return { emoji: '💪', title: parts.join(' + '), sub: '今日も全力で頑張ろう！' };
  };

  const mission = getMissionDisplay();

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Lean Bulk Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {monthDay} の記録
        </p>
      </div>

      {/* Sleep Record Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-neu p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">睡眠記録</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Ohayou Button */}
          <button
            onClick={handleWakeUp}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all tap-active ${
              sleep.wakeUpTime
                ? 'bg-sunrise-peach/60'
                : 'bg-sunrise-warm-yellow/40 hover:bg-sunrise-warm-yellow/60'
            }`}
          >
            <span className="text-3xl">☀️</span>
            <span className="text-sm font-medium text-foreground">おはよう</span>
            {sleep.wakeUpTime && (
              <span className="text-xs text-muted-foreground">{sleep.wakeUpTime}</span>
            )}
          </button>

          {/* Oyasumi Button */}
          <button
            onClick={handleBedTime}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all tap-active ${
              sleep.bedTime
                ? 'bg-sunrise-lavender/60'
                : 'bg-sunrise-lavender/30 hover:bg-sunrise-lavender/50'
            }`}
          >
            <span className="text-3xl">🌙</span>
            <span className="text-sm font-medium text-foreground">おやすみ</span>
            {sleep.bedTime && (
              <span className="text-xs text-muted-foreground">{sleep.bedTime}</span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Morning Body Log Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-neu p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">モーニング・ボディログ</h3>
        <div className="flex items-center gap-4">
          {/* Photo thumbnail */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0 tap-active"
          >
            {body.photo ? (
              <img src={body.photo} alt="Body" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-muted-foreground" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />

          {/* Weight display */}
          <div className="flex-1">
            {body.weight ? (
              <div>
                <span className="text-3xl font-bold font-display">{body.weight}</span>
                <span className="text-sm text-muted-foreground ml-1">kg</span>
                <div className="text-xs text-sunrise-green mt-1">記録済み ✓</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">体重を記録しよう</div>
            )}
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWeightInput(body.weight?.toString() || '');
              setShowBodyEdit(true);
            }}
            className="bg-sunrise-lavender/30 border-sunrise-lavender/50 text-foreground"
          >
            <Edit3 size={14} className="mr-1" />
            編集
          </Button>
        </div>
      </motion.div>

      {/* Today's Mission Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-neu p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">
          今日のミッション（{dayName}曜日）
        </h3>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="text-4xl mb-2">{mission.emoji}</span>
          <h4 className="text-lg font-bold text-foreground">{mission.title}</h4>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{mission.sub}</p>
        </div>
      </motion.div>

      {/* Motivation Modal */}
      <AnimatePresence>
        {showMotivation && motivationData && (
          <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
            <DialogContent className="max-w-[340px] rounded-2xl bg-gradient-to-b from-sunrise-warm-yellow/30 to-sunrise-peach/20">
              <DialogHeader>
                <DialogTitle className="text-center text-lg">
                  ☀️ おはよう！
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-4 space-y-3">
                <div className="inline-block px-3 py-1 rounded-full bg-sunrise-orange/20 text-sunrise-orange text-xs font-medium">
                  {motivationData.category}
                </div>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed font-accent">
                  {motivationData.message}
                </p>
              </div>
              <Button
                onClick={() => setShowMotivation(false)}
                className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white"
              >
                今日も頑張る！
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Weight Edit Dialog */}
      <Dialog open={showBodyEdit} onOpenChange={setShowBodyEdit}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>体重を記録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="68.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="text-2xl font-bold text-center h-14"
                autoFocus
              />
              <span className="text-lg text-muted-foreground">kg</span>
            </div>
            <Button
              onClick={handleWeightSave}
              className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
