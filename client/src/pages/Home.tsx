/**
 * Home Page - Lean Bulk Tracker
 * Design: Warm Sunrise - Soft Neumorphism with warm tones
 * Features: Sleep Record (editable times, cross-midnight support),
 *           Morning Body Log (camera + album), Daily Limit Challenge,
 *           Ohayou celebration animation
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Edit3, Clock, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getToday,
  getSleepRecord,
  saveSleepRecord,
  getBodyLog,
  saveBodyLog,
  getRandomOhtaniQuote,
  calculateSleepHours,
  formatDate,
  countLimitBreakthroughs,
  getLimitChallengeRecord,
  hasLimitChallengeInput,
  saveLimitChallengeRecord,
} from '@/lib/store';
import { savePhoto, getPhoto, migratePhotosFromLocalStorage } from '@/lib/photoDb';
import type {
  SleepRecord,
  BodyLog,
  LimitChallengeAxisKey,
  LimitChallengeRecord,
} from '@/lib/types';
import {
  DAY_NAMES,
  EMPTY_LIMIT_CHALLENGE_SCORES,
  LIMIT_CHALLENGE_AXES,
  LONG_TERM_GOAL,
} from '@/lib/types';

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

function LimitChallengeSliderRow({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const isBreakthrough = value !== null && value >= 100;
  const scoreTicks = [0, 50, 100, 110] as const;

  return (
    <div
      className={`rounded-2xl border p-3 transition-all ${
        isBreakthrough
          ? 'border-sunrise-orange/35 bg-sunrise-orange/10'
          : 'border-border/60 bg-white/70'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{label}</p>
            <p className="text-[11px] text-foreground/50">
              {isBreakthrough ? '限界突破' : value === null ? '未入力' : '積み上げ中'}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
            isBreakthrough
              ? 'border-sunrise-orange bg-sunrise-orange text-white'
              : 'border-border/60 bg-muted/50 text-foreground/70'
          }`}
        >
          {value !== null ? `${value}点` : '--'}
        </span>
      </div>

      <div className="mt-3 px-1">
        <div className="relative">
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-5 -translate-y-1/2 border-l border-dashed border-sunrise-orange/55"
            style={{ left: `${(100 / 110) * 100}%` }}
          />
          <Slider
            value={[value ?? 0]}
            min={0}
            max={110}
            step={10}
            onValueChange={([nextValue]) => onChange(nextValue)}
            className="w-full"
          />
        </div>
        <div className="relative mt-2 h-4 text-[10px] text-foreground/40">
          {scoreTicks.map((tick) => {
            const isEdgeStart = tick === 0;
            const isEdgeEnd = tick === 110;
            return (
              <span
                key={tick}
                className={`absolute top-0 ${tick === 100 ? 'font-semibold text-sunrise-orange' : ''}`}
                style={{
                  left: `${(tick / 110) * 100}%`,
                  transform: isEdgeStart ? 'translateX(0)' : isEdgeEnd ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {tick}
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] font-medium text-sunrise-orange/80">破線が100点ラインです</p>
      </div>
    </div>
  );
}

// ===== 日付跨ぎ判定ヘルパー =====
// 深夜0〜5時に「おやすみ」を押した場合は「前日」のレコードとして扱う
function getBedTimeDate(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) {
    // 前日の日付を返す
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return formatDate(prev);
  }
  return formatDate(now);
}

export default function Home() {
  const today = getToday();
  const todayDate = new Date();
  const dayName = DAY_NAMES[todayDate.getDay()];
  const monthDay = `${todayDate.getMonth() + 1}/${todayDate.getDate()}`;

  const [sleep, setSleep] = useState<SleepRecord>(() => getSleepRecord(today));
  // 「おやすみ」が前日扱いになる場合に前日のレコードも表示
  const [prevDaySleep, setPrevDaySleep] = useState<SleepRecord | null>(null);
  const [body, setBody] = useState<BodyLog>(() => getBodyLog(today));
  // IndexedDBから取得した今日の写真URL（表示用）
  const [todayPhotoUrl, setTodayPhotoUrl] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationData, setMotivationData] = useState<{ category: string; item: string; message: string } | null>(null);
  const [showBodyEdit, setShowBodyEdit] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [limitChallenge, setLimitChallenge] = useState<LimitChallengeRecord>(() => getLimitChallengeRecord(today));
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editWakeTime, setEditWakeTime] = useState('');
  const [editBedTime, setEditBedTime] = useState('');
  // おやすみ時間編集：どの日付に保存するかを選択できる
  const [editBedDate, setEditBedDate] = useState(today);
  // 深夜帯（0〜5時）かどうか
  const isLateNight = todayDate.getHours() < 5;

  const albumInputRef = useRef<HTMLInputElement>(null);

  // 初回マウント時: localStorageからIndexedDBへの移行 + 今日の写真を読み込む
  useEffect(() => {
    const init = async () => {
      // 既存データの移行（初回のみ）
      await migratePhotosFromLocalStorage();
      // 今日の写真をIndexedDBから取得
      const photo = await getPhoto(today);
      setTodayPhotoUrl(photo);
    };
    init();
  }, [today]);

  useEffect(() => {
    setSleep(getSleepRecord(today));
    setBody(getBodyLog(today));
    setLimitChallenge(getLimitChallengeRecord(today));

    // 深夜帯の場合は前日のレコードも読み込む（おやすみ時間の表示用）
    if (isLateNight) {
      const prev = new Date(todayDate);
      prev.setDate(prev.getDate() - 1);
      const prevRecord = getSleepRecord(formatDate(prev));
      setPrevDaySleep(prevRecord);
    }
  }, [today]);

  useEffect(() => {
    if (!hasLimitChallengeInput(limitChallenge)) return;

    saveLimitChallengeRecord({
      ...limitChallenge,
      date: today,
      updatedAt: new Date().toISOString(),
    });
  }, [today, limitChallenge]);

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
    
    // 深夜0〜5時の場合は前日のレコードに保存する
    const targetDate = getBedTimeDate(now);
    const targetRecord = getSleepRecord(targetDate);
    const updated = { ...targetRecord, bedTime: timeStr };
    saveSleepRecord(updated);

    if (targetDate === today) {
      setSleep(updated);
    } else {
      // 前日扱いの場合は prevDaySleep を更新
      setPrevDaySleep(updated);
      toast.success(`おやすみなさい 🌙 （${targetDate.slice(5).replace('-', '/')}の記録として保存）`);
      return;
    }
    toast.success('おやすみなさい 🌙 良い夢を！');
  };

  const handleTimeSave = () => {
    // おはよう時間は今日のレコードに保存
    const updatedToday = { ...sleep };
    if (editWakeTime) updatedToday.wakeUpTime = editWakeTime;

    // おやすみ時間は選択した日付のレコードに保存
    if (editBedTime) {
      const targetRecord = getSleepRecord(editBedDate);
      const updatedBed = { ...targetRecord, bedTime: editBedTime };
      saveSleepRecord(updatedBed);

      // 今日のレコードの睡眠時間を再計算
      if (editBedDate !== today && updatedToday.wakeUpTime) {
        updatedToday.sleepHours = calculateSleepHours(editBedTime, updatedToday.wakeUpTime);
      } else if (editBedDate === today && updatedToday.wakeUpTime) {
        updatedToday.bedTime = editBedTime;
        updatedToday.sleepHours = calculateSleepHours(editBedTime, updatedToday.wakeUpTime);
      }

      if (editBedDate !== today) {
        setPrevDaySleep(updatedBed);
      }
    }

    // 今日のおはよう時間と前日のおやすみ時間から睡眠時間を計算
    if (editWakeTime && editBedDate !== today) {
      const prevRecord = getSleepRecord(editBedDate);
      const bedT = editBedTime || prevRecord.bedTime;
      if (bedT) {
        updatedToday.sleepHours = calculateSleepHours(bedT, editWakeTime);
      }
    } else if (editWakeTime && editBedTime && editBedDate === today) {
      updatedToday.sleepHours = calculateSleepHours(editBedTime, editWakeTime);
    }

    setSleep(updatedToday);
    saveSleepRecord(updatedToday);
    setShowTimeEdit(false);
    toast.success('時間を更新しました');
  };

  // 写真をIndexedDBに保存する（大容量対応）
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        // IndexedDBに保存（localStorageには保存しない）
        await savePhoto(today, dataUrl);
        // 表示用のURLを更新
        setTodayPhotoUrl(dataUrl);
        // localStorageにはphotoなしで体重データのみ保存
        const updated = { ...body, photo: null };
        setBody(updated);
        saveBodyLog(updated);
        toast.success('ボディフォトを保存しました 📸');
      } catch (err) {
        console.error('[Home] 写真保存エラー:', err);
        toast.error('写真の保存に失敗しました。ストレージ容量を確認してください。');
      }
    };
    reader.readAsDataURL(file);
    // 同じファイルを再選択できるようにリセット
    e.target.value = '';
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

  const handleLimitScoreChange = (axisKey: LimitChallengeAxisKey, value: number) => {
    setLimitChallenge((prev) => ({
      ...prev,
      date: today,
      scores: {
        ...EMPTY_LIMIT_CHALLENGE_SCORES,
        ...prev.scores,
        [axisKey]: value,
      },
    }));
  };

  const handleLimitChallengeSave = () => {
    const allAxesFilled = LIMIT_CHALLENGE_AXES.every((axis) => limitChallenge.scores[axis.key] !== null);
    if (!allAxesFilled) {
      toast.error('5軸すべての点数を入力してください');
      return;
    }

    const record: LimitChallengeRecord = {
      ...limitChallenge,
      date: today,
      comment: limitChallenge.comment.trim(),
      updatedAt: new Date().toISOString(),
    };

    saveLimitChallengeRecord(record);
    setLimitChallenge(record);

    const breakthroughCount = countLimitBreakthroughs(record);
    toast.success(
      breakthroughCount > 0
        ? `限界チャレンジを保存しました（${breakthroughCount}/5軸で限界突破）`
        : '限界チャレンジを保存しました'
    );
  };

  // 表示するおやすみ時間：今日のレコードまたは前日のレコード（深夜帯）
  const displayBedTime = sleep.bedTime || (isLateNight && prevDaySleep?.bedTime) || null;
  const displayBedDateLabel = sleep.bedTime
    ? null
    : isLateNight && prevDaySleep?.bedTime
    ? '(昨日)'
    : null;
  const allLimitAxesFilled = LIMIT_CHALLENGE_AXES.every((axis) => limitChallenge.scores[axis.key] !== null);
  const limitBreakthroughCount = countLimitBreakthroughs(limitChallenge);

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
          <div className="flex items-center gap-2">
            {/* 深夜帯の場合に「前日のおやすみ」バッジを表示 */}
            {isLateNight && (
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Moon size={9} />
                深夜モード
              </span>
            )}
            {(sleep.wakeUpTime || sleep.bedTime || displayBedTime) && (
              <button
                onClick={() => {
                  setEditWakeTime(sleep.wakeUpTime || '');
                  setEditBedTime(sleep.bedTime || prevDaySleep?.bedTime || '');
                  // 前日のおやすみが存在する場合は前日の日付をデフォルトに
                  if (!sleep.bedTime && isLateNight && prevDaySleep?.bedTime) {
                    const prev = new Date(todayDate);
                    prev.setDate(prev.getDate() - 1);
                    setEditBedDate(formatDate(prev));
                  } else {
                    setEditBedDate(today);
                  }
                  setShowTimeEdit(true);
                }}
                className="text-xs text-sunrise-orange font-medium flex items-center gap-1 tap-active"
              >
                <Clock size={12} />
                時間を修正
              </button>
            )}
          </div>
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
              displayBedTime
                ? 'bg-sunrise-lavender/60 shadow-inner'
                : 'bg-sunrise-lavender/30 hover:bg-sunrise-lavender/50 shadow-md'
            }`}
          >
            <span className="text-3xl">🌙</span>
            <span className="text-sm font-bold text-foreground">おやすみ</span>
            {displayBedTime && (
              <div className="text-center">
                <span className="text-xs font-medium text-foreground/70">{displayBedTime}</span>
                {displayBedDateLabel && (
                  <span className="text-[10px] text-indigo-500 ml-1">{displayBedDateLabel}</span>
                )}
              </div>
            )}
            {/* 深夜帯で未記録の場合はヒントを表示 */}
            {isLateNight && !displayBedTime && (
              <span className="text-[10px] text-indigo-400 text-center leading-tight">前日の記録に<br/>保存されます</span>
            )}
          </motion.button>
        </div>

        {/* 睡眠時間の表示 */}
        {sleep.sleepHours && (
          <div className="mt-3 text-center bg-indigo-50 rounded-xl py-2">
            <span className="text-sm font-bold text-indigo-600">
              睡眠時間: {sleep.sleepHours.toFixed(1)}h
            </span>
            {sleep.sleepHours >= 7 ? (
              <span className="text-xs text-indigo-400 ml-2">理想的！</span>
            ) : sleep.sleepHours >= 6 ? (
              <span className="text-xs text-yellow-500 ml-2">もう少し</span>
            ) : (
              <span className="text-xs text-red-400 ml-2">睡眠不足</span>
            )}
          </div>
        )}
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
          {/* Photo thumbnail（IndexedDBから取得した写真を表示） */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border">
            {todayPhotoUrl ? (
              <img src={todayPhotoUrl} alt="Body" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={24} className="text-foreground/40" />
            )}
          </div>

          {/* Album button */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => albumInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-sunrise-orange bg-sunrise-orange/10 rounded-lg px-3 py-1.5 tap-active"
            >
              <ImageIcon size={13} />
              アルバムから選択
            </button>
          </div>

          {/* Hidden file input */}
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

      {/* Daily Limit Challenge Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-neu p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">今日の限界チャレンジ（{dayName}曜日）</h3>
            <p className="text-xs text-foreground/55 mt-1">5軸を0〜110点で採点。100点以上が限界突破です。</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-sunrise-orange/20 bg-sunrise-orange/10 px-3 py-2 text-center">
            <p className="text-[10px] text-foreground/50">突破軸</p>
            <p className="text-lg font-bold font-display text-sunrise-orange">{limitBreakthroughCount}/5</p>
          </div>
        </div>

        <div className="space-y-3">
          {LIMIT_CHALLENGE_AXES.map((axis) => (
            <LimitChallengeSliderRow
              key={axis.key}
              label={axis.label}
              emoji={axis.emoji}
              value={limitChallenge.scores[axis.key]}
              onChange={(value) => handleLimitScoreChange(axis.key, value)}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-foreground/70">ひとことコメント（任意）</label>
          <Textarea
            value={limitChallenge.comment}
            onChange={(e) => setLimitChallenge((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="今日はどこで自分を超えられたか、残しておきたい一言があれば記録"
            className="mt-2 min-h-24 rounded-2xl bg-white/70"
            maxLength={160}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {allLimitAxesFilled ? '5軸の入力がそろいました' : '入力内容は自動で下書き保存されます'}
            </p>
            <p className="text-[11px] text-foreground/55 mt-0.5">
              {allLimitAxesFilled
                ? '必要なら上書き保存で記録完了できます。履歴は「限界」タブで振り返れます。'
                : '途中入力でも消えずに残ります。5軸そろうと見返しやすくなります。'}
            </p>
          </div>
          <Button
            onClick={handleLimitChallengeSave}
            disabled={!allLimitAxesFilled}
            className="shrink-0 bg-sunrise-orange hover:bg-sunrise-orange/90 text-white rounded-xl disabled:opacity-50"
          >
            上書き保存
          </Button>
        </div>
      </motion.div>

      {/* ===== Ohayou Motivation Modal ===== */}
      <AnimatePresence>
        {showMotivation && motivationData && (
          <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
            <DialogContent className="max-w-[360px] max-h-[85vh] rounded-2xl p-0 overflow-y-auto border-0">
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
                {/* Long-term goal — subtle but visible */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-3 px-3 py-1.5 bg-black/10 rounded-lg relative z-10 inline-block"
                >
                  {LONG_TERM_GOAL.split('\n').map((line, i) => (
                    <p key={i} className={`text-[11px] text-foreground/70 leading-snug ${i === 0 ? 'font-semibold' : 'font-medium'}`}>{line}</p>
                  ))}
                </motion.div>
              </motion.div>

              {/* Today's focus - 大谷シートから1つだけ表示 */}
              <div className="p-5 space-y-3">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-sunrise-orange/10 rounded-2xl p-5 text-center border border-sunrise-orange/20"
                >
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">
                    大谷シートより — 今日のフォーカス
                  </p>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  >
                    <span className="inline-block bg-sunrise-orange/20 text-sunrise-orange text-xs font-bold px-3 py-1 rounded-full mb-2">
                      {motivationData.category}
                    </span>
                    <p className="text-xl font-bold text-foreground mt-2">{motivationData.item}</p>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm text-foreground/70 mt-3 leading-relaxed whitespace-pre-line"
                  >
                    {motivationData.message}
                  </motion.p>
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
              <label className="text-sm font-medium text-foreground/70 mb-1 block">おはよう時間（今日）</label>
              <Input
                type="time"
                value={editWakeTime}
                onChange={(e) => setEditWakeTime(e.target.value)}
                className="h-12 text-lg text-center text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-1 block">おやすみ時間</label>
              {/* おやすみ日付の選択（今日 or 昨日） */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setEditBedDate(today)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editBedDate === today
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-foreground/60'
                  }`}
                >
                  今日 ({today.slice(5).replace('-', '/')})
                </button>
                <button
                  onClick={() => {
                    const prev = new Date(todayDate);
                    prev.setDate(prev.getDate() - 1);
                    setEditBedDate(formatDate(prev));
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editBedDate !== today
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-foreground/60'
                  }`}
                >
                  昨日 ({(() => {
                    const prev = new Date(todayDate);
                    prev.setDate(prev.getDate() - 1);
                    return formatDate(prev).slice(5).replace('-', '/');
                  })()})
                </button>
              </div>
              <Input
                type="time"
                value={editBedTime}
                onChange={(e) => setEditBedTime(e.target.value)}
                className="h-12 text-lg text-center text-foreground"
              />
              {editBedDate !== today && (
                <p className="text-xs text-indigo-500 mt-1 text-center">
                  昨日（{editBedDate.slice(5).replace('-', '/')}）のおやすみ記録として保存されます
                </p>
              )}
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
