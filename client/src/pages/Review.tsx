/**
 * Review Page - Growth tracking and analytics
 * Sections: AI Advice, Muscle Heatmap, Monthly Distance, Distance Trend,
 *           Sleep, Body Photo Gallery
 * (TrainingPace removed, AI photo analysis removed, gallery swipe-based)
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  getAllScheduleDays,
} from '@/lib/store';
import type { MuscleGroup, MuscleHeatmap } from '@/lib/types';

// Muscle Heatmap SVG Component
function MuscleHeatmapView() {
  const [heatmap, setHeatmap] = useState<MuscleHeatmap>(() => getMuscleHeatmap());

  const getColor = (count: number) => {
    const ratio = Math.min(count / heatmap.maxCount, 1);
    if (ratio === 0) return '#e5e7eb';
    if (ratio < 0.25) return '#93c5fd';
    if (ratio < 0.5) return '#fbbf24';
    if (ratio < 0.75) return '#f97316';
    return '#ef4444';
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
        <h3 className="text-sm font-semibold text-foreground">マッスルヒートマップ</h3>
        <span className="text-xs bg-sunrise-orange/20 text-sunrise-orange px-2 py-0.5 rounded-full font-medium">
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
        <div className="w-32 shrink-0">
          <svg viewBox="0 0 120 280" className="w-full">
            <circle cx="60" cy="25" r="18" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
            <rect x="52" y="43" width="16" height="12" fill="#e5e7eb" rx="3" />
            <path d="M30 55 Q60 50 90 55 L88 95 Q60 100 32 95 Z"
              fill={getColor(heatmap.counts['胸'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <path d="M38 95 Q60 100 82 95 L80 145 Q60 148 40 145 Z"
              fill={getColor(heatmap.counts['腹筋'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <ellipse cx="22" cy="62" rx="12" ry="10"
              fill={getColor(heatmap.counts['肩'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <ellipse cx="98" cy="62" rx="12" ry="10"
              fill={getColor(heatmap.counts['肩'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <path d="M12 72 L6 130 L18 130 L22 72 Z"
              fill={getColor(heatmap.counts['腕'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <path d="M98 72 L102 130 L114 130 L108 72 Z"
              fill={getColor(heatmap.counts['腕'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <path d="M40 148 L32 240 L48 240 L52 148 Z"
              fill={getColor(heatmap.counts['脚'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <path d="M68 148 L72 240 L88 240 L80 148 Z"
              fill={getColor(heatmap.counts['脚'] || 0)} stroke="#d1d5db" strokeWidth="0.5" />
            <rect x="42" y="58" width="36" height="35" rx="4" opacity="0.3"
              fill={getColor(heatmap.counts['背中'] || 0)} />
          </svg>
        </div>

        <div className="flex-1 space-y-2">
          {(['胸', '背中', '肩', '腕', '脚', '腹筋'] as MuscleGroup[]).map((muscle) => {
            const count = heatmap.counts[muscle] || 0;
            return (
              <div key={muscle} className="flex items-center justify-between text-sm">
                <span className="font-medium w-10 text-foreground">{muscle}</span>
                <span className="text-muted-foreground text-xs">{count}/{heatmap.maxCount}</span>
                <div
                  className="w-5 h-5 rounded-full border border-white/50"
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
          <div className="w-3 h-3 rounded-full bg-[#f97316]" /> On Fire
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" /> MAX
        </div>
      </div>

      {/* Status message */}
      <div className="mt-3 text-center text-sm text-foreground/70 bg-muted/50 rounded-lg py-2">
        {totalProgress === 0
          ? 'まだ体は冷えています... トレーニングを記録して体に火をつけよう！'
          : totalProgress < 50
          ? 'いい感じに温まってきた！この調子で続けよう！'
          : totalProgress < 100
          ? 'もうすぐ完全燃焼！ラストスパート！'
          : '完全燃焼達成！新しいサイクルを始めよう！'}
      </div>

      {/* Reset button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full mt-3 py-3 rounded-xl bg-sunrise-orange/10 text-sunrise-orange text-sm font-medium tap-active">
            新しいサイクルを開始する
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

// AI Advice Component - Detailed, practical, and helpful
function AIAdvice() {
  const records = getAllTrainingRecords();
  const running = getAllRunningRecords();
  const sleepRecords = getAllSleepRecords();
  const bodyLogs = getAllBodyLogs();
  const schedule = getAllScheduleDays();
  const settings = getSettings();
  
  const trainingDays = Object.keys(records).length;
  const runningDays = Object.keys(running).length;
  const totalDistance = Object.values(running).reduce((sum, r) => sum + (r.distance || 0), 0);
  
  const getAdvice = (): { title: string; content: string; icon: string }[] => {
    const advices: { title: string; content: string; icon: string }[] = [];
    
    if (trainingDays === 0 && runningDays === 0) {
      return [{
        icon: '📝',
        title: 'まずは記録を始めよう',
        content: 'トレーニングを記録していくと、あなたの習慣に合わせたパーソナライズされたアドバイスが表示されます。スケジュールタブから今週のメニューを設定して、最初の一歩を踏み出しましょう。',
      }];
    }
    
    // Muscle balance analysis
    if (trainingDays > 0) {
      const muscleFreq: Record<string, number> = {};
      Object.values(records).forEach((r) => {
        r.muscleGroups.forEach((m) => {
          muscleFreq[m] = (muscleFreq[m] || 0) + 1;
        });
      });
      const sorted = Object.entries(muscleFreq).sort((a, b) => b[1] - a[1]);
      
      if (sorted.length >= 2) {
        const most = sorted[0];
        const least = sorted[sorted.length - 1];
        const ratio = most[1] / Math.max(least[1], 1);
        
        if (ratio > 2) {
          advices.push({
            icon: '⚖️',
            title: '筋肉バランスに注意',
            content: `「${most[0]}」を${most[1]}回鍛えている一方、「${least[0]}」は${least[1]}回です。特定部位に偏ると姿勢の歪みや怪我のリスクが高まります。週に1回は「${least[0]}」の日を入れることをおすすめします。リーンバルクでは全身のバランスが見た目の印象を大きく左右します。`,
          });
        } else {
          advices.push({
            icon: '✅',
            title: 'バランスの良いトレーニング',
            content: `各部位をバランスよく鍛えられています。最多は「${most[0]}」(${most[1]}回)、最少は「${least[0]}」(${least[1]}回)。この調子で全身まんべんなく鍛え続けましょう。バランスの良いトレーニングは怪我の予防にもつながります。`,
          });
        }
      }
      
      // Training frequency advice
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const recentTraining = Object.values(records).filter(r => r.date >= `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth()+1).padStart(2,'0')}-${String(thirtyDaysAgo.getDate()).padStart(2,'0')}`);
      const weeklyAvg = (recentTraining.length / 4.3).toFixed(1);
      
      if (recentTraining.length > 0) {
        const freq = parseFloat(weeklyAvg);
        if (freq < 2) {
          advices.push({
            icon: '📈',
            title: 'トレーニング頻度を上げよう',
            content: `過去30日間の平均は週${weeklyAvg}回です。筋肥大（バルクアップ）には週3-5回のトレーニングが理想的です。まずは週3回を目標にしてみましょう。1回のトレーニング時間は45-60分で十分です。無理のない範囲で少しずつ頻度を上げていきましょう。`,
          });
        } else if (freq >= 5) {
          advices.push({
            icon: '⚠️',
            title: 'オーバートレーニングに注意',
            content: `過去30日間の平均は週${weeklyAvg}回とかなりハイペースです。筋肉は休息中に成長するため、週に最低1-2日の完全休養日を確保しましょう。疲労が蓄積すると免疫力低下や怪我のリスクが高まります。質の高いトレーニングと十分な休養のバランスが大切です。`,
          });
        } else {
          advices.push({
            icon: '💪',
            title: '良いトレーニングペース',
            content: `過去30日間の平均は週${weeklyAvg}回で、筋肥大に適したペースです。この頻度を維持しながら、徐々に重量やセット数を増やす「漸進性過負荷」を意識すると、さらに効果的です。`,
          });
        }
      }
    }
    
    // Running advice
    if (runningDays > 0) {
      const avgDist = totalDistance / runningDays;
      if (avgDist < 3) {
        advices.push({
          icon: '🏃',
          title: 'ランニング距離を伸ばそう',
          content: `現在の平均距離は${avgDist.toFixed(1)}km/回です。バルクアップ中の有酸素運動は、脂肪の蓄積を抑えつつ心肺機能を維持するのに重要です。まずは3-5kmを目標に、週2-3回のペースで走りましょう。ただし、やりすぎると筋肉の分解が進むので、1回30分以内が目安です。`,
        });
      } else {
        advices.push({
          icon: '🏃',
          title: 'ランニングは順調',
          content: `平均${avgDist.toFixed(1)}km/回のペースで走れています（合計${totalDistance.toFixed(1)}km）。バルクアップ中は有酸素運動のやりすぎに注意。筋トレ後のランニングは脂肪燃焼効果が高いですが、30分以内に抑えると筋肉の分解を最小限にできます。`,
        });
      }
    }

    // Sleep advice
    const sleepArr = Object.values(sleepRecords).filter((s) => s.sleepHours);
    if (sleepArr.length > 0) {
      const avgSleep = sleepArr.reduce((sum, s) => sum + (s.sleepHours || 0), 0) / sleepArr.length;
      if (avgSleep < 6) {
        advices.push({
          icon: '😴',
          title: '睡眠を改善しよう（重要）',
          content: `平均睡眠時間は${avgSleep.toFixed(1)}時間で、かなり不足しています。睡眠中に分泌される成長ホルモンは筋肉の修復・成長に不可欠です。睡眠不足はテストステロンの低下にもつながり、筋肥大の効率が大幅に落ちます。7-8時間の睡眠を確保するために、就寝1時間前のスマホ使用を控え、寝室を暗くすることから始めましょう。`,
        });
      } else if (avgSleep < 7) {
        advices.push({
          icon: '🌙',
          title: '睡眠をもう少し確保しよう',
          content: `平均${avgSleep.toFixed(1)}時間の睡眠は悪くないですが、筋肥大の最適値は7-9時間です。あと30分-1時間早く寝ることで、成長ホルモンの分泌が増え、トレーニング効果が向上します。昼寝（20分程度）も回復に効果的です。`,
        });
      } else {
        advices.push({
          icon: '✨',
          title: '睡眠は理想的',
          content: `平均${avgSleep.toFixed(1)}時間の睡眠は筋肥大に理想的な範囲です。質の良い睡眠が筋肉の回復と成長をしっかりサポートしています。この習慣を維持しましょう。`,
        });
      }
    }

    // Weight progress advice
    const weights = Object.values(bodyLogs)
      .filter((b) => b.weight)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (weights.length >= 2) {
      const first = weights[0].weight!;
      const latest = weights[weights.length - 1].weight!;
      const change = latest - first;
      const target = settings.targetWeight;
      const remaining = target - latest;
      
      if (change > 0 && remaining > 0) {
        advices.push({
          icon: '📊',
          title: '体重は増加傾向',
          content: `開始${first}kg → 現在${latest}kg（+${change.toFixed(1)}kg）。目標${target}kgまであと${remaining.toFixed(1)}kgです。リーンバルクの理想的な増量ペースは月0.5-1kgです。急激な増量は脂肪の蓄積につながるので、タンパク質を体重×1.6-2.2g/日摂取しながら、ゆっくり増やしていきましょう。`,
        });
      } else if (change <= 0) {
        advices.push({
          icon: '📊',
          title: '体重が減少傾向',
          content: `開始${first}kg → 現在${latest}kg（${change.toFixed(1)}kg）。バルクアップが目標なら、カロリー摂取量を見直しましょう。基礎代謝+300-500kcalの摂取が目安です。特にトレーニング後30分以内のタンパク質摂取（20-30g）を意識すると効果的です。`,
        });
      }
    }

    return advices.length > 0 ? advices : [{
      icon: '💡',
      title: 'データを蓄積中',
      content: 'もう少しデータが集まると、より具体的なアドバイスが表示されます。毎日の記録を続けましょう。',
    }];
  };

  const advices = getAdvice();

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
        AIからのアドバイス
      </h3>
      <div className="space-y-4">
        {advices.map((advice, i) => (
          <div key={i} className="bg-white/60 rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{advice.icon}</span>
              <h4 className="text-sm font-bold text-foreground">{advice.title}</h4>
            </div>
            <p className="text-[13px] text-foreground/80 leading-relaxed">
              {advice.content}
            </p>
          </div>
        ))}
      </div>
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
        <h3 className="text-sm font-semibold mb-2 text-foreground">今月の総距離</h3>
        <div className="text-center py-3">
          <span className="text-4xl font-bold font-display text-sunrise-orange">
            {currentMonth.toFixed(1)}
          </span>
          <span className="text-lg text-foreground/60 ml-1">km</span>
        </div>
      </div>

      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-3 text-foreground">月別総距離推移</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {pastMonths.map((m, i) => {
            const maxDist = Math.max(...pastMonths.map((p) => p.distance), 1);
            const height = (m.distance / maxDist) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-foreground/60">{m.distance.toFixed(0)}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: i === pastMonths.length - 1 ? '#E8734A' : '#c4b5fd',
                  }}
                />
                <span className="text-[10px] text-foreground/60">{m.label.split('/')[1]}月</span>
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
        <h3 className="text-sm font-semibold text-foreground">睡眠</h3>
        <span className="text-xs text-foreground/50">過去7日間</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold font-display text-foreground">
          {avgHours ? `${avgHours.toFixed(1)}h` : '--'}
        </span>
        <span className="text-xs text-foreground/60">平均 / 日</span>
        {!avgHours && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/50">データなし</span>
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
            <span className="text-[10px] text-foreground/60">{d.day}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-foreground/60">
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

// Body Photo Gallery Component - Swipe-based full-screen viewer
function BodyPhotoGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  const photos = useMemo(() => {
    const logs = getAllBodyLogs();
    return Object.values(logs)
      .filter((l) => l.photo)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({ date: l.date, photo: l.photo! }));
  }, []);

  // Scroll to selected photo when opening viewer
  useEffect(() => {
    if (selectedIndex !== null && viewerRef.current) {
      const container = viewerRef.current;
      const targetScroll = selectedIndex * container.clientWidth;
      container.scrollTo({ left: targetScroll, behavior: 'instant' });
    }
  }, [selectedIndex]);

  if (photos.length === 0) {
    return (
      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-2 text-foreground">ボディフォトギャラリー</h3>
        <p className="text-sm text-foreground/60 text-center py-6">
          まだ写真がありません。<br />ホームからボディフォトを撮影しよう！
        </p>
      </div>
    );
  }

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-semibold mb-1 text-foreground">ボディフォトギャラリー</h3>
      <p className="text-xs text-foreground/60 mb-3">{photos.length}枚の記録</p>

      {/* Thumbnail scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto snap-x-mandatory scrollbar-hide pb-2"
      >
        {photos.map((p, idx) => {
          const d = parseDate(p.date);
          return (
            <button
              key={p.date}
              onClick={() => setSelectedIndex(idx)}
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

      {/* Full-size swipe viewer */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-between items-center p-4 text-white">
              <span className="text-sm font-medium">
                {selectedIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setSelectedIndex(null)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center tap-active"
              >
                <X size={20} />
              </button>
            </div>

            {/* Swipeable photo container */}
            <div
              ref={viewerRef}
              className="flex-1 overflow-x-auto snap-x-mandatory scrollbar-hide flex"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollLeft = container.scrollLeft;
                const width = container.clientWidth;
                const newIndex = Math.round(scrollLeft / width);
                if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < photos.length) {
                  setSelectedIndex(newIndex);
                }
              }}
            >
              {photos.map((p, idx) => {
                const d = parseDate(p.date);
                return (
                  <div
                    key={p.date}
                    className="shrink-0 w-full h-full flex flex-col items-center justify-center px-4"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <img
                      src={p.photo}
                      alt={p.date}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl"
                    />
                    <div className="mt-3 text-white text-center">
                      <span className="text-lg font-bold">
                        {d.getFullYear()}/{d.getMonth() + 1}/{d.getDate()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot indicators */}
            {photos.length <= 20 && (
              <div className="flex justify-center gap-1.5 pb-8">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === selectedIndex ? 'bg-white scale-125' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Comprehensive Analysis Component
function ComprehensiveAnalysis() {
  const bodyLogs = getAllBodyLogs();
  const trainingRecords = getAllTrainingRecords();
  const runningRecords = getAllRunningRecords();
  const sleepRecords = getAllSleepRecords();
  const settings = getSettings();

  const weights = Object.values(bodyLogs)
    .filter((b) => b.weight)
    .sort((a, b) => a.date.localeCompare(b.date));

  const trainingDays = Object.keys(trainingRecords).length;
  const runningDays = Object.keys(runningRecords).length;
  const totalDistance = Object.values(runningRecords).reduce((sum, r) => sum + (r.distance || 0), 0);
  const sleepArr = Object.values(sleepRecords).filter((s) => s.sleepHours);
  const avgSleep = sleepArr.length > 0
    ? sleepArr.reduce((sum, s) => sum + (s.sleepHours || 0), 0) / sleepArr.length
    : null;

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const startWeight = weights.length > 0 ? weights[0].weight : null;
  const weightChange = latestWeight && startWeight ? latestWeight - startWeight : null;
  const remaining = latestWeight ? settings.targetWeight - latestWeight : null;

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
        総合分析
      </h3>

      {/* Weight Progress */}
      <div className="bg-white/60 rounded-xl p-4 border border-border/50 mb-3">
        <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">体重推移</h4>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-foreground/50">開始</p>
            <p className="text-lg font-bold text-foreground">{startWeight || '--'}kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground/50">現在</p>
            <p className="text-lg font-bold text-sunrise-orange">{latestWeight || '--'}kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground/50">目標</p>
            <p className="text-lg font-bold text-foreground">{settings.targetWeight}kg</p>
          </div>
        </div>
        {weightChange !== null && (
          <div className="mt-2 text-center">
            <span className={`text-sm font-bold ${weightChange >= 0 ? 'text-sunrise-green' : 'text-red-500'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
            </span>
            {remaining !== null && remaining > 0 && (
              <span className="text-xs text-foreground/50 ml-2">あと{remaining.toFixed(1)}kg</span>
            )}
          </div>
        )}
        {/* Simple weight chart */}
        {weights.length >= 2 && (
          <div className="mt-3 h-16 flex items-end gap-0.5">
            {weights.slice(-14).map((w, i) => {
              const min = Math.min(...weights.slice(-14).map(x => x.weight || 0));
              const max = Math.max(...weights.slice(-14).map(x => x.weight || 0), min + 1);
              const h = ((w.weight || 0) - min) / (max - min) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-sm bg-sunrise-orange/60"
                    style={{ height: `${Math.max(h, 8)}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/60 rounded-xl p-3 border border-border/50 text-center">
          <p className="text-2xl font-bold font-display text-indigo-600">{trainingDays}</p>
          <p className="text-xs text-foreground/50">筋トレ日数</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 border border-border/50 text-center">
          <p className="text-2xl font-bold font-display text-sunrise-green">{runningDays}</p>
          <p className="text-xs text-foreground/50">ランニング日数</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 border border-border/50 text-center">
          <p className="text-2xl font-bold font-display text-sunrise-orange">{totalDistance.toFixed(1)}</p>
          <p className="text-xs text-foreground/50">総走行距離(km)</p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 border border-border/50 text-center">
          <p className="text-2xl font-bold font-display text-purple-600">{avgSleep ? `${avgSleep.toFixed(1)}h` : '--'}</p>
          <p className="text-xs text-foreground/50">平均睡眠時間</p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white/60 rounded-xl p-4 border border-border/50 mt-3 text-center">
        <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">継続記録</h4>
        <div className="flex justify-center gap-8">
          <div>
            <p className="text-2xl font-bold font-display text-indigo-600">{weights.length}</p>
            <p className="text-xs text-foreground/50">総記録日数</p>
          </div>
        </div>
        <p className="text-xs text-sunrise-orange font-medium mt-2">記録を続けよう！</p>
      </div>
    </div>
  );
}

// Main Review Page - Order: AI, Muscle Heatmap, Running, Sleep, Comprehensive Analysis, Body Photo Gallery
export default function Review() {
  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">振り返り</h1>
        <p className="text-sm text-foreground/60 mt-0.5">あなたの成長記録</p>
      </div>

      <AIAdvice />
      <MuscleHeatmapView />
      <MonthlyDistance />
      <SleepChart />
      <ComprehensiveAnalysis />
      <BodyPhotoGallery />
    </div>
  );
}
