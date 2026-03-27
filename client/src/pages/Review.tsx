/**
 * Review Page - Growth tracking and analytics
 * Sections: AI Advice, Muscle Heatmap, Monthly Distance, Distance Trend,
 *           Sleep, Detailed Analysis, Body Photo Gallery
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getMuscleHeatmap,
  resetMuscleHeatmap,
  getMonthlyRunningDistance,
  getPastMonthsRunningDistances,
  getWeekSleepData,
  getAllBodyLogs,
  getAllTrainingRecords,
  getAllRunningRecords,
  getAllSleepRecords,
  getSettings,
  getToday,
  parseDate,
} from '@/lib/store';
import type { MuscleGroup, MuscleHeatmap } from '@/lib/types';
import { MUSCLE_GROUPS } from '@/lib/types';

// Muscle Heatmap SVG Component
function MuscleHeatmapView() {
  const [heatmap, setHeatmap] = useState<MuscleHeatmap>(() => getMuscleHeatmap());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getColor = (count: number) => {
    const ratio = Math.min(count / heatmap.maxCount, 1);
    if (ratio === 0) return '#e5e7eb';
    if (ratio < 0.25) return '#93c5fd';
    if (ratio < 0.5) return '#fbbf24';
    if (ratio < 0.75) return '#f97316';
    return '#ef4444';
  };

  const getLabel = (ratio: number) => {
    if (ratio === 0) return 'Cold';
    if (ratio < 0.5) return 'Warming';
    if (ratio < 0.75) return 'On Fire';
    return 'MAX';
  };

  const totalProgress = useMemo(() => {
    const groups: MuscleGroup[] = ['胸', '背中', '肩', '腕', '脚', '腹筋'];
    const total = groups.reduce((sum, g) => sum + (heatmap.counts[g] || 0), 0);
    const max = groups.length * heatmap.maxCount;
    return Math.round((total / max) * 100);
  }, [heatmap]);

  const handleReset = () => {
    resetMuscleHeatmap();
    setHeatmap(getMuscleHeatmap());
    toast.success('マッスルヒートマップをリセットしました');
  };

  const startDate = parseDate(heatmap.startDate);

  return (
    <div className="card-neu p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">マッスルヒートマップ</h3>
        <span className="text-xs bg-sunrise-orange/20 text-sunrise-orange px-2 py-0.5 rounded-full">
          {startDate.getMonth() + 1}/{startDate.getDate()} ~
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        各部位 {heatmap.maxCount}回で完全燃焼 — 全体進捗 {totalProgress}%
      </p>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${totalProgress}%`,
            background: 'linear-gradient(90deg, #93c5fd, #fbbf24, #f97316, #ef4444)',
          }}
        />
      </div>

      {/* Body silhouette + stats */}
      <div className="flex gap-4">
        {/* SVG Body */}
        <div className="w-32 shrink-0">
          <svg viewBox="0 0 120 280" className="w-full">
            {/* Head */}
            <circle cx="60" cy="25" r="18" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
            {/* Neck */}
            <rect x="52" y="43" width="16" height="12" fill="#e5e7eb" rx="3" />
            {/* Chest */}
            <path d="M30 55 Q60 50 90 55 L88 95 Q60 100 32 95 Z"
              fill={getColor(heatmap.counts['胸'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Abs */}
            <path d="M38 95 Q60 100 82 95 L80 145 Q60 148 40 145 Z"
              fill={getColor(heatmap.counts['腹筋'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Left Shoulder */}
            <ellipse cx="22" cy="62" rx="12" ry="10"
              fill={getColor(heatmap.counts['肩'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Right Shoulder */}
            <ellipse cx="98" cy="62" rx="12" ry="10"
              fill={getColor(heatmap.counts['肩'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Left Arm */}
            <path d="M12 72 L6 130 L18 130 L22 72 Z"
              fill={getColor(heatmap.counts['腕'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Right Arm */}
            <path d="M98 72 L102 130 L114 130 L108 72 Z"
              fill={getColor(heatmap.counts['腕'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Left Leg */}
            <path d="M40 148 L32 240 L48 240 L52 148 Z"
              fill={getColor(heatmap.counts['脚'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Right Leg */}
            <path d="M68 148 L72 240 L88 240 L80 148 Z"
              fill={getColor(heatmap.counts['脚'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            {/* Back indicator (small overlay) */}
            <rect x="42" y="58" width="36" height="35" rx="4" opacity="0.3"
              fill={getColor(heatmap.counts['背中'] || 0)} />
          </svg>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          {(['胸', '背中', '肩', '腕', '脚', '腹筋'] as MuscleGroup[]).map((muscle) => {
            const count = heatmap.counts[muscle] || 0;
            return (
              <div key={muscle} className="flex items-center justify-between text-sm">
                <span className="font-medium w-10">{muscle}</span>
                <span className="text-muted-foreground text-xs">{count}/{heatmap.maxCount}</span>
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: getColor(count) }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#93c5fd]" /> Cold
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#f97316]" /> 🔥 On Fire
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" /> 🌟 MAX
        </div>
      </div>

      {/* Status message */}
      <div className="mt-3 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-2">
        {totalProgress === 0
          ? '🧊 まだ体は冷えています... トレーニングを記録して体に火をつけよう！'
          : totalProgress < 50
          ? '🔥 いい感じに温まってきた！この調子で続けよう！'
          : totalProgress < 100
          ? '🌟 もうすぐ完全燃焼！ラストスパート！'
          : '🏆 完全燃焼達成！新しいサイクルを始めよう！'}
      </div>

      {/* Reset button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full mt-3 py-3 rounded-xl bg-sunrise-orange/10 text-sunrise-orange text-sm font-medium tap-active">
            🔄 新しいサイクルを開始する
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>本当に更新しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の記録を保存して、新たに0からスタートします。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-sunrise-orange hover:bg-sunrise-orange/90"
            >
              更新する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// AI Advice Component
function AIAdvice() {
  const records = getAllTrainingRecords();
  const running = getAllRunningRecords();
  const sleepRecords = getAllSleepRecords();
  const bodyLogs = getAllBodyLogs();
  
  const trainingDays = Object.keys(records).length;
  const runningDays = Object.keys(running).length;
  const totalDistance = Object.values(running).reduce((sum, r) => sum + (r.distance || 0), 0);
  
  const getAdvice = () => {
    const advices: string[] = [];
    
    if (trainingDays === 0 && runningDays === 0) {
      return 'まだデータが少ないです。トレーニングを記録していくと、ここにパーソナライズされたアドバイスが表示されます。まずは今日のミッションをクリアしよう！';
    }
    
    if (trainingDays > 0) {
      const muscleFreq: Record<string, number> = {};
      Object.values(records).forEach((r) => {
        r.muscleGroups.forEach((m) => {
          muscleFreq[m] = (muscleFreq[m] || 0) + 1;
        });
      });
      const sorted = Object.entries(muscleFreq).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        advices.push(`最もよく鍛えている部位は「${sorted[0][0]}」(${sorted[0][1]}回)です。`);
        const least = sorted[sorted.length - 1];
        if (sorted.length > 1) {
          advices.push(`「${least[0]}」のトレーニング頻度が低めです。バランスよく鍛えましょう。`);
        }
      }
    }
    
    if (runningDays > 0) {
      const avgDist = totalDistance / runningDays;
      advices.push(`ランニング平均距離: ${avgDist.toFixed(1)}km/回。${avgDist < 3 ? '少しずつ距離を伸ばしていきましょう。' : '素晴らしいペースです！'}`);
    }

    const sleepArr = Object.values(sleepRecords).filter((s) => s.sleepHours);
    if (sleepArr.length > 0) {
      const avgSleep = sleepArr.reduce((sum, s) => sum + (s.sleepHours || 0), 0) / sleepArr.length;
      if (avgSleep < 6) {
        advices.push('睡眠時間が6時間未満の日が多いです。筋肉の回復には7-9時間の睡眠が理想的です。');
      } else if (avgSleep >= 7) {
        advices.push('睡眠時間は良好です。質の良い睡眠が筋肉の成長をサポートします。');
      }
    }

    return advices.join('\n\n');
  };

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        🤖 AIからのアドバイス
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {getAdvice()}
      </p>
    </div>
  );
}

// Monthly Distance Component
function MonthlyDistance() {
  const now = new Date();
  const currentMonth = getMonthlyRunningDistance(now.getFullYear(), now.getMonth());
  const pastMonths = getPastMonthsRunningDistances(6);

  return (
    <>
      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-2">今月の総距離</h3>
        <div className="text-center py-3">
          <span className="text-4xl font-bold font-display text-sunrise-orange">
            {currentMonth.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground ml-1">km</span>
        </div>
      </div>

      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-3">月別総距離推移</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {pastMonths.map((m, i) => {
            const maxDist = Math.max(...pastMonths.map((p) => p.distance), 1);
            const height = (m.distance / maxDist) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{m.distance.toFixed(0)}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: i === pastMonths.length - 1 ? '#E8734A' : '#c4b5fd',
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{m.label.split('/')[1]}月</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Sleep Chart Component
function SleepChart() {
  const data = getWeekSleepData();

  const getBarColor = (hours: number | null) => {
    if (!hours) return '#e5e7eb';
    if (hours >= 7) return '#5B6ABF';
    if (hours >= 6) return '#fbbf24';
    return '#ef4444';
  };

  const avgHours = useMemo(() => {
    const valid = data.filter((d) => d.hours !== null);
    if (valid.length === 0) return null;
    return valid.reduce((sum, d) => sum + (d.hours || 0), 0) / valid.length;
  }, [data]);

  return (
    <div className="card-neu p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">睡眠</h3>
        <span className="text-xs text-muted-foreground">過去7日間</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold font-display">
          {avgHours ? `${avgHours.toFixed(1)}h` : '--'}
        </span>
        <span className="text-xs text-muted-foreground">平均 / 日</span>
        {!avgHours && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">データなし</span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${d.hours ? (d.hours / 12) * 100 : 5}%`,
                backgroundColor: getBarColor(d.hours),
                minHeight: '4px',
              }}
            />
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#5B6ABF]" /> 7-9h 理想
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> 6-7h やや不足
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#ef4444]" /> 6h 未満
        </div>
      </div>
    </div>
  );
}

// Detailed Analysis Component
function DetailedAnalysis() {
  const records = getAllTrainingRecords();
  const running = getAllRunningRecords();
  const bodyLogs = getAllBodyLogs();
  const sleepRecords = getAllSleepRecords();
  const settings = getSettings();

  const trainingDays = Object.keys(records).length;
  const runningDays = Object.keys(running).length;
  const totalDistance = Object.values(running).reduce((sum, r) => sum + (r.distance || 0), 0);
  
  const weights = Object.values(bodyLogs)
    .filter((b) => b.weight)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const firstWeight = weights.length > 0 ? weights[0].weight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  const sleepArr = Object.values(sleepRecords).filter((s) => s.sleepHours);
  const avgSleep = sleepArr.length > 0
    ? sleepArr.reduce((sum, s) => sum + (s.sleepHours || 0), 0) / sleepArr.length
    : null;

  // Muscle frequency analysis
  const muscleFreq: Record<string, number> = {};
  Object.values(records).forEach((r) => {
    r.muscleGroups.forEach((m) => {
      muscleFreq[m] = (muscleFreq[m] || 0) + 1;
    });
  });

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-semibold mb-4">📊 詳細分析</h3>
      
      <div className="space-y-4">
        {/* Weight Progress */}
        <div className="bg-muted/30 rounded-xl p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">体重推移</h4>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">開始</div>
              <div className="text-lg font-bold">{settings.startWeight}kg</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">現在</div>
              <div className="text-lg font-bold text-sunrise-orange">
                {latestWeight ? `${latestWeight}kg` : '--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">目標</div>
              <div className="text-lg font-bold">{settings.targetWeight}kg</div>
            </div>
          </div>
          {weightChange !== null && (
            <div className={`text-center text-sm mt-2 ${weightChange >= 0 ? 'text-sunrise-green' : 'text-destructive'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(2)}kg
            </div>
          )}
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold font-display text-sunrise-indigo">{trainingDays}</div>
            <div className="text-xs text-muted-foreground">筋トレ日数</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold font-display text-sunrise-green">{runningDays}</div>
            <div className="text-xs text-muted-foreground">ランニング日数</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold font-display text-sunrise-orange">{totalDistance.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">総距離 (km)</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold font-display">{avgSleep ? `${avgSleep.toFixed(1)}h` : '--'}</div>
            <div className="text-xs text-muted-foreground">平均睡眠</div>
          </div>
        </div>

        {/* Muscle Frequency */}
        {Object.keys(muscleFreq).length > 0 && (
          <div className="bg-muted/30 rounded-xl p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">部位別トレーニング回数</h4>
            <div className="space-y-1.5">
              {Object.entries(muscleFreq)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, count]) => {
                  const max = Math.max(...Object.values(muscleFreq));
                  return (
                    <div key={muscle} className="flex items-center gap-2">
                      <span className="text-xs w-8">{muscle}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sunrise-indigo/70 transition-all duration-500"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Body Photo Gallery Component
function BodyPhotoGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<{ date: string; photo: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const photos = useMemo(() => {
    const logs = getAllBodyLogs();
    return Object.values(logs)
      .filter((l) => l.photo)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({ date: l.date, photo: l.photo! }));
  }, []);

  // AI muscle analysis (simulated)
  const getMuscleAnalysis = (date: string) => {
    const dayNum = parseDate(date).getDate();
    const analyses = [
      '胸筋の輪郭が少しずつ見えてきています。その調子！',
      '腕の筋肉に張りが出てきました。トレーニングの成果が出ています。',
      '腹筋のラインが以前より明確になっています。体脂肪も減少傾向です。',
      '全体的に筋肉量が増えている印象です。バルクアップ順調！',
      '肩幅が広くなってきています。三角筋のトレーニングが効いています。',
      '体全体のバランスが良くなっています。引き続き頑張りましょう。',
    ];
    return analyses[dayNum % analyses.length];
  };

  if (photos.length === 0) {
    return (
      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-2">ボディフォトギャラリー</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          まだ写真がありません。<br />ホームからボディフォトを撮影しよう！
        </p>
      </div>
    );
  }

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-semibold mb-1">ボディフォトギャラリー</h3>
      <p className="text-xs text-muted-foreground mb-3">{photos.length}枚の記録</p>

      {/* Thumbnail scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto snap-x-mandatory scrollbar-hide pb-2"
      >
        {photos.map((p) => {
          const d = parseDate(p.date);
          return (
            <button
              key={p.date}
              onClick={() => setSelectedPhoto(p)}
              className="shrink-0 w-20 h-24 rounded-xl overflow-hidden relative tap-active snap-center"
            >
              <img src={p.photo} alt={p.date} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                {d.getMonth() + 1}/{d.getDate()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Full-size viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 rounded-2xl">
          {selectedPhoto && (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={selectedPhoto.photo}
                  alt={selectedPhoto.date}
                  className="w-full max-h-[60vh] object-contain rounded-xl"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {parseDate(selectedPhoto.date).getMonth() + 1}/{parseDate(selectedPhoto.date).getDate()}
                </div>
              </div>
              
              {/* AI Analysis */}
              <div className="bg-sunrise-peach/30 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">🤖</span>
                  <span className="text-xs font-medium">筋肉分析</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {getMuscleAnalysis(selectedPhoto.date)}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = photos.findIndex((p) => p.date === selectedPhoto.date);
                    if (idx > 0) setSelectedPhoto(photos[idx - 1]);
                  }}
                  disabled={photos.findIndex((p) => p.date === selectedPhoto.date) === 0}
                >
                  <ChevronLeft size={16} /> 前
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = photos.findIndex((p) => p.date === selectedPhoto.date);
                    if (idx < photos.length - 1) setSelectedPhoto(photos[idx + 1]);
                  }}
                  disabled={photos.findIndex((p) => p.date === selectedPhoto.date) === photos.length - 1}
                >
                  次 <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Training Pace Component
function TrainingPace() {
  const records = getAllTrainingRecords();
  const today = getToday();
  const weekDates = (() => {
    const base = new Date();
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((day + 6) % 7));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  })();

  const weekTrainingDays = weekDates.filter((d) => records[d]?.completed).length;
  const paceLabel = weekTrainingDays >= 4 ? 'Great!' : weekTrainingDays >= 2 ? 'Good' : 'Pace Up!';
  const paceColor = weekTrainingDays >= 4 ? 'text-sunrise-green' : weekTrainingDays >= 2 ? 'text-sunrise-orange' : 'text-destructive';

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-semibold mb-3">筋トレペース（過去7日間）</h3>
      <div className="text-center">
        <div className={`inline-block px-4 py-1.5 rounded-full bg-sunrise-warm-yellow/30 text-sm font-bold ${paceColor}`}>
          ⚡ {paceLabel}
        </div>
        <div className="mt-3">
          <span className="text-4xl font-bold font-display text-sunrise-orange">{weekTrainingDays}</span>
          <span className="text-lg text-muted-foreground"> / 7日</span>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        {weekDates.map((d, i) => {
          const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
          const hasTraining = records[d]?.completed;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  hasTraining ? 'bg-sunrise-orange' : 'bg-muted'
                }`}
              />
              <span className="text-[10px] text-muted-foreground">{dayNames[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Review Page
export default function Review() {
  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">振り返り</h1>
        <p className="text-sm text-muted-foreground mt-0.5">あなたの成長記録</p>
      </div>

      <AIAdvice />
      <MuscleHeatmapView />
      <MonthlyDistance />
      <SleepChart />
      <TrainingPace />
      <DetailedAnalysis />
      <BodyPhotoGallery />
    </div>
  );
}
