import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarRange, Flame, Target, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  countLimitBreakthroughs,
  getAllLimitChallengeRecords,
  hasLimitChallengeInput,
} from '@/lib/store';
import {
  LIMIT_CHALLENGE_AXES,
  type LimitChallengeAxisKey,
  type LimitChallengeRecord,
} from '@/lib/types';

type TrendMode = 'daily' | 'monthly';

type TrendPoint = {
  label: string;
  shortLabel: string;
  value: number;
};

function formatDateLabel(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${day}）`;
}

function formatMonthLabel(monthKey: string) {
  const [, month] = monthKey.split('-');
  return `${Number(month)}月`;
}

function isNumber(value: number | null): value is number {
  return typeof value === 'number';
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function getRecordAverage(record: LimitChallengeRecord) {
  const values = Object.values(record.scores).filter(isNumber);
  if (values.length === 0) return null;
  return roundToOneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getScoreTone(score: number | null) {
  if (score === null) return 'bg-muted text-foreground/45 border-border/50';
  if (score >= 100) return 'bg-sunrise-orange text-white border-sunrise-orange';
  if (score >= 80) return 'bg-sunrise-warm-yellow/35 text-foreground border-sunrise-warm-yellow/60';
  if (score >= 60) return 'bg-sunrise-green/15 text-sunrise-green border-sunrise-green/30';
  return 'bg-muted/60 text-foreground/70 border-border/60';
}

function buildPeriodSummary(records: LimitChallengeRecord[], days: number | null) {
  const filtered = days === null
    ? records
    : records.filter((record) => {
        const diff = Math.floor((Date.now() - new Date(`${record.date}T00:00:00`).getTime()) / 86400000);
        return diff >= 0 && diff < days;
      });

  const totalBreakthroughs = filtered.reduce((sum, record) => sum + countLimitBreakthroughs(record), 0);
  const breakthroughDays = filtered.filter((record) => countLimitBreakthroughs(record) > 0).length;

  return {
    recordDays: filtered.length,
    totalBreakthroughs,
    breakthroughDays,
  };
}

function getMonthlyKeys(records: LimitChallengeRecord[]) {
  return Array.from(new Set(records.map((record) => record.date.slice(0, 7))));
}

function getVisibleDailyRecords(records: LimitChallengeRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 29);

  const recent = records.filter((record) => new Date(`${record.date}T00:00:00`) >= cutoff);
  return recent.length > 0 ? recent : records.slice(-30);
}

function buildAxisTrendPoints(
  records: LimitChallengeRecord[],
  axisKey: LimitChallengeAxisKey,
  mode: TrendMode,
): TrendPoint[] {
  if (mode === 'monthly') {
    const monthMap = new Map<string, number[]>();

    records.forEach((record) => {
      const score = record.scores[axisKey];
      if (!isNumber(score)) return;
      const monthKey = record.date.slice(0, 7);
      const current = monthMap.get(monthKey) ?? [];
      current.push(score);
      monthMap.set(monthKey, current);
    });

    return Array.from(monthMap.entries())
      .slice(-6)
      .map(([monthKey, values]) => ({
        label: monthKey,
        shortLabel: formatMonthLabel(monthKey),
        value: roundToOneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length),
      }));
  }

  return getVisibleDailyRecords(records).flatMap((record) => {
    const score = record.scores[axisKey];
    return isNumber(score)
      ? [{ label: formatFullDate(record.date), shortLabel: formatDateLabel(record.date), value: score }]
      : [];
  });
}

function AxisTrendCard({
  axisKey,
  label,
  emoji,
  points,
  mode,
}: {
  axisKey: LimitChallengeAxisKey;
  label: string;
  emoji: string;
  points: TrendPoint[];
  mode: TrendMode;
}) {
  const current = points.length > 0 ? points[points.length - 1].value : null;
  const average = points.length > 0
    ? roundToOneDecimal(points.reduce((sum, point) => sum + point.value, 0) / points.length)
    : null;
  const best = points.length > 0 ? Math.max(...points.map((point) => point.value)) : null;
  const breakthroughs = points.filter((point) => point.value >= 100).length;

  const chartTop = 8;
  const chartBottom = 60;
  const chartHeight = chartBottom - chartTop;
  const getY = (value: number) => chartBottom - (value / 110) * chartHeight;

  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: getY(point.value),
  }));

  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = coordinates.length >= 2
    ? `${coordinates[0].x},${chartBottom} ${linePoints} ${coordinates[coordinates.length - 1].x},${chartBottom}`
    : '';

  const firstLabel = points[0]?.shortLabel ?? '--';
  const middleLabel = points[Math.floor((points.length - 1) / 2)]?.shortLabel ?? '--';
  const lastLabel = points[points.length - 1]?.shortLabel ?? '--';
  const chartGradientId = `limit-axis-${axisKey}-gradient`;

  return (
    <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{emoji}</span>
            <p className="text-sm font-semibold text-foreground">{label}</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-foreground/55">
            {mode === 'daily'
              ? 'まずは直近30日の日次推移を表示。3か月以上たまると月平均推移へ切り替わります。'
              : '記録がたまったため、各月平均の推移で変化を見やすくしています。'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-sunrise-orange/25 bg-sunrise-orange/10 px-2.5 py-1 text-[11px] font-semibold text-sunrise-orange">
          {mode === 'daily' ? '直近30日' : '月平均推移'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-muted/35 px-3 py-2">
          <p className="text-[10px] text-foreground/50">{mode === 'daily' ? '最新' : '最新月平均'}</p>
          <p className="text-sm font-bold text-foreground">{current !== null ? `${current.toFixed(1)}点` : '--'}</p>
        </div>
        <div className="rounded-xl bg-muted/35 px-3 py-2">
          <p className="text-[10px] text-foreground/50">平均</p>
          <p className="text-sm font-bold text-foreground">{average !== null ? `${average.toFixed(1)}点` : '--'}</p>
        </div>
        <div className="rounded-xl bg-muted/35 px-3 py-2">
          <p className="text-[10px] text-foreground/50">最高</p>
          <p className="text-sm font-bold text-sunrise-orange">{best !== null ? `${best.toFixed(1)}点` : '--'}</p>
        </div>
        <div className="rounded-xl bg-muted/35 px-3 py-2">
          <p className="text-[10px] text-foreground/50">{mode === 'daily' ? '100点日' : '100点月'}</p>
          <p className="text-sm font-bold text-foreground">{breakthroughs}</p>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-muted/25 px-4 py-6 text-center text-sm text-foreground/55">
          まだグラフ化できる記録がありません
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-muted/20 p-3">
          <div className="relative h-28">
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 border-t border-dashed border-sunrise-orange/50"
              style={{ top: `${getY(100)}px` }}
            >
              <span className="absolute right-0 -top-4 rounded bg-background/80 px-1 text-[9px] font-semibold text-sunrise-orange">
                100点ライン
              </span>
            </div>
            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-border/40"
              style={{ top: `${getY(50)}px` }}
            />
            <svg viewBox="0 0 100 68" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8734A" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#E8734A" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {coordinates.length >= 2 && (
                <polygon points={areaPoints} fill={`url(#${chartGradientId})`} />
              )}

              {coordinates.length >= 2 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#E8734A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {coordinates.map((point, index) => {
                const isLatest = index === coordinates.length - 1;
                const isBreakthrough = point.value >= 100;
                return (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={isLatest ? 2.9 : 2.1}
                    fill={isBreakthrough ? '#E8734A' : '#7C6F64'}
                    opacity={isLatest ? 1 : 0.85}
                  />
                );
              })}
            </svg>

            <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between">
              <span className="text-[9px] text-foreground/40">110</span>
              <span className="text-[9px] text-sunrise-orange/80">100</span>
              <span className="text-[9px] text-foreground/40">50</span>
              <span className="text-[9px] text-foreground/40">0</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-foreground/40">
            <span>{firstLabel}</span>
            <span>{middleLabel}</span>
            <span>{lastLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Challenge() {
  const [, setLocation] = useLocation();

  const records = useMemo(
    () =>
      Object.values(getAllLimitChallengeRecords())
        .filter((record) => hasLimitChallengeInput(record))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const recordsAsc = useMemo(() => [...records].sort((a, b) => a.date.localeCompare(b.date)), [records]);
  const recordedMonths = useMemo(() => getMonthlyKeys(recordsAsc), [recordsAsc]);
  const axisTrendMode: TrendMode = recordedMonths.length >= 3 ? 'monthly' : 'daily';
  const axisLabelsText = LIMIT_CHALLENGE_AXES.map((axis) => axis.label).join('・');

  const periodSummaries = useMemo(
    () => [
      { label: '直近7日', ...buildPeriodSummary(records, 7) },
      { label: '直近30日', ...buildPeriodSummary(records, 30) },
      { label: '全期間', ...buildPeriodSummary(records, null) },
    ],
    [records],
  );

  const axisSummaries = useMemo(
    () =>
      LIMIT_CHALLENGE_AXES.map((axis) => ({
        ...axis,
        points: buildAxisTrendPoints(recordsAsc, axis.key, axisTrendMode),
      })),
    [axisTrendMode, recordsAsc],
  );

  const highlight = useMemo(() => {
    if (records.length === 0) return null;

    return records.reduce((best, current) => {
      const currentBreakthroughs = countLimitBreakthroughs(current);
      const bestBreakthroughs = countLimitBreakthroughs(best);
      const currentAverage = getRecordAverage(current) ?? -1;
      const bestAverage = getRecordAverage(best) ?? -1;

      if (currentBreakthroughs > bestBreakthroughs) return current;
      if (currentBreakthroughs < bestBreakthroughs) return best;
      if (currentAverage > bestAverage) return current;
      return best;
    });
  }, [records]);

  const totalBreakthroughs = records.reduce((sum, record) => sum + countLimitBreakthroughs(record), 0);
  const breakthroughDays = records.filter((record) => countLimitBreakthroughs(record) > 0).length;

  return (
    <div className="space-y-4 px-4 pb-4 pt-12">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">限界チャレンジ</h1>
        <p className="mt-0.5 text-sm text-foreground/60">5軸で自分の限界を可視化する記録</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-neu overflow-hidden p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sunrise-orange">Daily Limit</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">100点以上の軸が、その日の限界突破</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">
              {axisLabelsText}の5軸を毎日10点刻みで採点します。
            </p>
          </div>
          <div className="hidden min-w-[92px] rounded-2xl bg-sunrise-orange/10 px-4 py-3 text-center sm:block">
            <p className="text-[10px] text-foreground/50">累計突破軸</p>
            <p className="font-display text-2xl font-bold text-sunrise-orange">{totalBreakthroughs}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-sunrise-orange/20 bg-sunrise-orange/8 p-3">
            <p className="text-[10px] text-foreground/50">記録日数</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{records.length}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">突破した日</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{breakthroughDays}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">累計突破軸</p>
            <p className="mt-1 font-display text-2xl font-bold text-sunrise-orange">{totalBreakthroughs}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">平均突破軸</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {records.length > 0 ? (totalBreakthroughs / records.length).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/35 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">今日の記録はホームからすぐ入力できます</p>
            <p className="text-xs text-foreground/55">入力後はここで日別履歴と軸ごとの傾向を見返せます。</p>
          </div>
          <Button
            onClick={() => setLocation('/')}
            className="rounded-xl bg-sunrise-orange text-white hover:bg-sunrise-orange/90"
          >
            今日を記録する
            <ArrowRight size={15} className="ml-1" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {periodSummaries.map((summary) => (
          <div key={summary.label} className="card-neu p-4">
            <div className="flex items-center gap-2">
              <CalendarRange size={16} className="text-sunrise-orange" />
              <p className="text-sm font-semibold text-foreground">{summary.label}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-[10px] text-foreground/50">記録日</p>
                <p className="font-display text-lg font-bold text-foreground">{summary.recordDays}</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-[10px] text-foreground/50">突破日</p>
                <p className="font-display text-lg font-bold text-foreground">{summary.breakthroughDays}</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-[10px] text-foreground/50">突破軸</p>
                <p className="font-display text-lg font-bold text-sunrise-orange">{summary.totalBreakthroughs}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-neu p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={17} className="text-sunrise-orange" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">軸別サマリー</h3>
            <p className="text-xs text-foreground/50">
              {axisTrendMode === 'daily'
                ? 'まずは一ヶ月の推移を表示し、3か月以上たまると月平均推移へ切り替わります'
                : '十分に記録がたまったため、一ヶ月ごとの平均推移を表示しています'}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {axisSummaries.map((axis) => (
            <AxisTrendCard
              key={axis.key}
              axisKey={axis.key}
              label={axis.label}
              emoji={axis.emoji}
              points={axis.points}
              mode={axisTrendMode}
            />
          ))}
        </div>
      </motion.div>

      {highlight && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-neu p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <Flame size={17} className="text-sunrise-orange" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">ハイライト</h3>
              <p className="text-xs text-foreground/50">最も限界を超えた日</p>
            </div>
          </div>
          <div className="rounded-2xl border border-sunrise-orange/20 bg-sunrise-orange/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{formatFullDate(highlight.date)}</p>
                <p className="mt-1 text-xs text-foreground/55">
                  {countLimitBreakthroughs(highlight)}/5軸で限界突破
                  {getRecordAverage(highlight) !== null && ` ・ 平均 ${getRecordAverage(highlight)?.toFixed(1)}点`}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] text-foreground/50">突破軸</p>
                <p className="font-display text-xl font-bold text-sunrise-orange">{countLimitBreakthroughs(highlight)}</p>
              </div>
            </div>
            {highlight.comment.trim() && (
              <p className="mt-3 rounded-xl bg-white/85 px-3 py-2 text-sm leading-relaxed text-foreground/75">
                {highlight.comment}
              </p>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-neu p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Target size={17} className="text-sunrise-orange" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">日別履歴</h3>
            <p className="text-xs text-foreground/50">新しい順に、各日の5軸スコアとコメントを確認できます</p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">まだ限界チャレンジの記録がありません</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/55">
              ホームで今日の5軸を採点すると、ここに履歴がたまっていきます。
            </p>
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="mt-4 rounded-xl border-sunrise-orange/40 text-sunrise-orange"
            >
              最初の記録をつける
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {records.map((record) => {
              const breakthroughCount = countLimitBreakthroughs(record);
              const average = getRecordAverage(record);
              return (
                <AccordionItem
                  key={record.date}
                  value={record.date}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-white/70 px-4"
                >
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3 pr-2 text-left">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatFullDate(record.date)}</p>
                        <p className="mt-1 text-xs text-foreground/55">
                          {average !== null ? `平均 ${average.toFixed(1)}点` : '平均 --'}
                          {record.updatedAt && ` ・ 更新 ${new Date(record.updatedAt).toLocaleDateString('ja-JP')}`}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-2xl border border-sunrise-orange/25 bg-sunrise-orange/10 px-3 py-2 text-center shadow-sm">
                        <p className="text-[10px] text-foreground/55">突破軸</p>
                        <p className="font-display text-lg font-bold text-sunrise-orange">{breakthroughCount}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {LIMIT_CHALLENGE_AXES.map((axis) => {
                        const score = record.scores[axis.key as LimitChallengeAxisKey];
                        return (
                          <div key={axis.key} className="rounded-2xl bg-muted/35 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{axis.emoji}</span>
                                <span className="text-sm font-medium text-foreground">{axis.label}</span>
                              </div>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getScoreTone(score)}`}>
                                {score !== null ? `${score}点` : '未入力'}
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-foreground/55">
                              {score !== null && score >= 100 ? '限界突破' : '積み上げ中'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {record.comment.trim() ? (
                      <div className="mt-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/45">Comment</p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/75">{record.comment}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-foreground/45">コメントなし</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </motion.div>
    </div>
  );
}
