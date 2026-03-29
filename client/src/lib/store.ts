// ===== localStorage-based Store for Lean Bulk Tracker =====
import {
  type SleepRecord,
  type BodyLog,
  type ScheduleDay,
  type MuscleHeatmap,
  type AppSettings,
  type OhtaniSheet,
  type MuscleGroup,
  DEFAULT_OHTANI_SHEET,
} from './types';

const STORAGE_KEYS = {
  SLEEP_RECORDS: 'lbt_sleep_records',
  BODY_LOGS: 'lbt_body_logs',
  SCHEDULE: 'lbt_schedule',
  MUSCLE_HEATMAP: 'lbt_muscle_heatmap',
  SETTINGS: 'lbt_settings',
  RUNNING_RECORDS: 'lbt_running_records',
  TRAINING_RECORDS: 'lbt_training_records',
} as const;

// ===== Helper Functions =====
export function getToday(): string {
  const now = new Date();
  return formatDate(now);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function getWeekDates(baseDate?: string): string[] {
  const base = baseDate ? parseDate(baseDate) : new Date();
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((day + 6) % 7));
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== Sleep Records =====
export function getSleepRecord(date: string): SleepRecord {
  const records = loadJSON<Record<string, SleepRecord>>(STORAGE_KEYS.SLEEP_RECORDS, {});
  return records[date] || { date, wakeUpTime: null, bedTime: null, sleepHours: null };
}

export function saveSleepRecord(record: SleepRecord): void {
  const records = loadJSON<Record<string, SleepRecord>>(STORAGE_KEYS.SLEEP_RECORDS, {});
  records[record.date] = record;
  saveJSON(STORAGE_KEYS.SLEEP_RECORDS, records);
}

export function getAllSleepRecords(): Record<string, SleepRecord> {
  return loadJSON<Record<string, SleepRecord>>(STORAGE_KEYS.SLEEP_RECORDS, {});
}

// ===== Body Logs =====
// 注意: photoフィールドはIndexedDB（photoDb.ts）で管理します。
// localStorageには体重データのみ保存し、写真は別途IndexedDBから非同期取得してください。
export function getBodyLog(date: string): BodyLog {
  const logs = loadJSON<Record<string, BodyLog>>(STORAGE_KEYS.BODY_LOGS, {});
  // photoはIndexedDB管理のため、localStorageからは常にnullを返す
  return logs[date] || { date, weight: null, photo: null };
}

export function saveBodyLog(log: BodyLog): void {
  const logs = loadJSON<Record<string, BodyLog>>(STORAGE_KEYS.BODY_LOGS, {});
  // photoはIndexedDB管理のため、localStorageには保存しない
  const { photo: _photo, ...logWithoutPhoto } = log;
  logs[log.date] = { ...logWithoutPhoto, photo: null };
  saveJSON(STORAGE_KEYS.BODY_LOGS, logs);
}

export function getAllBodyLogs(): Record<string, BodyLog> {
  return loadJSON<Record<string, BodyLog>>(STORAGE_KEYS.BODY_LOGS, {});
}

// ===== Schedule =====
export function getScheduleDay(date: string): ScheduleDay {
  const schedule = loadJSON<Record<string, ScheduleDay>>(STORAGE_KEYS.SCHEDULE, {});
  return schedule[date] || {
    date,
    dayType: 'rest',
    trainingMuscles: [],
    hasRunning: false,
  };
}

export function saveScheduleDay(day: ScheduleDay): void {
  const schedule = loadJSON<Record<string, ScheduleDay>>(STORAGE_KEYS.SCHEDULE, {});
  schedule[day.date] = day;
  saveJSON(STORAGE_KEYS.SCHEDULE, schedule);
}

export function getAllScheduleDays(): Record<string, ScheduleDay> {
  return loadJSON<Record<string, ScheduleDay>>(STORAGE_KEYS.SCHEDULE, {});
}

// ===== Running Records =====
export interface RunningRecord {
  date: string;
  distance: number; // km
  duration: number | null; // minutes
}

export function getRunningRecord(date: string): RunningRecord | null {
  const records = loadJSON<Record<string, RunningRecord>>(STORAGE_KEYS.RUNNING_RECORDS, {});
  return records[date] || null;
}

export function saveRunningRecord(record: RunningRecord): void {
  const records = loadJSON<Record<string, RunningRecord>>(STORAGE_KEYS.RUNNING_RECORDS, {});
  records[record.date] = record;
  saveJSON(STORAGE_KEYS.RUNNING_RECORDS, records);
}

export function getAllRunningRecords(): Record<string, RunningRecord> {
  return loadJSON<Record<string, RunningRecord>>(STORAGE_KEYS.RUNNING_RECORDS, {});
}

// ===== Training Records =====
export interface TrainingDayRecord {
  date: string;
  muscleGroups: MuscleGroup[];
  notes: string;
  completed: boolean;
}

export function getTrainingRecord(date: string): TrainingDayRecord | null {
  const records = loadJSON<Record<string, TrainingDayRecord>>(STORAGE_KEYS.TRAINING_RECORDS, {});
  return records[date] || null;
}

export function saveTrainingRecord(record: TrainingDayRecord): void {
  const records = loadJSON<Record<string, TrainingDayRecord>>(STORAGE_KEYS.TRAINING_RECORDS, {});
  records[record.date] = record;
  saveJSON(STORAGE_KEYS.TRAINING_RECORDS, records);
}

export function getAllTrainingRecords(): Record<string, TrainingDayRecord> {
  return loadJSON<Record<string, TrainingDayRecord>>(STORAGE_KEYS.TRAINING_RECORDS, {});
}

// ===== Muscle Heatmap =====
export function getMuscleHeatmap(): MuscleHeatmap {
  return loadJSON<MuscleHeatmap>(STORAGE_KEYS.MUSCLE_HEATMAP, {
    startDate: getToday(),
    counts: {},
    maxCount: 365,
  });
}

export function saveMuscleHeatmap(heatmap: MuscleHeatmap): void {
  saveJSON(STORAGE_KEYS.MUSCLE_HEATMAP, heatmap);
}

export function addMuscleCount(groups: MuscleGroup[]): void {
  const heatmap = getMuscleHeatmap();
  groups.forEach((g) => {
    heatmap.counts[g] = (heatmap.counts[g] || 0) + 1;
  });
  saveMuscleHeatmap(heatmap);
}

export function resetMuscleHeatmap(): void {
  saveMuscleHeatmap({
    startDate: getToday(),
    counts: {},
    maxCount: 365,
  });
}

// ===== Settings =====
export function getSettings(): AppSettings {
  const settings = loadJSON<AppSettings>(STORAGE_KEYS.SETTINGS, {
    targetWeight: 75,
    startWeight: 68,
    ohtaniSheet: DEFAULT_OHTANI_SHEET,
    goalMode: 'bulk',
  });
  // 既存データにgoalModeが無い場合の後方互換
  if (!settings.goalMode) {
    settings.goalMode = 'bulk';
  }
  return settings;
}

export function saveSettings(settings: AppSettings): void {
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
}

export function getOhtaniSheet(): OhtaniSheet {
  return getSettings().ohtaniSheet;
}

export function saveOhtaniSheet(sheet: OhtaniSheet): void {
  const settings = getSettings();
  settings.ohtaniSheet = sheet;
  saveSettings(settings);
}

// ===== Motivation Quote =====
export function getRandomOhtaniQuote(): { category: string; item: string; message: string } {
  const sheet = getOhtaniSheet();
  const categories = sheet.categories.filter((c) => c.items.length > 0);
  if (categories.length === 0) {
    return { category: 'メンタル', item: 'ポジティブ思考', message: '今日も最高の一日にしよう！' };
  }
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const item = cat.items[Math.floor(Math.random() * cat.items.length)];

  const humorousMessages = [
    `今日の「${cat.name}」テーマは「${item}」！\nこれを意識するだけで、昨日の自分より1%成長できるぞ 💪`,
    `おはよう！今日は「${cat.name}」の日！\n「${item}」を心に刻んで、最高の一日にしよう！`,
    `「${item}」って大谷翔平も大事にしてるらしいよ？\n今日は「${cat.name}」を意識して過ごそう！`,
    `朝から「${cat.name}」の「${item}」を実践するなんて、\nもう勝ち確じゃん！今日もいこう！`,
    `「${item}」— ${cat.name}の極意。\n大谷シートにある以上、これは間違いない。今日もファイト！`,
    `今日のキーワード：「${item}」（${cat.name}より）\nこれを3回唱えてから筋トレすると効果2倍...かも？`,
  ];

  return {
    category: cat.name,
    item,
    message: humorousMessages[Math.floor(Math.random() * humorousMessages.length)],
  };
}

// ===== Data Export =====
export function exportAllData(): {
  sleepRecords: Record<string, SleepRecord>;
  bodyLogs: Record<string, BodyLog>;
  schedule: Record<string, ScheduleDay>;
  runningRecords: Record<string, RunningRecord>;
  trainingRecords: Record<string, TrainingDayRecord>;
  muscleHeatmap: MuscleHeatmap;
  settings: AppSettings;
} {
  return {
    sleepRecords: getAllSleepRecords(),
    bodyLogs: getAllBodyLogs(),
    schedule: getAllScheduleDays(),
    runningRecords: getAllRunningRecords(),
    trainingRecords: getAllTrainingRecords(),
    muscleHeatmap: getMuscleHeatmap(),
    settings: getSettings(),
  };
}

// ===== Data Import (localStorage部分) =====
export function importAllData(data: {
  sleepRecords?: Record<string, SleepRecord>;
  bodyLogs?: Record<string, BodyLog>;
  schedule?: Record<string, ScheduleDay>;
  runningRecords?: Record<string, RunningRecord>;
  trainingRecords?: Record<string, TrainingDayRecord>;
  muscleHeatmap?: MuscleHeatmap;
  settings?: AppSettings;
}): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;

  try {
    if (data.sleepRecords) {
      const existing = getAllSleepRecords();
      const merged = { ...existing, ...data.sleepRecords };
      saveJSON(STORAGE_KEYS.SLEEP_RECORDS, merged);
      imported += Object.keys(data.sleepRecords).length;
    }
  } catch { errors.push('睡眠記録のインポートに失敗'); }

  try {
    if (data.bodyLogs) {
      const existing = getAllBodyLogs();
      const merged = { ...existing, ...data.bodyLogs };
      saveJSON(STORAGE_KEYS.BODY_LOGS, merged);
      imported += Object.keys(data.bodyLogs).length;
    }
  } catch { errors.push('ボディログのインポートに失敗'); }

  try {
    if (data.schedule) {
      const existing = getAllScheduleDays();
      const merged = { ...existing, ...data.schedule };
      saveJSON(STORAGE_KEYS.SCHEDULE, merged);
      imported += Object.keys(data.schedule).length;
    }
  } catch { errors.push('スケジュールのインポートに失敗'); }

  try {
    if (data.runningRecords) {
      const existing = getAllRunningRecords();
      const merged = { ...existing, ...data.runningRecords };
      saveJSON(STORAGE_KEYS.RUNNING_RECORDS, merged);
      imported += Object.keys(data.runningRecords).length;
    }
  } catch { errors.push('ランニング記録のインポートに失敗'); }

  try {
    if (data.trainingRecords) {
      const existing = getAllTrainingRecords();
      const merged = { ...existing, ...data.trainingRecords };
      saveJSON(STORAGE_KEYS.TRAINING_RECORDS, merged);
      imported += Object.keys(data.trainingRecords).length;
    }
  } catch { errors.push('トレーニング記録のインポートに失敗'); }

  try {
    if (data.muscleHeatmap) {
      saveMuscleHeatmap(data.muscleHeatmap);
      imported++;
    }
  } catch { errors.push('ヒートマップのインポートに失敗'); }

  try {
    if (data.settings) {
      saveSettings(data.settings);
      imported++;
    }
  } catch { errors.push('設定のインポートに失敗'); }

  return { imported, errors };
}

// ===== Calculate Sleep Hours =====
export function calculateSleepHours(bedTime: string, wakeUpTime: string): number {
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeUpTime.split(':').map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return (wakeMinutes - bedMinutes) / 60;
}

// ===== Get Monthly Running Distance =====
export function getMonthlyRunningDistance(year: number, month: number): number {
  const records = getAllRunningRecords();
  let total = 0;
  Object.values(records).forEach((r) => {
    const d = parseDate(r.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      total += r.distance || 0;
    }
  });
  return Math.round(total * 100) / 100;
}

// ===== Get Past Months Running Distances =====
export function getPastMonthsRunningDistances(months: number): { label: string; distance: number }[] {
  const result: { label: string; distance: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
    const distance = getMonthlyRunningDistance(d.getFullYear(), d.getMonth());
    result.push({ label, distance });
  }
  return result;
}

// ===== Get Week Sleep Data =====
export function getWeekSleepData(): { day: string; hours: number | null }[] {
  const dates = getWeekDates();
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  return dates.map((date, i) => {
    const record = getSleepRecord(date);
    return {
      day: dayNames[i],
      hours: record.sleepHours,
    };
  });
}

// ===== Get Weight Trend Data (past N days) =====
export function getWeightTrendData(days: number): { date: string; label: string; weight: number | null }[] {
  const result: { date: string; label: string; weight: number | null }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDate(d);
    const log = getBodyLog(dateStr);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: dateStr, label, weight: log.weight });
  }
  return result;
}

// ===== Get Monthly Weight Average =====
export function getMonthlyWeightAverages(months: number): { label: string; avgWeight: number | null }[] {
  const result: { label: string; avgWeight: number | null }[] = [];
  const now = new Date();
  const allLogs = getAllBodyLogs();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
    const monthLogs = Object.values(allLogs).filter((log) => {
      const ld = parseDate(log.date);
      return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth() && log.weight;
    });
    const avgWeight =
      monthLogs.length > 0
        ? Math.round((monthLogs.reduce((sum, l) => sum + (l.weight || 0), 0) / monthLogs.length) * 10) / 10
        : null;
    result.push({ label, avgWeight });
  }
  return result;
}

// ===== Calculate Streak (consecutive days with any record) =====
export function calculateStreak(): { currentStreak: number; longestStreak: number; totalDays: number } {
  const allLogs = getAllBodyLogs();
  const allSleep = getAllSleepRecords();
  const allTraining = getAllTrainingRecords();
  const allRunning = getAllRunningRecords();

  // Collect all dates with any record
  const recordedDates = new Set<string>();
  Object.keys(allLogs).forEach((d) => { if (allLogs[d].weight) recordedDates.add(d); });
  Object.keys(allSleep).forEach((d) => { if (allSleep[d].sleepHours) recordedDates.add(d); });
  Object.keys(allTraining).forEach((d) => recordedDates.add(d));
  Object.keys(allRunning).forEach((d) => recordedDates.add(d));

  const sortedDates = Array.from(recordedDates).sort();
  const totalDays = sortedDates.length;

  if (totalDays === 0) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

  // Calculate longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseDate(sortedDates[i - 1]);
    const curr = parseDate(sortedDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak (from today backward)
  const today = getToday();
  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const dateStr = formatDate(checkDate);
    if (recordedDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    if (currentStreak > 3650) break; // safety limit
  }

  return { currentStreak, longestStreak, totalDays };
}
