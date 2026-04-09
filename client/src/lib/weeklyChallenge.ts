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
  // ===== SLEEP (20) =====
  { title: '7時間睡眠チャレンジ', description: '今週は毎日7時間以上の睡眠を記録しよう！', emoji: '😴', category: 'sleep', target: 7, unit: '日' },
  { title: '早起きチャレンジ', description: '今週は毎日7時前に起きてみよう！', emoji: '🌅', category: 'sleep', target: 5, unit: '日' },
  { title: '規則正しい睡眠', description: '今週は毎日睡眠記録をつけよう！', emoji: '📊', category: 'sleep', target: 7, unit: '日' },
  { title: '8時間睡眠マスター', description: '今週は3日以上8時間睡眠を達成しよう！', emoji: '💤', category: 'sleep', target: 3, unit: '日' },
  { title: '午前0時就寝チャレンジ', description: '今週は毎日0時前に布団に入ろう！', emoji: '🌙', category: 'sleep', target: 5, unit: '日' },
  { title: '睡眠リズム改善', description: '起床時間のバラツキを30分以内にしよう！', emoji: '⏰', category: 'sleep', target: 5, unit: '日' },
  { title: 'ノースマホナイト', description: '寝る1時間前にスマホを置いて睡眠の質を上げよう！', emoji: '📵', category: 'sleep', target: 5, unit: '日' },
  { title: '昨夜の振り返り', description: '毎日睡眠時間を記録してパターンを見つけよう！', emoji: '🗓️', category: 'sleep', target: 7, unit: '日' },
  { title: 'パワーナップ禁止', description: '今週は昼寝なしで夜にしっかり眠ろう！', emoji: '☕', category: 'sleep', target: 5, unit: '日' },
  { title: '6時起床チャレンジ', description: '今週は3日以上6時に起きてみよう！', emoji: '☀️', category: 'sleep', target: 3, unit: '日' },
  { title: 'ストレッチモーニング', description: '起床後に軽いストレッチをして目覚めよう！', emoji: '🧘', category: 'sleep', target: 5, unit: '日' },
  { title: 'カフェインカット', description: '午後のカフェインを控えて睡眠の質を上げよう！', emoji: '🚫', category: 'sleep', target: 5, unit: '日' },
  { title: '睡眠環境整備', description: '寝室を暗く・涼しくして睡眠の質を改善！', emoji: '🌃', category: 'sleep', target: 5, unit: '日' },
  { title: '寝る前読書', description: '寝る前に10分以上読書してリラックス！', emoji: '📚', category: 'sleep', target: 4, unit: '日' },
  { title: 'アラーム一発起床', description: 'スヌーズなしで一発で起きる練習！', emoji: '🚨', category: 'sleep', target: 5, unit: '日' },
  { title: '平日睡眠充実', description: '平日5日間すべて7時間以上眠ろう！', emoji: '💼', category: 'sleep', target: 5, unit: '日' },
  { title: '休日も早起き', description: '休日も平日と同じ時間に起きよう！', emoji: '🌞', category: 'sleep', target: 2, unit: '日' },
  { title: 'デジタルデトックス', description: '寝る前にSNSを見ない日を3日作ろう！', emoji: '📱', category: 'sleep', target: 3, unit: '日' },
  { title: '睡眠日記', description: '毎日の睡眠の質を振り返って記録しよう！', emoji: '📝', category: 'sleep', target: 7, unit: '日' },
  { title: 'リラックスルーティン', description: '寝る前に深呼吸や瞑想を取り入れよう！', emoji: '🧘‍♂️', category: 'sleep', target: 4, unit: '日' },
  // ===== TRAINING (25) =====
  { title: '全身トレーニング週間', description: '今週は全ての筋肉部位を最低1回ずつ鍛えよう！', emoji: '💪', category: 'training', target: 6, unit: '部位' },
  { title: '3日連続筋トレ', description: '今週は3日連続でトレーニングを記録しよう！', emoji: '🏋️', category: 'training', target: 3, unit: '連続日' },
  { title: '腹筋強化週間', description: '今週は腹筋を4回以上鍛えよう！', emoji: '🔥', category: 'training', target: 4, unit: '回' },
  { title: '胸筋フォーカス', description: '今週は胸のトレーニングを3回以上行おう！', emoji: '💪', category: 'training', target: 3, unit: '回' },
  { title: '背中ビルダー', description: '今週は背中のトレーニングを3回以上！', emoji: '🧍', category: 'training', target: 3, unit: '回' },
  { title: 'レッグデイ', description: '今週は脚のトレーニングを2回以上行おう！', emoji: '🦵', category: 'training', target: 2, unit: '回' },
  { title: '肩トレチャレンジ', description: '今週は肩のトレーニングを3回以上！', emoji: '🎯', category: 'training', target: 3, unit: '回' },
  { title: '腕トレウィーク', description: '今週は腕のトレーニングを3回以上！', emoji: '💪', category: 'training', target: 3, unit: '回' },
  { title: '5日トレーニング', description: '今週は5日以上トレーニングしよう！', emoji: '📅', category: 'training', target: 5, unit: '日' },
  { title: 'ダブルスプリット', description: '今週は1日2部位以上鍛える日を2日作ろう！', emoji: '⚡', category: 'training', target: 2, unit: '日' },
  { title: 'プッシュアップ100回', description: '今週の累計腕立て伏せ100回を目指そう！', emoji: '🧑‍💻', category: 'training', target: 100, unit: '回' },
  { title: 'スクワット200回', description: '今週の累計スクワット200回を目指そう！', emoji: '🏋️‍♂️', category: 'training', target: 200, unit: '回' },
  { title: 'プランクチャレンジ', description: '今週は毎日30秒以上のプランクをしよう！', emoji: '🧘‍♂️', category: 'training', target: 5, unit: '日' },
  { title: 'スーパーセット', description: '各トレーニングで限界まで追い込もう！', emoji: '💥', category: 'training', target: 3, unit: '日' },
  { title: 'ウォームアップ強化', description: '毎回のトレーニング前に10分のウォームアップ！', emoji: '🤸', category: 'training', target: 4, unit: '日' },
  { title: 'トレーニングメモ', description: '毎回のトレーニング内容を詳細に記録しよう！', emoji: '📝', category: 'training', target: 4, unit: '日' },
  { title: 'コンパウンドセット', description: '複合関節種目を中心にトレーニングしよう！', emoji: '🎯', category: 'training', target: 3, unit: '日' },
  { title: 'デッドリフトチャレンジ', description: '今週はデッドリフトを取り入れてみよう！', emoji: '💪', category: 'training', target: 2, unit: '回' },
  { title: 'ベンチプレス強化', description: '今週はベンチプレスを重点的に行おう！', emoji: '🏋️', category: 'training', target: 3, unit: '回' },
  { title: 'ラットプルダウン', description: '今週は懸垂系種目を取り入れよう！', emoji: '🧗', category: 'training', target: 2, unit: '回' },
  { title: 'アクティブレスト', description: '休息日にストレッチやウォーキングで回復！', emoji: '🚶', category: 'training', target: 2, unit: '日' },
  { title: 'ドロップセット', description: 'ドロップセットを取り入れて追い込もう！', emoji: '🔥', category: 'training', target: 3, unit: '日' },
  { title: 'アイソレーション種目', description: '単関節種目で筋肉をピンポイントで鍛えよう！', emoji: '🎯', category: 'training', target: 3, unit: '日' },
  { title: 'ペアトレーニング', description: '友人やパートナーと一緒にトレーニング！', emoji: '🤝', category: 'training', target: 2, unit: '回' },
  // ===== RUNNING (20) =====
  { title: '週20km走破', description: '今週は合計20km以上走ろう！', emoji: '🏃', category: 'running', target: 20, unit: 'km' },
  { title: '毎日ランニング', description: '今週は毎日少しでもランニングを記録しよう！', emoji: '👟', category: 'running', target: 5, unit: '日' },
  { title: '長距離チャレンジ', description: '今週は1回で5km以上走ろう！', emoji: '🎯', category: 'running', target: 5, unit: 'km (1回)' },
  { title: 'スピードラン', description: '今週はインターバルトレーニングを取り入れよう！', emoji: '⚡', category: 'running', target: 3, unit: '回' },
  { title: '朝ランチャレンジ', description: '今週は3回以上朝に走ろう！', emoji: '🌅', category: 'running', target: 3, unit: '回' },
  { title: '週30km走破', description: '今週は合計30km以上走ろう！', emoji: '🏅', category: 'running', target: 30, unit: 'km' },
  { title: 'ジョギングスタート', description: '今週は軽いジョギングを3回以上しよう！', emoji: '🚶‍♂️', category: 'running', target: 3, unit: '回' },
  { title: '10kmチャレンジ', description: '今週は1回で10km以上走ろう！', emoji: '🏃‍♂️', category: 'running', target: 10, unit: 'km (1回)' },
  { title: 'ヒルトレーニング', description: '坂道や階段を使ったランニングをしよう！', emoji: '⛰️', category: 'running', target: 2, unit: '回' },
  { title: 'リカバリーラン', description: 'トレーニング後の軽いランニングを取り入れよう！', emoji: '💨', category: 'running', target: 3, unit: '回' },
  { title: 'ペースアップ', description: '前回より少しだけ速く走ってみよう！', emoji: '🚀', category: 'running', target: 3, unit: '回' },
  { title: 'ウォーキングデイ', description: '今週は毎日30分以上歩こう！', emoji: '🚶', category: 'running', target: 5, unit: '日' },
  { title: 'ランニングフォーム改善', description: '姿勢を意識して走ろう！', emoji: '🧑‍🏫', category: 'running', target: 3, unit: '回' },
  { title: 'トレイルラン', description: '公園や自然の中を走ってみよう！', emoji: '🌳', category: 'running', target: 2, unit: '回' },
  { title: 'クールダウンラン', description: 'トレーニング後に軽いジョグでクールダウン！', emoji: '❄️', category: 'running', target: 3, unit: '回' },
  { title: 'インターバルダッシュ', description: '30秒ダッシュ+30秒休憩を繰り返そう！', emoji: '⏱️', category: 'running', target: 3, unit: '回' },
  { title: 'ランニングストリーク', description: '今週は4日連続で走ろう！', emoji: '🔥', category: 'running', target: 4, unit: '連続日' },
  { title: 'イーブニングラン', description: '夕方のランニングを3回以上しよう！', emoji: '🌇', category: 'running', target: 3, unit: '回' },
  { title: 'ファルトレク', description: 'インターバルで全力ダッシュを取り入れよう！', emoji: '💨', category: 'running', target: 2, unit: '回' },
  { title: 'ランニング日記', description: '毎回のランニングを詳細に記録しよう！', emoji: '📝', category: 'running', target: 4, unit: '回' },
  // ===== BODY (15) =====
  { title: '毎日体重記録', description: '今週は毎日体重を記録しよう！', emoji: '⚖️', category: 'body', target: 7, unit: '日' },
  { title: '毎日ボディフォト', description: '今週は毎日ボディフォトを撮ろう！', emoji: '📸', category: 'body', target: 5, unit: '枚' },
  { title: '体重変動チェック', description: '今週の体重変動を0.5kg以内に押さえよう！', emoji: '📏', category: 'body', target: 7, unit: '日' },
  { title: '朝一番の体重記録', description: '毎朝起きたらすぐ体重を測ろう！', emoji: '☀️', category: 'body', target: 5, unit: '日' },
  { title: 'ボディチェック3日', description: '今週は3日以上ボディフォトを撮ろう！', emoji: '📷', category: 'body', target: 3, unit: '枚' },
  { title: 'ビフォーアフター', description: 'トレーニング前後の写真を比較しよう！', emoji: '🔄', category: 'body', target: 2, unit: 'セット' },
  { title: '水分補給チャレンジ', description: '毎日2L以上の水を飲んで体調管理！', emoji: '💧', category: 'body', target: 7, unit: '日' },
  { title: 'タンパク質意識', description: '毎食タンパク質を意識して食事しよう！', emoji: '🍗', category: 'body', target: 7, unit: '日' },
  { title: '体組成チェック', description: '体重だけでなく見た目の変化も記録しよう！', emoji: '📊', category: 'body', target: 3, unit: '回' },
  { title: 'プロテインチャレンジ', description: '今週は毎日体重×2gのタンパク質を摂ろう！', emoji: '🥩', category: 'body', target: 7, unit: '日' },
  { title: 'クリーンイーティング', description: '加工食品を避けて自然な食事を心がけよう！', emoji: '🥗', category: 'body', target: 5, unit: '日' },
  { title: '食事記録チャレンジ', description: '毎食の内容を意識して記録しよう！', emoji: '🍽️', category: 'body', target: 7, unit: '日' },
  { title: '間食ゼロチャレンジ', description: '今週は3日以上間食なしで過ごそう！', emoji: '🚫', category: 'body', target: 3, unit: '日' },
  { title: 'ビタミンサプリ', description: '毎日マルチビタミンを飲んで体調管理！', emoji: '💊', category: 'body', target: 7, unit: '日' },
  { title: 'アルコールフリー', description: '今週はお酒を控えて体をいたわろう！', emoji: '🍺', category: 'body', target: 5, unit: '日' },
  // ===== MINDSET (20) =====
  { title: '大谷シート実践', description: '今週は大谷シートの項目を毎日1つ意識して過ごそう！', emoji: '🌟', category: 'mindset', target: 7, unit: '日' },
  { title: '完璧な1週間', description: '今週は睡眠・体重・トレーニングを全て記録しよう！', emoji: '🏆', category: 'mindset', target: 3, unit: '種類' },
  { title: '感謝日記', description: '毎日3つの感謝を見つけて記録しよう！', emoji: '🙏', category: 'mindset', target: 7, unit: '日' },
  { title: 'ポジティブアファーメーション', description: '毎朝自分へのポジティブな言葉を唱えよう！', emoji: '✨', category: 'mindset', target: 5, unit: '日' },
  { title: '目標再確認', description: '今週の目標を明確にして毎日見返そう！', emoji: '🎯', category: 'mindset', target: 7, unit: '日' },
  { title: '瞑想チャレンジ', description: '今週は毎日5分以上の瞑想をしよう！', emoji: '🧘', category: 'mindset', target: 5, unit: '日' },
  { title: '読書習慣', description: '今週は毎日10ページ以上読もう！', emoji: '📚', category: 'mindset', target: 5, unit: '日' },
  { title: 'ノーコンプレインデー', description: '今週は不平を言わずポジティブに過ごそう！', emoji: '😊', category: 'mindset', target: 5, unit: '日' },
  { title: '早帰りチャレンジ', description: '今週は3日以上定時に帰宅しよう！', emoji: '🏠', category: 'mindset', target: 3, unit: '日' },
  { title: 'デジタルデトックス', description: 'SNSを控えて自分の時間を大切にしよう！', emoji: '📱', category: 'mindset', target: 5, unit: '日' },
  { title: '新しいことに挑戦', description: '今週は1つ新しいことにチャレンジしよう！', emoji: '🌟', category: 'mindset', target: 1, unit: 'つ' },
  { title: 'ジャーナリング', description: '毎日5分以上日記を書こう！', emoji: '📝', category: 'mindset', target: 5, unit: '日' },
  { title: '深呼吸チャレンジ', description: 'ストレスを感じたら深呼吸を5回しよう！', emoji: '🌬️', category: 'mindset', target: 7, unit: '日' },
  { title: '他者貢献', description: '今週は毎日1つ人のためになることをしよう！', emoji: '🤝', category: 'mindset', target: 5, unit: '日' },
  { title: 'ビジュアライゼーション', description: '理想の自分をイメージしてモチベーションUP！', emoji: '💭', category: 'mindset', target: 5, unit: '日' },
  { title: '笑顔チャレンジ', description: '今週は意識的に笑顔で過ごそう！', emoji: '😄', category: 'mindset', target: 7, unit: '日' },
  { title: '学びの週間', description: '今週は新しい知識を毎日1つ得よう！', emoji: '🎓', category: 'mindset', target: 5, unit: '日' },
  { title: 'アンガーマネジメント', description: '怒りを感じたら6秒待ってから反応しよう！', emoji: '🧘‍♂️', category: 'mindset', target: 7, unit: '日' },
  { title: '自己投資タイム', description: '今週は毎日30分以上自分の成長に時間を使おう！', emoji: '📈', category: 'mindset', target: 5, unit: '日' },
  { title: 'コンフォートゾーン脱出', description: '少し不快なことにも挑戦して成長しよう！', emoji: '🚀', category: 'mindset', target: 3, unit: '回' },
  { title: 'マインドフルネス', description: '今週は「今この瞬間」に集中する練習をしよう！', emoji: '🌿', category: 'mindset', target: 5, unit: '日' },
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
