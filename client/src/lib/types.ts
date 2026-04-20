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

export const LIMIT_CHALLENGE_AXES = [
  { key: 'work', label: '仕事', emoji: '💼' },
  { key: 'learning', label: '学習', emoji: '📚' },
  { key: 'health', label: '健康', emoji: '🌿' },
  { key: 'longTermGoal', label: '長期目標行動', emoji: '🎯' },
  { key: 'relationships', label: '人間関係', emoji: '🤝' },
] as const;

export type LimitChallengeAxisKey = (typeof LIMIT_CHALLENGE_AXES)[number]['key'];

export type LimitChallengeScores = Record<LimitChallengeAxisKey, number | null>;

export const EMPTY_LIMIT_CHALLENGE_SCORES: LimitChallengeScores = {
  work: null,
  learning: null,
  health: null,
  longTermGoal: null,
  relationships: null,
};

export interface LimitChallengeRecord {
  date: string;
  scores: LimitChallengeScores;
  comment: string;
  updatedAt: string | null;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  sleep: SleepRecord;
  body: BodyLog;
  schedule: ScheduleDay;
  training: TrainingRecord[];
}

// Long-term goal shown on morning screen
export const LONG_TERM_GOAL = 'Seek the Uncomfortable Way\n上場企業の社長になる';

// Default Ohtani Sheet categories (based on actual sheet)
export const DEFAULT_OHTANI_SHEET: OhtaniSheet = {
  categories: [
    {
      id: 'mental',
      name: 'メンタル',
      items: [
        '辛い時こそ自分を律する',
        '自分にはできると自信を持つ',
        '覚悟を決める',
        'What\'s the best for you',
        '今度からではなく今日から始める',
        '波を作らない',
        '常にEnergetic, Positive',
        '人のいいところを見る・吸収する',
      ],
    },
    {
      id: 'private',
      name: '私生活',
      items: [
        '常に群を抜いていく（久保建英）',
        '早寝早起き',
        '筋トレ、ランニング',
        '自分:他者=2:8',
        '一喜一憂しない',
        '逆境を楽しむ',
        '目の前のやるべきことを120%でやる',
        '人と比べない・下を見ない',
      ],
    },
    {
      id: 'relationships',
      name: '人間関係',
      items: [
        '人を信じる',
        '家族第一',
        '相手は自分自身の鏡',
        '好きな人を全力で幸せにする',
        '友達を大切にする',
        '感謝',
        '笑顔',
        '応援できる人間になる',
      ],
    },
    {
      id: 'character',
      name: '品格',
      items: [
        '姿勢を伸ばす',
        '自分を好きになる',
        '2/100未完成',
        '謙虚',
        '成功に慣れる人間になる',
        '一言目から落ち着いて話す',
        '自分に打ち勝つ',
        'ロジカル',
      ],
    },
    {
      id: 'competition',
      name: '勝負',
      items: [
        '死にはしない',
        '深呼吸',
        '勝負を目的化しない',
        'ロケットスタート',
        '今日の差は明日の伸びしろ',
        '自己中',
        'エゴ',
        '集中力・地頭力',
      ],
    },
    {
      id: 'weakness',
      name: '弱み',
      items: [
        '非連続的な成長',
        '自分なりの付加価値を出す',
        'オーナーシップ',
        'Command voice',
        '長期的なマネジメント',
        '自分のメンタル、組織のメンタル',
        '諦めの甘さ',
        '気持ちの切り替え',
      ],
    },
    {
      id: 'leadership',
      name: 'リーダーシップ',
      items: [
        '相手が求めていること',
        '自分が大好きなこと',
        '自分が得意なこと',
        'めんどくさい事から始める',
        'やることを全部やる',
        'リカバリー力',
        '期待値コントロール',
        'アンガーマネジメント',
      ],
    },
    {
      id: 'work',
      name: '仕事',
      items: [
        '丁寧、丁寧、丁寧',
        'コミュニケーション',
        'やることを全部やる',
        'めんどくさい事から始める',
        'リカバリー力',
        '期待値コントロール',
        'オーナーシップ',
        '自分なりの付加価値を出す',
      ],
    },
  ],
};

export const MUSCLE_GROUPS: MuscleGroup[] = ['胸', '背中', '肩', '腕', '脚', '腹筋', '全身'];

export const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
export const DAY_NAMES_SHORT = ['日', '月', '火', '水', '木', '金', '土'];
