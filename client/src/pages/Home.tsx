/**
 * Home Page - Lean Bulk Tracker
 * Design: Warm Sunrise - Soft Neumorphism with warm tones
 * Features: Sleep Record (editable times), Morning Body Log (camera + album),
 *           Today's Mission, Ohayou celebration animation
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Edit3, Clock } from 'lucide-react';
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
  getOhtaniSheet,
} from '@/lib/store';
import type { SleepRecord, BodyLog } from '@/lib/types';
import { DAY_NAMES } from '@/lib/types';

// ===== Celebration Burst Animation =====
function CelebrationBurst() {
  // Ring of emojis that burst outward + float up
  const emojis = ['☀️','🌟','💪','🔥','⭐','✨','🎯','🌈','💥','🏋️','🥇','🌻'];
  const particles = emojis.map((emoji, i) => {
    const angle = (i / emojis.length) * 360;
    const rad = (angle * Math.PI) / 180;
    const distance = 120 + Math.random() * 60;
    return {
      id: i,
      emoji,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance - 40,
      delay: i * 0.04,
      size: 18 + Math.random() * 14,
    };
  });

  // Floating sparkles
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i + 100,
    x: (Math.random() - 0.5) * 300,
    delay: Math.random() * 0.6,
    emoji: ['✨','⭐','🌟','💫'][i % 4],
    size: 10 + Math.random() * 12,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Central flash */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 8, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute w-20 h-20 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,200,50,0.6) 0%, transparent 70%)' }}
      />

      {/* Burst ring */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: [0, p.y - 30, p.y + 60],
            scale: [0, 1.3, 0.6],
            opacity: [0, 1, 0],
            rotate: [0, 180 + Math.random() * 180],
          }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
          className="absolute"
          style={{ fontSize: `${p.size}px` }}
        >
          {p.emoji}
        </motion.div>
      ))}

      {/* Floating sparkles */}
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          initial={{ x: s.x, y: 100, opacity: 0, scale: 0 }}
          animate={{
            y: [100, -200],
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 0.8, 0],
          }}
          transition={{ duration: 2.5, delay: s.delay + 0.3, ease: 'easeOut' }}
          className="absolute"
          style={{ fontSize: `${s.size}px` }}
        >
          {s.emoji}
        </motion.div>
      ))}

      {/* Big sun entrance */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: [0, 1.5, 1], rotate: [-90, 20, 0] }}
        transition={{ duration: 1, delay: 0.1, type: 'spring', damping: 8 }}
        className="absolute text-7xl"
      >
        ☀️
      </motion.div>

      {/* Greeting text */}
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.5 }}
        animate={{ y: 80, opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 2.5, delay: 0.5 }}
        className="absolute text-center"
      >
        <p className="text-2xl font-bold font-display text-sunrise-orange drop-shadow-lg">
          おはよう！
        </p>
        <p className="text-sm text-foreground/80 mt-1 font-medium">
          今日も最高の一日にしよう
        </p>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const today = getToday();
  const todayDate = new Date();
  const dayName = DAY_NAMES[todayDate.getDay()];
  const monthDay = `${todayDate.getMonth() + 1}/${todayDate.getDate()}`;

  const [sleep, setSleep] = useState<SleepRecord>(() => getSleepRecord(today));
  const [body, setBody] = useState<BodyLog>(() => getBodyLog(today));
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationData, setMotivationData] = useState<{ category: string; item: string; message: string } | null>(null);
  const [showBodyEdit, setShowBodyEdit] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editWakeTime, setEditWakeTime] = useState('');
  const [editBedTime, setEditBedTime] = useState('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const schedule = getScheduleDay(today);

  useEffect(() => {
    setSleep(getSleepRecord(today));
    setBody(getBodyLog(today));
  }, [today]);

  const handleWakeUp = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = { ...sleep, wakeUpTime: timeStr };

    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySleep = getSleepRecord(formatDate(yesterday));
    if (yesterdaySleep.bedTime) {
      updated.sleepHours = calculateSleepHours(yesterdaySleep.bedTime, timeStr);
    }

    setSleep(updated);
    saveSleepRecord(updated);

    // Trigger celebration burst
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);

    // Show motivation after celebration
    const quote = getRandomOhtaniQuote();
    setMotivationData(quote);
    setTimeout(() => setShowMotivation(true), 1500);
  };

  const handleBedTime = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = { ...sleep, bedTime: timeStr };
    setSleep(updated);
    saveSleepRecord(updated);
    toast.success('おやすみなさい 🌙 良い夢を！');
  };

  const handleTimeSave = () => {
    const updated = { ...sleep };
    if (editWakeTime) updated.wakeUpTime = editWakeTime;
    if (editBedTime) updated.bedTime = editBedTime;

    // Recalculate sleep hours
    if (updated.bedTime && updated.wakeUpTime) {
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdaySleep = getSleepRecord(formatDate(yesterday));
      if (yesterdaySleep.bedTime) {
        updated.sleepHours = calculateSleepHours(yesterdaySleep.bedTime, updated.wakeUpTime);
      }
    }

    setSleep(updated);
    saveSleepRecord(updated);
    setShowTimeEdit(false);
    toast.success('時間を更新しました');
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
    if (s.trainingMuscles.length > 0) parts.push(s.trainingMuscles.join('・'));
    if (s.hasRunning) parts.push('ランニング');
    if (parts.length === 0) {
      return { emoji: '📋', title: 'ミッション未設定', sub: 'スケジュールタブからメニューを設定しよう！' };
    }
    return { emoji: '💪', title: parts.join(' + '), sub: '今日も全力で頑張ろう！' };
  };

  const mission = getMissionDisplay();
  const ohtaniSheet = getOhtaniSheet();

  return (
    <div className="px-4 pt-12 pb-4 space-y-4 relative">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && <CelebrationBurst />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Lean Bulk Tracker
        </h1>
        <p className="text-sm text-foreground/60 mt-0.5">{monthDay} の記録</p>
      </div>

      {/* Sleep Record Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-neu p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">睡眠記録</h3>
          {(sleep.wakeUpTime || sleep.bedTime) && (
            <button
              onClick={() => {
                setEditWakeTime(sleep.wakeUpTime || '');
                setEditBedTime(sleep.bedTime || '');
                setShowTimeEdit(true);
              }}
              className="text-xs text-sunrise-orange font-medium flex items-center gap-1 tap-active"
            >
              <Clock size={12} />
              時間を修正
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Ohayou Button */}
          <motion.button
            whileTap={{ scale: 0.88, rotate: -5 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleWakeUp}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
              sleep.wakeUpTime
                ? 'bg-sunrise-peach/60 shadow-inner'
                : 'bg-sunrise-warm-yellow/40 hover:bg-sunrise-warm-yellow/60 shadow-md'
            }`}
          >
            <motion.span
              className="text-3xl"
              animate={!sleep.wakeUpTime ? {
                rotate: [0, 20, -20, 15, -15, 0],
                scale: [1, 1.2, 1.1, 1.15, 1],
              } : {}}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
            >
              ☀️
            </motion.span>
            <span className="text-sm font-bold text-foreground">おはよう</span>
            {sleep.wakeUpTime && (
              <span className="text-xs font-medium text-foreground/70">{sleep.wakeUpTime}</span>
            )}
          </motion.button>

          {/* Oyasumi Button */}
          <motion.button
            whileTap={{ scale: 0.88, rotate: 5 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleBedTime}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
              sleep.bedTime
                ? 'bg-sunrise-lavender/60 shadow-inner'
                : 'bg-sunrise-lavender/30 hover:bg-sunrise-lavender/50 shadow-md'
            }`}
          >
            <span className="text-3xl">🌙</span>
            <span className="text-sm font-bold text-foreground">おやすみ</span>
            {sleep.bedTime && (
              <span className="text-xs font-medium text-foreground/70">{sleep.bedTime}</span>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Morning Body Log Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-neu p-5"
      >
        <h3 className="text-sm font-bold text-foreground mb-3">モーニング・ボディログ</h3>
        <div className="flex items-center gap-4">
          {/* Photo thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border">
            {body.photo ? (
              <img src={body.photo} alt="Body" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-foreground/40" />
            )}
          </div>

          {/* Camera + Album buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-sunrise-orange bg-sunrise-orange/10 rounded-lg px-3 py-1.5 tap-active"
            >
              <Camera size={13} />
              撮影
            </button>
            <button
              onClick={() => albumInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5 tap-active"
            >
              <ImageIcon size={13} />
              アルバム
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />
          <input
            ref={albumInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoCapture}
          />

          {/* Weight display */}
          <div className="flex-1 text-right">
            {body.weight ? (
              <div>
                <span className="text-2xl font-bold font-display text-foreground">{body.weight}</span>
                <span className="text-sm text-foreground/60 ml-1">kg</span>
                <div className="text-xs text-sunrise-green font-medium mt-0.5">記録済み ✓</div>
              </div>
            ) : (
              <div className="text-xs text-foreground/50">体重を記録しよう</div>
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
            className="bg-sunrise-lavender/30 border-sunrise-lavender/50 text-foreground font-medium shrink-0"
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
        <h3 className="text-sm font-bold text-foreground mb-3">
          今日のミッション（{dayName}曜日）
        </h3>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="text-4xl mb-2">{mission.emoji}</span>
          <h4 className="text-lg font-bold text-foreground">{mission.title}</h4>
          <p className="text-sm text-foreground/60 mt-1 whitespace-pre-line">{mission.sub}</p>
        </div>
      </motion.div>

      {/* ===== Ohayou Motivation Modal ===== */}
      <AnimatePresence>
        {showMotivation && motivationData && (
          <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
            <DialogContent className="max-w-[360px] rounded-2xl p-0 overflow-hidden border-0">
              {/* Animated header with gradient */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="bg-gradient-to-br from-sunrise-warm-yellow/60 via-sunrise-peach/50 to-sunrise-orange/30 p-6 text-center relative overflow-hidden"
              >
                {/* Background sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    className="absolute text-lg"
                    style={{
                      left: `${15 + i * 14}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                  >
                    ✨
                  </motion.span>
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 8, delay: 0.2 }}
                  className="text-5xl mb-2 relative z-10"
                >
                  ☀️
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold font-display text-foreground relative z-10"
                >
                  おはよう！
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-foreground/80 mt-1 font-medium relative z-10"
                >
                  今日も最高の一日にしよう
                </motion.p>
              </motion.div>

              {/* Ohtani Sheet - Category + Items only */}
              <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">
                    大谷シート
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ohtaniSheet.categories.map((cat, idx) => (
                      <motion.div
                        key={cat.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.05 }}
                        className={`rounded-xl p-3 ${
                          cat.id === motivationData.category || cat.name === motivationData.category
                            ? 'bg-sunrise-orange/15 border-2 border-sunrise-orange/40'
                            : 'bg-muted/60 border border-border/40'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-foreground mb-1.5">{cat.name}</h4>
                        <div className="space-y-0.5">
                          {cat.items.map((item, i) => (
                            <p
                              key={i}
                              className={`text-[11px] leading-tight ${
                                item === motivationData.item
                                  ? 'text-sunrise-orange font-bold'
                                  : 'text-foreground/60'
                              }`}
                            >
                              {item === motivationData.item ? '▸ ' : '・'}{item}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Today's focus highlight */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-sunrise-orange/10 rounded-xl p-4 text-center border border-sunrise-orange/20"
                >
                  <p className="text-xs text-foreground/50 mb-1">今日のフォーカス</p>
                  <p className="text-sm font-bold text-sunrise-orange">{motivationData.category}</p>
                  <p className="text-base font-bold text-foreground mt-1">{motivationData.item}</p>
                </motion.div>
              </div>

              <div className="px-5 pb-5">
                <Button
                  onClick={() => setShowMotivation(false)}
                  className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white font-bold h-12 text-base rounded-xl"
                >
                  今日も頑張る！ 💪
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* ===== Time Edit Dialog ===== */}
      <Dialog open={showTimeEdit} onOpenChange={setShowTimeEdit}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">時間を修正</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-1 block">おはよう時間</label>
              <Input
                type="time"
                value={editWakeTime}
                onChange={(e) => setEditWakeTime(e.target.value)}
                className="h-12 text-lg text-center text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-1 block">おやすみ時間</label>
              <Input
                type="time"
                value={editBedTime}
                onChange={(e) => setEditBedTime(e.target.value)}
                className="h-12 text-lg text-center text-foreground"
              />
            </div>
            <Button
              onClick={handleTimeSave}
              className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white font-bold"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Weight Edit Dialog ===== */}
      <Dialog open={showBodyEdit} onOpenChange={setShowBodyEdit}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">体重を記録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="68.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="text-2xl font-bold text-center h-14 text-foreground"
                autoFocus
              />
              <span className="text-lg text-foreground/60">kg</span>
            </div>
            <Button
              onClick={handleWeightSave}
              className="w-full bg-sunrise-orange hover:bg-sunrise-orange/90 text-white font-bold"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
