/*
 * Challenge Page - Streak & Achievements
 * エンターテイメント感あふれる実績・ストリーク管理ページ
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  calculateStreak,
  getAllTrainingRecords,
  getAllRunningRecords,
  getAllSleepRecords,
  getAllBodyLogs,
} from '@/lib/store';
import { getPhotoCount } from '@/lib/photoDb';
import {
  getAchievements,
  checkAndUnlockAchievements,
  type Achievement,
} from '@/lib/weeklyChallenge';

// ===== Achievement definitions (豊富なバリエーション) =====
// NOTE: The actual definitions live in weeklyChallenge.ts — here we just display them.

// Rarity tiers for visual styling
function getRarity(id: string): 'legendary' | 'epic' | 'rare' | 'common' {
  const legendary = ['streak_365', 'runner_500km', 'weight_logger_365', 'all_perfect'];
  const epic = ['streak_100', 'runner_100km', 'streak_30', 'sleep_master_30', 'photo_50'];
  const rare = ['streak_14', 'runner_50km', 'sleep_master', 'weight_logger', 'muscle_all', 'photo_10'];
  if (legendary.includes(id)) return 'legendary';
  if (epic.includes(id)) return 'epic';
  if (rare.includes(id)) return 'rare';
  return 'common';
}

const RARITY_STYLES = {
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100',
    border: 'border-yellow-400',
    glow: 'shadow-lg shadow-yellow-200',
    badge: 'bg-yellow-500 text-white',
    label: 'LEGENDARY',
  },
  epic: {
    bg: 'bg-gradient-to-br from-purple-100 via-violet-50 to-indigo-100',
    border: 'border-purple-400',
    glow: 'shadow-lg shadow-purple-200',
    badge: 'bg-purple-600 text-white',
    label: 'EPIC',
  },
  rare: {
    bg: 'bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100',
    border: 'border-blue-400',
    glow: 'shadow-md shadow-blue-200',
    badge: 'bg-blue-500 text-white',
    label: 'RARE',
  },
  common: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-300',
    glow: 'shadow-sm',
    badge: 'bg-green-500 text-white',
    label: 'COMMON',
  },
};

// ===== Streak Display =====
function StreakDisplay({ currentStreak, longestStreak, totalDays }: {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}) {
  const getStreakEmoji = (n: number) => {
    if (n >= 365) return '👑';
    if (n >= 100) return '🏆';
    if (n >= 30) return '💎';
    if (n >= 14) return '🔥';
    if (n >= 7) return '⭐';
    if (n >= 3) return '✨';
    return '🌱';
  };

  const getStreakTitle = (n: number) => {
    if (n >= 365) return '伝説の継続者';
    if (n >= 100) return '100日の勇者';
    if (n >= 30) return '一ヶ月の戦士';
    if (n >= 14) return '二週間の鉄人';
    if (n >= 7) return '一週間の達人';
    if (n >= 3) return '三日坊主を超えた';
    if (n >= 1) return '記録中';
    return '今日から始めよう';
  };

  const nextMilestone = currentStreak < 3 ? 3
    : currentStreak < 7 ? 7
    : currentStreak < 14 ? 14
    : currentStreak < 30 ? 30
    : currentStreak < 100 ? 100
    : currentStreak < 365 ? 365
    : null;

  const progress = nextMilestone
    ? (currentStreak / nextMilestone) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-neu p-5 space-y-4"
    >
      {/* Hero streak */}
      <div className="text-center py-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ background: currentStreak >= 7 ? 'radial-gradient(circle, #f97316, transparent)' : 'radial-gradient(circle, #86efac, transparent)' }}
          />
        </div>

        <motion.div
          animate={currentStreak > 0 ? {
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="text-6xl mb-2 relative z-10"
        >
          {getStreakEmoji(currentStreak)}
        </motion.div>

        <motion.p
          className="text-5xl font-bold font-display text-sunrise-orange relative z-10"
          key={currentStreak}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {currentStreak}
        </motion.p>
        <p className="text-sm text-foreground/60 mt-1 relative z-10">日連続記録</p>
        <p className="text-xs font-bold text-foreground/80 mt-1 relative z-10">{getStreakTitle(currentStreak)}</p>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div>
          <div className="flex justify-between text-xs text-foreground/50 mb-1">
            <span>次のマイルストーン: {nextMilestone}日</span>
            <span>あと{nextMilestone - currentStreak}日</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
              }}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 text-center border border-purple-100">
          <div className="text-2xl mb-1">🏅</div>
          <p className="text-xl font-bold font-display text-purple-600">{longestStreak}</p>
          <p className="text-[10px] text-foreground/50">最長記録</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl mb-1">📅</div>
          <p className="text-xl font-bold font-display text-green-600">{totalDays}</p>
          <p className="text-[10px] text-foreground/50">総記録日</p>
        </div>
      </div>

      {/* Motivational message */}
      <div className="text-center text-xs text-foreground/60 bg-muted/40 rounded-lg py-2 px-3">
        {currentStreak === 0
          ? '今日から記録を始めよう！最初の一歩が大切です 🌱'
          : currentStreak < 3
          ? `${currentStreak}日目！3日まであと${3 - currentStreak}日。三日坊主を超えよう ✨`
          : currentStreak < 7
          ? `${currentStreak}日連続！7日まであと${7 - currentStreak}日 ⭐`
          : currentStreak < 14
          ? `${currentStreak}日連続！14日まであと${14 - currentStreak}日 🔥`
          : currentStreak < 30
          ? `${currentStreak}日連続！この調子で30日を目指そう 💎`
          : currentStreak < 100
          ? `${currentStreak}日連続！100日まであと${100 - currentStreak}日 🏆`
          : `${currentStreak}日連続！素晴らしい継続力です 👑`}
      </div>
    </motion.div>
  );
}

// ===== Achievement Card =====
function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const rarity = getRarity(achievement.id);
  const style = RARITY_STYLES[rarity];
  const isUnlocked = achievement.unlockedAt !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      className={`relative rounded-2xl p-3 border-2 transition-all ${
        isUnlocked
          ? `${style.bg} ${style.border} ${style.glow}`
          : 'bg-muted/20 border-border/20 opacity-40'
      }`}
    >
      {/* Rarity badge */}
      {isUnlocked && (
        <div className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>
          {style.label}
        </div>
      )}

      {/* Sparkle animation for legendary */}
      {isUnlocked && rarity === 'legendary' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none"
        >
          {['✨', '⭐', '✨', '⭐'].map((s, i) => (
            <span
              key={i}
              className="absolute text-[10px]"
              style={{
                top: i < 2 ? (i === 0 ? '-4px' : 'auto') : '50%',
                bottom: i >= 2 ? (i === 2 ? '-4px' : 'auto') : 'auto',
                left: i % 2 === 0 ? '10%' : 'auto',
                right: i % 2 === 1 ? '10%' : 'auto',
              }}
            >
              {s}
            </span>
          ))}
        </motion.div>
      )}

      <div className="text-center">
        <motion.div
          className="text-3xl mb-1"
          animate={isUnlocked && rarity !== 'common' ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {isUnlocked ? achievement.emoji : '🔒'}
        </motion.div>
        <p className="text-[10px] font-bold text-foreground/80 leading-tight">
          {isUnlocked ? achievement.title : '???'}
        </p>
        {isUnlocked && achievement.unlockedAt && (
          <p className="text-[8px] text-foreground/40 mt-0.5">
            {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ===== Achievement Unlock Animation =====
function UnlockCelebration({ achievement, onDone }: { achievement: Achievement; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-[280px] mx-4"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 0.8 }}
          className="text-6xl mb-3"
        >
          {achievement.emoji}
        </motion.div>
        <div className="text-xs font-bold text-sunrise-orange uppercase tracking-widest mb-1">
          実績解除！
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{achievement.title}</h3>
        <p className="text-sm text-foreground/60">{achievement.description}</p>
        <div className="mt-4 text-xs text-foreground/40">タップして閉じる</div>
      </motion.div>
    </motion.div>
  );
}

// ===== Main Challenge Page =====
export default function Challenge() {
  const [photoCount, setPhotoCount] = useState(0);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [showUnlock, setShowUnlock] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const streakData = useMemo(() => calculateStreak(), []);
  const achievements = useMemo(() => getAchievements(), []);

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;

  useEffect(() => {
    getPhotoCount().then((count) => {
      setPhotoCount(count);

      const trainingRecords = getAllTrainingRecords();
      const runningRecords = getAllRunningRecords();
      const sleepRecords = getAllSleepRecords();
      const bodyLogs = getAllBodyLogs();

      const totalRunningKm = Object.values(runningRecords).reduce((sum, r) => sum + (r.distance || 0), 0);
      const totalWeightDays = Object.values(bodyLogs).filter((b) => b.weight).length;
      const totalSleepGoodDays = Object.values(sleepRecords).filter((s) => (s.sleepHours || 0) >= 7).length;
      const muscleGroupsUsed = new Set<string>();
      Object.values(trainingRecords).forEach((r) => r.muscleGroups.forEach((m) => muscleGroupsUsed.add(m)));
      const hasAllMuscles = ['胸', '背中', '肩', '腕', '脚', '腹筋'].every((m) => muscleGroupsUsed.has(m));

      const newly = checkAndUnlockAchievements({
        currentStreak: streakData.currentStreak,
        totalSleepGoodDays,
        totalRunningKm,
        totalWeightDays,
        hasAllMuscles,
        photoCount: count,
        totalRecordDays: streakData.totalDays,
      });

      if (newly.length > 0) {
        setNewlyUnlocked(newly);
        // Show unlock animations sequentially
        newly.forEach((a, i) => {
          setTimeout(() => {
            setShowUnlock(a);
          }, i * 3200);
        });
      }
    }).catch(() => {});
  }, [streakData]);

  const filteredAchievements = achievements.filter((a) => {
    if (activeFilter === 'unlocked') return a.unlockedAt !== null;
    if (activeFilter === 'locked') return a.unlockedAt === null;
    return true;
  });

  // Group by rarity for display
  const groupedByRarity = {
    legendary: filteredAchievements.filter((a) => getRarity(a.id) === 'legendary'),
    epic: filteredAchievements.filter((a) => getRarity(a.id) === 'epic'),
    rare: filteredAchievements.filter((a) => getRarity(a.id) === 'rare'),
    common: filteredAchievements.filter((a) => getRarity(a.id) === 'common'),
  };

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">チャレンジ</h1>
        <p className="text-sm text-foreground/60 mt-0.5">継続の記録と実績</p>
      </div>

      {/* Streak */}
      <StreakDisplay
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
        totalDays={streakData.totalDays}
      />

      {/* Achievement overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-neu p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">実績コレクション</h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              {unlockedCount}/{achievements.length} 解除済み
            </p>
          </div>
          {/* Progress ring */}
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(unlockedCount / achievements.length) * 100} 100`}
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${(unlockedCount / achievements.length) * 100} 100` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-sunrise-orange text-white'
                  : 'bg-muted text-foreground/60'
              }`}
            >
              {f === 'all' ? 'すべて' : f === 'unlocked' ? '解除済み' : '未解除'}
            </button>
          ))}
        </div>

        {/* Achievements by rarity */}
        {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => {
          const group = groupedByRarity[rarity];
          if (group.length === 0) return null;
          const style = RARITY_STYLES[rarity];
          return (
            <div key={rarity} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.label}
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {group.map((a, i) => (
                  <AchievementCard key={a.id} achievement={a} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Unlock celebration overlay */}
      <AnimatePresence>
        {showUnlock && (
          <UnlockCelebration
            achievement={showUnlock}
            onDone={() => setShowUnlock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
