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
  getWeightTrendData,
} from '@/lib/store';
import { getAllPhotos } from '@/lib/photoDb';
import type { MuscleGroup, MuscleHeatmap, GoalMode } from '@/lib/types';
import { GOAL_MODE_LABELS } from '@/lib/types';

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
        <div className="w-36 shrink-0">
          {(() => {
            // 進捗に応じて筋肉の太さを変える（徐々にカッコよくなる）
            const getMuscleBulk = (count: number) => {
              const ratio = Math.min(count / heatmap.maxCount, 1);
              return 1 + ratio * 0.35; // 1.0 ~ 1.35
            };
            const chestBulk = getMuscleBulk(heatmap.counts['胸'] || 0);
            const shoulderBulk = getMuscleBulk(heatmap.counts['肩'] || 0);
            const armBulk = getMuscleBulk(heatmap.counts['腕'] || 0);
            const legBulk = getMuscleBulk(heatmap.counts['脚'] || 0);
            const absBulk = getMuscleBulk(heatmap.counts['腹筋'] || 0);
            const backBulk = getMuscleBulk(heatmap.counts['背中'] || 0);
            // 筋肉のディテール線の透明度（進捗が高いほどくっきり）
            const getDetailOpacity = (count: number) => {
              const ratio = Math.min(count / heatmap.maxCount, 1);
              return ratio * 0.6;
            };
            return (
              <svg viewBox="0 0 140 300" className="w-full drop-shadow-sm">
                <defs>
                  <radialGradient id="headGrad" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#d4c5b0" />
                    <stop offset="100%" stopColor="#c4b49a" />
                  </radialGradient>
                  <linearGradient id="bodyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Head */}
                <ellipse cx="70" cy="28" rx="16" ry="19" fill="url(#headGrad)" stroke="#b8a88a" strokeWidth="0.5" />
                {/* Neck */}
                <path d="M62 45 Q70 47 78 45 L77 55 Q70 56 63 55 Z" fill="#d4c5b0" stroke="#b8a88a" strokeWidth="0.3" />
                {/* Trapezius / upper back */}
                <path d={`M${70 - 12 * backBulk} 52 Q70 48 ${70 + 12 * backBulk} 52 L${70 + 10 * backBulk} 62 Q70 64 ${70 - 10 * backBulk} 62 Z`}
                  fill={getColor(heatmap.counts['背中'] || 0)} stroke="#b8a88a" strokeWidth="0.3" opacity="0.5" />
                {/* Shoulders - deltoids */}
                <ellipse cx={70 - 28 * shoulderBulk} cy="62" rx={14 * shoulderBulk} ry={11 * shoulderBulk}
                  fill={getColor(heatmap.counts['肩'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                <ellipse cx={70 + 28 * shoulderBulk} cy="62" rx={14 * shoulderBulk} ry={11 * shoulderBulk}
                  fill={getColor(heatmap.counts['肩'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Chest - pectorals */}
                <path d={`M${70 - 22 * chestBulk} 58 Q70 54 ${70 + 22 * chestBulk} 58 L${70 + 20 * chestBulk} 88 Q70 92 ${70 - 20 * chestBulk} 88 Z`}
                  fill={getColor(heatmap.counts['胸'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Chest detail line */}
                <line x1="70" y1="60" x2="70" y2="88" stroke="#8b7355" strokeWidth="0.5" opacity={getDetailOpacity(heatmap.counts['胸'] || 0)} />
                <path d={`M${70 - 8 * chestBulk} 72 Q70 75 ${70 + 8 * chestBulk} 72`} fill="none" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['胸'] || 0)} />
                {/* Abs */}
                <path d={`M${70 - 16 * absBulk} 90 Q70 88 ${70 + 16 * absBulk} 90 L${70 + 14 * absBulk} 148 Q70 152 ${70 - 14 * absBulk} 148 Z`}
                  fill={getColor(heatmap.counts['腹筋'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Abs detail lines (6-pack) */}
                {[100, 112, 124, 136].map((y) => (
                  <line key={y} x1={70 - 10 * absBulk} y1={y} x2={70 + 10 * absBulk} y2={y}
                    stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['腹筋'] || 0)} />
                ))}
                <line x1="70" y1="92" x2="70" y2="145" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['腹筋'] || 0)} />
                {/* Arms - biceps + forearms */}
                {/* Left arm */}
                <path d={`M${70 - 30 * shoulderBulk} 68 
                  Q${70 - 34 * armBulk} 95 ${70 - 36 * armBulk} 115 
                  L${70 - 42 * armBulk} 115 
                  Q${70 - 38 * armBulk} 95 ${70 - 36 * shoulderBulk} 68 Z`}
                  fill={getColor(heatmap.counts['腕'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Left forearm */}
                <path d={`M${70 - 34 * armBulk} 117 
                  Q${70 - 32 * armBulk} 140 ${70 - 30 * armBulk * 0.8} 158 
                  L${70 - 36 * armBulk * 0.8} 158 
                  Q${70 - 40 * armBulk} 140 ${70 - 42 * armBulk} 117 Z`}
                  fill={getColor(heatmap.counts['腕'] || 0)} stroke="#b8a88a" strokeWidth="0.5" opacity="0.85" />
                {/* Bicep detail */}
                <path d={`M${70 - 34 * armBulk} 80 Q${70 - 37 * armBulk} 95 ${70 - 35 * armBulk} 110`}
                  fill="none" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['腕'] || 0)} />
                {/* Right arm */}
                <path d={`M${70 + 30 * shoulderBulk} 68 
                  Q${70 + 34 * armBulk} 95 ${70 + 36 * armBulk} 115 
                  L${70 + 42 * armBulk} 115 
                  Q${70 + 38 * armBulk} 95 ${70 + 36 * shoulderBulk} 68 Z`}
                  fill={getColor(heatmap.counts['腕'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Right forearm */}
                <path d={`M${70 + 34 * armBulk} 117 
                  Q${70 + 32 * armBulk} 140 ${70 + 30 * armBulk * 0.8} 158 
                  L${70 + 36 * armBulk * 0.8} 158 
                  Q${70 + 40 * armBulk} 140 ${70 + 42 * armBulk} 117 Z`}
                  fill={getColor(heatmap.counts['腕'] || 0)} stroke="#b8a88a" strokeWidth="0.5" opacity="0.85" />
                {/* Bicep detail */}
                <path d={`M${70 + 34 * armBulk} 80 Q${70 + 37 * armBulk} 95 ${70 + 35 * armBulk} 110`}
                  fill="none" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['腕'] || 0)} />
                {/* Legs - quads */}
                {/* Left leg */}
                <path d={`M${70 - 14 * legBulk} 150 
                  Q${70 - 18 * legBulk} 190 ${70 - 16 * legBulk} 230 
                  L${70 - 22 * legBulk} 230 
                  Q${70 - 24 * legBulk} 190 ${70 - 2} 150 Z`}
                  fill={getColor(heatmap.counts['脚'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Left calf */}
                <path d={`M${70 - 15 * legBulk} 232 
                  Q${70 - 17 * legBulk} 255 ${70 - 14 * legBulk * 0.8} 275 
                  L${70 - 20 * legBulk * 0.8} 275 
                  Q${70 - 23 * legBulk} 255 ${70 - 23 * legBulk} 232 Z`}
                  fill={getColor(heatmap.counts['脚'] || 0)} stroke="#b8a88a" strokeWidth="0.5" opacity="0.85" />
                {/* Quad detail */}
                <path d={`M${70 - 16 * legBulk} 165 Q${70 - 19 * legBulk} 195 ${70 - 17 * legBulk} 225`}
                  fill="none" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['脚'] || 0)} />
                {/* Right leg */}
                <path d={`M${70 + 2} 150 
                  Q${70 + 24 * legBulk} 190 ${70 + 22 * legBulk} 230 
                  L${70 + 16 * legBulk} 230 
                  Q${70 + 18 * legBulk} 190 ${70 + 14 * legBulk} 150 Z`}
                  fill={getColor(heatmap.counts['脚'] || 0)} stroke="#b8a88a" strokeWidth="0.5" />
                {/* Right calf */}
                <path d={`M${70 + 23 * legBulk} 232 
                  Q${70 + 23 * legBulk} 255 ${70 + 20 * legBulk * 0.8} 275 
                  L${70 + 14 * legBulk * 0.8} 275 
                  Q${70 + 17 * legBulk} 255 ${70 + 15 * legBulk} 232 Z`}
                  fill={getColor(heatmap.counts['脚'] || 0)} stroke="#b8a88a" strokeWidth="0.5" opacity="0.85" />
                {/* Quad detail */}
                <path d={`M${70 + 16 * legBulk} 165 Q${70 + 19 * legBulk} 195 ${70 + 17 * legBulk} 225`}
                  fill="none" stroke="#8b7355" strokeWidth="0.4" opacity={getDetailOpacity(heatmap.counts['脚'] || 0)} />
                {/* Body glow overlay */}
                <rect x="44" y="55" width="52" height="95" rx="8" fill="url(#bodyGlow)" opacity="0.3" />
              </svg>
            );
          })()}
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

// ===== Goal-mode aware advice helpers =====
function getGoalModeEmoji(mode: GoalMode): string {
  return mode === 'bulk' ? '💪' : mode === 'maintain' ? '⚖️' : '🔥';
}

// AI Advice Component - Goal-mode aware, detailed, practical
function AIAdvice() {
  const records = getAllTrainingRecords();
  const running = getAllRunningRecords();
  const sleepRecords = getAllSleepRecords();
  const bodyLogs = getAllBodyLogs();
  const schedule = getAllScheduleDays();
  const settings = getSettings();
  const goalMode = settings.goalMode || 'bulk';
  
  const trainingDays = Object.keys(records).length;
  const runningDays = Object.keys(running).length;
  const totalDistance = Object.values(running).reduce((sum, r) => sum + (r.distance || 0), 0);
  
  const getAdvice = (): { title: string; content: string; icon: string }[] => {
    const advices: { title: string; content: string; icon: string }[] = [];
    
    // 過去30日の基準日を全アドバイスで共有
    const nowDate = new Date();
    const thirtyDaysAgoDate = new Date(nowDate);
    thirtyDaysAgoDate.setDate(nowDate.getDate() - 30);
    const thirtyDaysAgoStr = `${thirtyDaysAgoDate.getFullYear()}-${String(thirtyDaysAgoDate.getMonth()+1).padStart(2,'0')}-${String(thirtyDaysAgoDate.getDate()).padStart(2,'0')}`;

    // Goal mode banner
    advices.push({
      icon: getGoalModeEmoji(goalMode),
      title: `現在のモード: ${GOAL_MODE_LABELS[goalMode]}`,
      content: goalMode === 'bulk'
        ? 'タンパク質 体重×1.6-2.2g/日、カロリー +300-500kcal。月0.5-1kgのペースでリーンバルク。'
        : goalMode === 'maintain'
        ? '摄取=消費のバランスを守る。トレーニングの質と頂点重量を維持することが目標。'
        : 'タンパク質 体重×2.0-2.4g/日、カロリー -300-500kcal。週0.5-1%以内の減量が筋肉を守る。',
    });
    
    if (trainingDays === 0 && runningDays === 0) {
      advices.push({
        icon: '📝',
        title: 'まずは記録を始めよう',
        content: 'トレーニングを記録していくと、あなたの習慣に合わせたパーソナライズされたアドバイスが表示されます。スケジュールタブから今週のメニューを設定して、最初の一歩を踏み出しましょう。',
      });
      return advices;
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
            content: `${most[0]} ${most[1]}回 vs ${least[0]} ${least[1]}回—差が大きすぎます。週に1回「${least[0]}」を入れて均衡を回復しましょう。`,
          });
        } else {
          advices.push({
            icon: '✅',
            title: '全身バランス良好',
            content: `最多 ${most[0]}(${most[1]}回) — 最少 ${least[0]}(${least[1]}回)。このバランスを維持してください。`,
          });
        }
      }
      
      // Training frequency advice (goal-mode aware)
      const recentTraining = Object.values(records).filter(r => r.date >= thirtyDaysAgoStr);
      // 実際のトレーニング期間から正確な週数を算出
      const recentDates = recentTraining.map(r => r.date).sort();
      let actualWeeks = 30 / 7; // デフォルト30日÷7
      if (recentDates.length >= 2) {
        const firstDate = parseDate(recentDates[0]);
        const lastDate = parseDate(recentDates[recentDates.length - 1]);
        const daySpan = Math.max((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24), 7);
        actualWeeks = daySpan / 7;
      } else if (recentDates.length === 1) {
        actualWeeks = 1;
      }
      const weeklyAvg = (recentTraining.length / actualWeeks).toFixed(1);
      
      if (recentTraining.length > 0) {
        const freq = parseFloat(weeklyAvg);
        if (goalMode === 'cut') {
          if (freq < 2) {
            advices.push({ icon: '📈', title: '減量中もトレーニングを維持しよう',
              content: `週${weeklyAvg}回—減量中は週3-4回が筋肉分解を防ぐ最低ライン。重量を落とさずセット数で調整。` });
          } else if (freq >= 5) {
            advices.push({ icon: '⚠️', title: '減量中のオーバートレーニングに注意',
              content: `週${weeklyAvg}回—カロリー不足時は回復力が低下。週4回に抑え、休養を優先。` });
          } else {
            advices.push({ icon: '💪', title: '良いトレーニングペース',
              content: `週${weeklyAvg}回—減量中に筋肉を守る最適ペース。重量を維持し続けて。` });
          }
        } else if (goalMode === 'maintain') {
          if (freq < 2) {
            advices.push({ icon: '📈', title: 'トレーニング頻度を上げよう',
              content: `週${weeklyAvg}回—体型維持には週3-4回が理想。頂点重量を落とさないことが大切。` });
          } else {
            advices.push({ icon: '💪', title: '良いトレーニングペース',
              content: `週${weeklyAvg}回—維持に適したペース。フォーム改善や新種目にチャレンジして刺激を入れよう。` });
          }
        } else {
          if (freq < 2) {
            advices.push({ icon: '📈', title: 'トレーニング頻度を上げよう',
              content: `週${weeklyAvg}回—バルクには週3-5回が理想。1回45-60分、まず週３回から始めよう。` });
          } else if (freq >= 5) {
            advices.push({ icon: '⚠️', title: 'オーバートレーニングに注意',
              content: `週${weeklyAvg}回—筋肉は休息中に成長する。週1-2日の完全休養を必ず取ること。` });
          } else {
            advices.push({ icon: '💪', title: '良いトレーニングペース',
              content: `週${weeklyAvg}回—筋肥大に最適ペース。漸進性過負荷（重量・セット数を少しずつ増やす）を意識して。` });
          }
        }
      }
    }
    
    // Running advice (goal-mode aware)
    if (runningDays > 0) {
      const avgDist = totalDistance / runningDays;
      // ランニング頻度も正確に算出
      const recentRunning30 = Object.values(running).filter(r => r.date >= thirtyDaysAgoStr);
      const runFreqWeekly = recentRunning30.length > 0 ? (recentRunning30.length / (30 / 7)).toFixed(1) : '0';
      if (goalMode === 'cut') {
        advices.push({ icon: '🏃',
          title: avgDist >= 3 ? 'ランニングで脂肪燃焼中' : 'ランニング距離を伸ばそう',
          content: avgDist >= 3
            ? `平均${avgDist.toFixed(1)}km/回・週${runFreqWeekly}回ペース。減量中の有酸素は強力。ただし1回45分以上は筋肉分解リスク—HIITも有効。`
            : `平均${avgDist.toFixed(1)}km/回・週${runFreqWeekly}回ペース。3-5km・週3-4回を目標に。筋トレ後に走ると脂肪燃焼効果が高まる。`,
        });
      } else if (goalMode === 'maintain') {
        advices.push({ icon: '🏃', title: 'ランニングで体力維持',
          content: `平均${avgDist.toFixed(1)}km/回・週${runFreqWeekly}回ペース（合計${totalDistance.toFixed(1)}km）。週2-3回・30分程度で心肺機能を維持。` });
      } else {
        advices.push({ icon: '🏃',
          title: avgDist < 3 ? 'ランニング距離を伸ばそう' : 'ランニングは順調',
          content: avgDist < 3
            ? `平均${avgDist.toFixed(1)}km/回・週${runFreqWeekly}回ペース。3-5km・週2-3回を目標に。1回30分以内で筋肉分解を防ぐ。`
            : `平均${avgDist.toFixed(1)}km/回・週${runFreqWeekly}回ペース（合計${totalDistance.toFixed(1)}km）。筋トレ後に走ると脂肪燃焼効果高。ただし、1回30分以内で。`,
        });
      }
    }

    // Weight progress advice (goal-mode aware)
    const weights = Object.values(bodyLogs)
      .filter((b) => b.weight)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (weights.length >= 2) {
      const first = weights[0].weight!;
      const latest = weights[weights.length - 1].weight!;
      const change = latest - first;
      const target = settings.targetWeight;
      const remaining = target - latest;
      
      if (goalMode === 'bulk') {
        if (change > 0 && remaining > 0) {
          advices.push({ icon: '📊', title: '体重増加傾向 — 順調',
            content: `${first}kg→${latest}kg（+${change.toFixed(1)}kg）。目標${target}kgまであと${remaining.toFixed(1)}kg。理想ペースは月0.5-1kg。` });
        } else if (change <= 0) {
          advices.push({ icon: '📊', title: '体重減少傾向 — カロリーを増やそう',
            content: `${first}kg→${latest}kg（${change.toFixed(1)}kg）。基礎代謝+300-500kcal、特にトレ後30分以内にタンパク質20-30g。` });
        }
      } else if (goalMode === 'cut') {
        if (change < 0) {
          advices.push({ icon: '📊', title: '体重減少傾向 — 順調',
            content: `${first}kg→${latest}kg（${change.toFixed(1)}kg）。${target < latest ? `目標${target}kgまであと${(latest - target).toFixed(1)}kg。` : ''}筋トレの重量を落とさないことが重要。` });
        } else {
          advices.push({ icon: '📊', title: '体重増加傾向 — カロリーを見直そう',
            content: `${first}kg→${latest}kg（+${change.toFixed(1)}kg）。基礎代謝-300-500kcalを目安に。食事記録で隠れカロリーを見つけよう。` });
        }
      } else {
        const absChange = Math.abs(change);
        advices.push({ icon: '📊',
          title: absChange <= 1 ? '体重安定' : `体重${change > 0 ? '増加' : '減少'}傾向`,
          content: absChange <= 1
            ? `${first}kg→${latest}kg（${change >= 0 ? '+' : ''}${change.toFixed(1)}kg）。変動1kg以内で安定。この調子を維持。`
            : `${first}kg→${latest}kg（${change >= 0 ? '+' : ''}${change.toFixed(1)}kg）。維持目標は±1kg以内。${change > 0 ? '有酸素を少し増やすか、食事量を減らす。' : '摂取カロリーを少し増やす。'}`,
        });
      }
    }

    return advices;
  };

  const advices = getAdvice();

  return (
    <div className="card-neu p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
        AIからのアドバイス
      </h3>
      <div className="space-y-4">
        {advices.map((advice, i) => (
          <div key={i} className={`bg-white/60 rounded-xl p-4 border ${i === 0 ? 'border-sunrise-orange/40 bg-sunrise-orange/5' : 'border-border/50'}`}>
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

// Weight Trend Chart Component
function WeightTrendChart() {
  const trendData = getWeightTrendData(30);
  const settings = getSettings();
  const validData = trendData.filter((d) => d.weight !== null);

  // 目標体重も含めてグラフ範囲を計算（目標線が常に見えるように）
  const targetW = settings.targetWeight;
  const dataWeights = validData.map((d) => d.weight as number);
  const allWeightsForRange = targetW > 0 ? [...dataWeights, targetW] : dataWeights;
  const minWeight = allWeightsForRange.length > 0
    ? Math.min(...allWeightsForRange) - 0.5
    : 60;
  const maxWeight = allWeightsForRange.length > 0
    ? Math.max(...allWeightsForRange) + 0.5
    : 80;
  const range = maxWeight - minWeight || 1;

  // Show only every 5th label to avoid crowding
  const visibleData = trendData.filter((_, i) => i % 5 === 0 || i === trendData.length - 1);

  const getY = (weight: number) => {
    return 100 - ((weight - minWeight) / range) * 100;
  };

  // Build SVG polyline points
  const points = validData
    .map((d, i) => {
      const allIdx = trendData.findIndex((t) => t.date === d.date);
      const x = (allIdx / (trendData.length - 1)) * 100;
      const y = getY(d.weight as number);
      return `${x},${y}`;
    })
    .join(' ');

  const latestWeight = validData.length > 0 ? validData[validData.length - 1].weight : null;
  const firstWeight = validData.length > 0 ? validData[0].weight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  return (
    <div className="card-neu p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">体重推移</h3>
        <span className="text-xs text-foreground/50">過去30日間</span>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <span className="text-lg font-bold font-display text-foreground">
            {latestWeight ? `${latestWeight}kg` : '--'}
          </span>
          <span className="text-xs text-foreground/60 ml-1">現在</span>
        </div>
        {weightChange !== null && (
          <div className={`text-sm font-bold ${
            weightChange > 0 ? 'text-sunrise-orange' : weightChange < 0 ? 'text-blue-500' : 'text-foreground/60'
          }`}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
            <span className="text-xs font-normal text-foreground/50 ml-1">30日間</span>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-xs text-foreground/50">目標: </span>
          <span className="text-xs font-bold text-sunrise-orange">{settings.targetWeight}kg</span>
        </div>
      </div>

      {validData.length < 2 ? (
        <div className="h-28 flex items-center justify-center">
          <p className="text-sm text-foreground/50 text-center">
            体重を2日以上記録するとグラフが表示されます
          </p>
        </div>
      ) : (
        <div className="relative h-28">
          {/* Target weight line - 常に表示（グラフ範囲に目標を含めているので必ず見える） */}
          {settings.targetWeight > 0 && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-sunrise-orange/50 z-10"
              style={{ top: `${Math.max(0, Math.min(100, getY(settings.targetWeight)))}%` }}
            >
              <span className="absolute right-0 -top-4 text-[9px] text-sunrise-orange font-bold bg-background/80 px-1 rounded">
                目標{settings.targetWeight}kg
              </span>
            </div>
          )}

          {/* SVG chart */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Area fill */}
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8734A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#E8734A" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {validData.length >= 2 && (
              <polygon
                points={`${points} ${(trendData.findIndex((t) => t.date === validData[validData.length - 1].date) / (trendData.length - 1)) * 100},100 ${(trendData.findIndex((t) => t.date === validData[0].date) / (trendData.length - 1)) * 100},100`}
                fill="url(#weightGrad)"
              />
            )}
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#E8734A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {validData.map((d, i) => {
              const allIdx = trendData.findIndex((t) => t.date === d.date);
              const x = (allIdx / (trendData.length - 1)) * 100;
              const y = getY(d.weight as number);
              const isLatest = i === validData.length - 1;
              return (
                <circle
                  key={d.date}
                  cx={x}
                  cy={y}
                  r={isLatest ? 2.5 : 1.5}
                  fill={isLatest ? '#E8734A' : '#E8734A'}
                  opacity={isLatest ? 1 : 0.6}
                />
              );
            })}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            <span className="text-[9px] text-foreground/40">{maxWeight.toFixed(1)}</span>
            <span className="text-[9px] text-foreground/40">{((maxWeight + minWeight) / 2).toFixed(1)}</span>
            <span className="text-[9px] text-foreground/40">{minWeight.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* X-axis labels */}
      {validData.length >= 2 && (
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-foreground/40">{trendData[0].label}</span>
          <span className="text-[9px] text-foreground/40">{trendData[Math.floor(trendData.length / 2)].label}</span>
          <span className="text-[9px] text-foreground/40">{trendData[trendData.length - 1].label}</span>
        </div>
      )}
    </div>
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

// Body Photo Gallery Component - Album-style with newest first
// IndexedDBから写真を非同期で取得して表示する
function BodyPhotoGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [photos, setPhotos] = useState<{ date: string; photo: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);

  // IndexedDBから全写真を非同期で読み込み、最新順にソート
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setIsLoading(true);
        const allPhotos = await getAllPhotos();
        // 最新の写真が先に来るように降順ソート
        allPhotos.sort((a, b) => b.date.localeCompare(a.date));
        setPhotos(allPhotos);
      } catch (err) {
        console.error('[BodyPhotoGallery] 写真読み込みエラー:', err);
        toast.error('写真の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    loadPhotos();
  }, []);

  // Scroll to selected photo when opening viewer
  useEffect(() => {
    if (selectedIndex !== null && viewerRef.current) {
      const container = viewerRef.current;
      const targetScroll = selectedIndex * container.clientWidth;
      container.scrollTo({ left: targetScroll, behavior: 'instant' });
    }
  }, [selectedIndex]);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="card-neu p-5">
        <h3 className="text-sm font-semibold mb-2 text-foreground">ボディフォトギャラリー</h3>
        <p className="text-sm text-foreground/60 text-center py-6">
          写真を読み込み中...
        </p>
      </div>
    );
  }

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

  // 月ごとに写真をグループ化（アルバム表示用）
  const groupedByMonth: { label: string; items: { date: string; photo: string; globalIdx: number }[] }[] = [];
  photos.forEach((p, idx) => {
    const d = parseDate(p.date);
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = groupedByMonth[groupedByMonth.length - 1];
    if (last && last.label === label) {
      last.items.push({ ...p, globalIdx: idx });
    } else {
      groupedByMonth.push({ label, items: [{ ...p, globalIdx: idx }] });
    }
  });

  return (
    <>
      {/* カード表示（タップでアルバムを開く） */}
      <button
        onClick={() => setShowAlbum(true)}
        className="card-neu p-5 w-full text-left tap-active"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">ボディフォトギャラリー</h3>
            <p className="text-xs text-foreground/60">{photos.length}枚の記録</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-sunrise-orange font-medium">
            <ZoomIn size={14} />
            アルバムを見る
          </div>
        </div>
        {/* プレビュー（最新数枚） */}
        <div className="flex gap-2 overflow-hidden">
          {photos.slice(0, 5).map((p) => {
            const d = parseDate(p.date);
            return (
              <div key={p.date} className="shrink-0 w-16 h-20 rounded-lg overflow-hidden relative">
                <img src={p.photo} alt={p.date} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                  {d.getMonth() + 1}/{d.getDate()}
                </div>
              </div>
            );
          })}
          {photos.length > 5 && (
            <div className="shrink-0 w-16 h-20 rounded-lg bg-muted/60 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground/50">+{photos.length - 5}</span>
            </div>
          )}
        </div>
      </button>

      {/* アルバムモーダル（フルスクリーングリッド表示） */}
      <AnimatePresence>
        {showAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">ボディフォトアルバム</h2>
                <p className="text-xs text-foreground/50">{photos.length}枚の記録</p>
              </div>
              <button
                onClick={() => setShowAlbum(false)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-active"
              >
                <X size={20} className="text-foreground" />
              </button>
            </div>

            {/* 月別グリッド */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {groupedByMonth.map((group) => (
                <div key={group.label} className="mt-4">
                  <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">{group.label}</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.items.map((item) => {
                      const d = parseDate(item.date);
                      return (
                        <button
                          key={item.date}
                          onClick={() => {
                            setSelectedIndex(item.globalIdx);
                          }}
                          className="aspect-square rounded-lg overflow-hidden relative tap-active"
                        >
                          <img src={item.photo} alt={item.date} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] text-center py-1">
                            {d.getMonth() + 1}/{d.getDate()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全画面ビューアー（写真タップ時） */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
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
              {photos.map((p) => {
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

            {/* Dot indicators - only show for small sets */}
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
    </>
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

// Main Review Page - Order: AI, Streak, Weekly Challenge, Muscle Heatmap, Running, Weight, Sleep, Comprehensive Analysis, Body Photo Gallery
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
      <WeightTrendChart />
      <SleepChart />
      <ComprehensiveAnalysis />
      <BodyPhotoGallery />
    </div>
  );
}
