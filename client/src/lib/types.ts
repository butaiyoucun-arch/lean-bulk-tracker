// ===== Core Types for Lean Bulk Tracker =====

export type MuscleGroup = '胸' | '背中' | '肩' | '腕' | '脚' | '腹筋' | '全身';

export type DayType = 'training' | 'running' | 'rest' | 'training+running';

export interface SleepRecord {
  date: string; // YYYY-MM-DD
  wakeUpTime: string | null; // HH:mm
  bedTime: string | null; // HH:mm
  sleepHours: number | null;
}

export interface BodyLog {
  date: string; // YYYY-MM-DD
  weight: number | null;
  photo: string | null; // base64 data URL
}

export interface TrainingRecord {
  date: string; // YYYY-MM-DD
  type: 'training' | 'running' | 'rest';
  muscleGroups: MuscleGroup[];
  distance: number | null; // km for running
  duration: number | null; // minutes
  notes: string;
  completed: boolean;
}

export interface WeeklySchedule {
  weekStartDate: string; // YYYY-MM-DD (Monday)
  days: {
    [key: string]: ScheduleDay; // key is YYYY-MM-DD
  };
}

export interface ScheduleDay {
  date: string;
  dayType: DayType | 'rest';
  trainingMuscles: MuscleGroup[];
  hasRunning: boolean;
  trainingRecord?: TrainingRecord;
  runningRecord?: {
    distance: number | null;
    duration: number | null;
    completed: boolean;
  };
}

export interface MuscleHeatmap {
  startDate: string; // cycle start date
  counts: {
    [key in MuscleGroup]?: number;
  };
  maxCount: number; // target count for full red (365)
}

export interface OhtaniSheetCategory {
  id: string;
  name: string;
  items: string[];
}

export interface OhtaniSheet {
  categories: OhtaniSheetCategory[];
}

export type GoalMode = 'bulk' | 'maintain' | 'cut';

export const GOAL_MODE_LABELS: Record<GoalMode, string> = {
  bulk: 'バルクアップ（增量）',
  maintain: '維持',
  cut: '減量',
};

export interface AppSettings {
  targetWeight: number;
  startWeight: number;
  ohtaniSheet: OhtaniSheet;
  goalMode: GoalMode;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  sleep: SleepRecord;
  body: BodyLog;
  schedule: ScheduleDay;
  training: TrainingRecord[];
}

// Default Ohtani Sheet categories
export const DEFAULT_OHTANI_SHEET: OhtaniSheet = {
  categories: [
    {
      id: 'mental',
      name: 'メンタル',
      items: ['ポジティブ思考', '感謝の心', '自分を信じる', '困難を楽しむ'],
    },
    {
      id: 'relationships',
      name: '人間関係',
      items: ['思いやり', '感謝を伝える', '相手の立場で考える', '笑顔'],
    },
    {
      id: 'character',
      name: '品格',
      items: ['礼儀正しく', '謙虚さ', '約束を守る', '時間厳守'],
    },
    {
      id: 'competition',
      name: '勝負',
      items: ['諦めない', '準備を怠らない', '集中力', '冷静さ'],
    },
    {
      id: 'weakness',
      name: '弱み',
      items: ['弱さを認める', '改善し続ける', '助けを求める', '失敗から学ぶ'],
    },
    {
      id: 'leadership',
      name: 'リーダーシップ',
      items: ['率先垂範', '仲間を鼓舞する', '責任を取る', 'ビジョンを持つ'],
    },
    {
      id: 'work',
      name: '仕事',
      items: ['全力投球', '効率を追求', '質にこだわる', '継続は力なり'],
    },
    {
      id: 'private',
      name: '私生活',
      items: ['健康第一', '趣味を楽しむ', '家族を大切に', '自分の時間を作る'],
    },
  ],
};

export const MUSCLE_GROUPS: MuscleGroup[] = ['胸', '背中', '肩', '腕', '脚', '腹筋', '全身'];

export const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
export const DAY_NAMES_SHORT = ['日', '月', '火', '水', '木', '金', '土'];
