/**
 * Home Page - Lean Bulk Tracker
 * Design: Warm Sunrise - Soft Neumorphism with warm tones
 * Sections: Sleep Record, Morning Body Log, Today's Mission
 * Ohayou tap: Fun confetti-like animation + Ohtani sheet (category + items only)
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Edit3 } from 'lucide-react';
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

// Confetti particle component for fun ohayou animation
function ConfettiParticles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    size: 6 + Math.random() * 10,
    emoji: ['☀️', '🌟', '⭐', '✨', '💪', '🔥', '🌈', '🎯'][i % 8],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}%`, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            y: ['0%', '120%'],
            scale: [0, 1.2, 0.8],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{ fontSize: `${p.size}px` }}
        >
          {p.emoji}
        </motion.div>
      ))}
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
  const [showMotivation, setShowMotivation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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
    
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySleep = getSleepRecord(formatDate(yesterday));
    if (yesterdaySleep.bedTime) {
      updated.sleepHours = calculateSleepHours(yesterdaySleep.bedTime, timeStr);
    }
    
    setSleep(updated);
    saveSleepRecord(updated);
    
    // Trigger confetti + motivation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    const quote = getRandomOhtaniQuote();
    setMotivationData(quote);
    setTimeout(() => setShowMotivation(true), 400);
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

  // Get ohtani sheet for the motivation modal (categories + items only)
  const ohtaniSheet = getOhtaniSheet();

  return (
    <div className="px-4 pt-12 pb-4 space-y-4 relative">
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && <ConfettiParticles />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Lean Bulk Tracker
        </h1>
        <p className="text-sm text-foreground/60 mt-0.5">
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
        <h3 className="text-sm font-bold text-foreground mb-3">睡眠記録</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Ohayou Button */}
          <motion.button
            whileTap={{ scale: 0.92, rotate: -3 }}
            onClick={handleWakeUp}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
              sleep.wakeUpTime
                ? 'bg-sunrise-peach/60 shadow-inner'
                : 'bg-sunrise-warm-yellow/40 hover:bg-sunrise-warm-yellow/60 shadow-md'
            }`}
          >
            <motion.span
              className="text-3xl"
              animate={!sleep.wakeUpTime ? { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
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
            whileTap={{ scale: 0.92, rotate: 3 }}
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0 tap-active border border-border"
          >
            {body.photo ? (
              <img src={body.photo} alt="Body" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-foreground/40" />
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
                <span className="text-3xl font-bold font-display text-foreground">{body.weight}</span>
                <span className="text-sm text-foreground/60 ml-1">kg</span>
                <div className="text-xs text-sunrise-green font-medium mt-1">記録済み ✓</div>
              </div>
            ) : (
              <div className="text-sm text-foreground/50">体重を記録しよう</div>
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
            className="bg-sunrise-lavender/30 border-sunrise-lavender/50 text-foreground font-medium"
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

      {/* Ohayou Motivation Modal - Shows Ohtani Sheet (category + items only) */}
      <AnimatePresence>
        {showMotivation && motivationData && (
          <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
            <DialogContent className="max-w-[360px] rounded-2xl p-0 overflow-hidden border-0">
              {/* Animated header */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="bg-gradient-to-br from-sunrise-warm-yellow/50 via-sunrise-peach/40 to-sunrise-orange/20 p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                  className="text-5xl mb-2"
                >
                  ☀️
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold font-display text-foreground"
                >
                  おはよう！
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-foreground/70 mt-1"
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
                            : 'bg-muted/50 border border-border/30'
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
                  今日も頑張る！
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Weight Edit Dialog */}
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
