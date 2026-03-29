// ===== Weekly Challenge System =====
// 毎週月曜日にランダムなチャレンジが出現するシステム

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'sleep' | 'training' | 'running' | 'body' | 'mindset';
  target: number;
  unit: string;
  weekStart: string; // YYYY-MM-DD (Monday)
}

const CHALLENGES: Omit<WeeklyChallenge, 'id' | 'weekStart'>[] = [
  // Sleep challenges
  { title: '7時間睡眠チャレンジ', description: '今週は毎日7時間以上の睡眠を記録しよう！', emoji: '😴', category: 'sleep', target: 7, unit: '日' },
  { title: '早起きチャレンジ', description: '今週は毎日7時前に起きてみよう！', emoji: '🌅', category: 'sleep', target: 5, unit: '日' },
  { title: '規則正しい睡眠', description: '今週は毎日睡眠記録をつけよう！', emoji: '📊', category: 'sleep', target: 7, unit: '日' },
  // Training challenges
  { title: '全身トレーニング週間', description: '今週は全ての筋肉部位を最低1回ずつ鍛えよう！', emoji: '💪', category: 'training', target: 6, unit: '部位' },
  { title: '3日連続筋トレ', description: '今週は3日連続でトレーニングを記録しよう！', emoji: '🏋️', category: 'training', target: 3, unit: '連続日' },
  { title: '腹筋強化週間', description: '今週は腹筋を4回以上鍛えよう！', emoji: '🔥', category: 'training', target: 4, unit: '回' },
  // Running challenges
  { title: '週20km走破', description: '今週は合計20km以上走ろう！', emoji: '🏃', category: 'running', target: 20, unit: 'km' },
  { title: '毎日ランニング', description: '今週は毎日少しでもランニングを記録しよう！', emoji: '👟', category: 'running', target: 5, unit: '日' },
  { title: '長距離チャレンジ', description: '今週は1回で5km以上走ろう！', emoji: '🎯', category: 'running', target: 5, unit: 'km (1回)' },
  // Body challenges
  { title: '毎日体重記録', description: '今週は毎日体重を記録しよう！', emoji: '⚖️', category: 'body', target: 7, unit: '日' },
  { title: '毎日ボディフォト', description: '今週は毎日ボディフォトを撮ろう！', emoji: '📸', category: 'body', target: 5, unit: '枚' },
  // Mindset challenges
  { title: '大谷シート実践', description: '今週は大谷シートの項目を毎日1つ意識して過ごそう！', emoji: '🌟', category: 'mindset', target: 7, unit: '日' },
  { title: '完璧な1週間', description: '今週は睡眠・体重・トレーニングを全て記録しよう！', emoji: '🏆', category: 'mindset', target: 3, unit: '種類' },
];

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentWeeklyChallenge(): WeeklyChallenge {
  const weekStart = getWeekStartDate();
  const storageKey = 'lbt_weekly_challenge';

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as WeeklyChallenge;
      if (parsed.weekStart === weekStart) {
        return parsed;
      }
    }
  } catch { /* ignore */ }

  // Generate new challenge for this week using week start as seed
  const seed = weekStart.replace(/-/g, '');
  const seedNum = parseInt(seed, 10);
  const idx = seedNum % CHALLENGES.length;
  const template = CHALLENGES[idx];

  const challenge: WeeklyChallenge = {
    ...template,
    id: `challenge_${weekStart}`,
    weekStart,
  };

  localStorage.setItem(storageKey, JSON.stringify(challenge));
  return challenge;
}

// ===== Personal Records =====
export interface PersonalRecord {
  type: 'sleep' | 'running' | 'streak' | 'weight_gain' | 'weight_loss';
  value: number;
  date: string;
  label: string;
}

const PR_STORAGE_KEY = 'lbt_personal_records';

export function getPersonalRecords(): Record<string, PersonalRecord> {
  try {
    const raw = localStorage.getItem(PR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function checkAndUpdatePersonalRecord(
  type: PersonalRecord['type'],
  value: number,
  date: string,
  label: string
): { isNewRecord: boolean; previous: number | null } {
  const records = getPersonalRecords();
  const existing = records[type];

  let isNewRecord = false;
  const previous = existing?.value ?? null;

  if (!existing || value > existing.value) {
    records[type] = { type, value, date, label };
    localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(records));
    isNewRecord = true;
  }

  return { isNewRecord, previous };
}

// ===== Achievement Badges =====
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: string | null;
}

const ACHIEVEMENT_STORAGE_KEY = 'lbt_achievements';

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // === COMMON ===
  { id: 'first_record', title: '最初の一歩', description: '初めて記録をつけた', emoji: '🌱' },
  { id: 'streak_3', title: '三日坊主を超えた', description: '3日連続で記録をつけた', emoji: '✨' },
  { id: 'first_run', title: '初ラン', description: '初めてランニングを記録した', emoji: '👟' },
  { id: 'first_training', title: '初トレ', description: '初めてトレーニングを記録した', emoji: '🏋️' },
  { id: 'first_weight', title: '体重記録スタート', description: '初めて体重を記録した', emoji: '⚖️' },
  { id: 'first_photo', title: '初スナップ', description: '初めてボディフォトを撮影した', emoji: '📸' },
  // === RARE ===
  { id: 'streak_7', title: '一週間継続', description: '7日連続で記録をつけた', emoji: '🔥' },
  { id: 'streak_14', title: '二週間の鉄人', description: '14日連続で記録をつけた', emoji: '💪' },
  { id: 'runner_10km', title: 'ランナー', description: '累記10km走破', emoji: '🏃' },
  { id: 'runner_50km', title: 'ハーフマラソンランナー', description: '累記50km走破', emoji: '🏅' },
  { id: 'sleep_master', title: '睡眠マスター', description: '7時間以上の睡眠を１０回記録', emoji: '😴' },
  { id: 'weight_logger', title: '体重管理者', description: '体重を３０日分記録', emoji: '📊' },
  { id: 'muscle_all', title: '全身鍛錬', description: '全ての筋肉部位を記録', emoji: '💪' },
  { id: 'photo_10', title: 'フォトジェニック', description: 'ボディフォトを１０枚記録', emoji: '📸' },
  // === EPIC ===
  { id: 'streak_30', title: '一ヶ月継続', description: '30日連続で記録をつけた', emoji: '💎' },
  { id: 'streak_100', title: '100日の軌跡', description: '100日連続で記録をつけた', emoji: '🏆' },
  { id: 'runner_100km', title: 'マラソンマン', description: '累記100km走破', emoji: '🥇' },
  { id: 'sleep_master_30', title: '睡眠の超人', description: '7時間以上の睡眠を３０回記録', emoji: '🌙' },
  { id: 'photo_50', title: 'ボディビルダー', description: 'ボディフォトを５０枚記録', emoji: '🎥' },
  // === LEGENDARY ===
  { id: 'streak_365', title: '伝説の継続者', description: '365日連続で記録をつけた', emoji: '👑' },
  { id: 'runner_500km', title: 'ウルトラランナー', description: '累記500km走破', emoji: '🌍' },
  { id: 'weight_logger_365', title: '体重管理の山', description: '体重を３６５日分記録', emoji: '💯' },
  { id: 'all_perfect', title: '完璧な一日', description: '睡眠・体重・トレーニング・ランニングを同日に記録', emoji: '🌟' },
];

export function getAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    const unlocked: Record<string, string> = raw ? JSON.parse(raw) : {};
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlockedAt: unlocked[def.id] || null,
    }));
  } catch {
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({ ...def, unlockedAt: null }));
  }
}

export function unlockAchievement(id: string): boolean {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    const unlocked: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (unlocked[id]) return false; // already unlocked
    unlocked[id] = new Date().toISOString();
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlocked));
    return true;
  } catch {
    return false;
  }
}

export function checkAndUnlockAchievements(stats: {
  currentStreak: number;
  totalSleepGoodDays: number;
  totalRunningKm: number;
  totalWeightDays: number;
  hasAllMuscles: boolean;
  photoCount: number;
  totalRecordDays: number;
  hasRun?: boolean;
  hasTraining?: boolean;
  hasWeight?: boolean;
  hasPhoto?: boolean;
  hasPerfectDay?: boolean;
}): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const achievements = getAchievements();

  const check = (id: string, condition: boolean) => {
    if (condition) {
      const wasNew = unlockAchievement(id);
      if (wasNew) {
        const achievement = achievements.find((a) => a.id === id);
        if (achievement) newlyUnlocked.push({ ...achievement, unlockedAt: new Date().toISOString() });
      }
    }
  };

  // COMMON
  check('first_record', stats.totalRecordDays >= 1);
  check('streak_3', stats.currentStreak >= 3);
  check('first_run', stats.hasRun === true || stats.totalRunningKm > 0);
  check('first_training', stats.hasTraining === true || stats.totalRecordDays > 0);
  check('first_weight', stats.hasWeight === true || stats.totalWeightDays > 0);
  check('first_photo', stats.hasPhoto === true || stats.photoCount > 0);
  // RARE
  check('streak_7', stats.currentStreak >= 7);
  check('streak_14', stats.currentStreak >= 14);
  check('runner_10km', stats.totalRunningKm >= 10);
  check('runner_50km', stats.totalRunningKm >= 50);
  check('sleep_master', stats.totalSleepGoodDays >= 10);
  check('weight_logger', stats.totalWeightDays >= 30);
  check('muscle_all', stats.hasAllMuscles);
  check('photo_10', stats.photoCount >= 10);
  // EPIC
  check('streak_30', stats.currentStreak >= 30);
  check('streak_100', stats.currentStreak >= 100);
  check('runner_100km', stats.totalRunningKm >= 100);
  check('sleep_master_30', stats.totalSleepGoodDays >= 30);
  check('photo_50', stats.photoCount >= 50);
  // LEGENDARY
  check('streak_365', stats.currentStreak >= 365);
  check('runner_500km', stats.totalRunningKm >= 500);
  check('weight_logger_365', stats.totalWeightDays >= 365);
  check('all_perfect', stats.hasPerfectDay === true);

  return newlyUnlocked;
}
