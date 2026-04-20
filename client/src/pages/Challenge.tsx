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

function formatDateLabel(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const day = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${day}）`;
}

function isNumber(value: number | null): value is number {
  return typeof value === 'number';
}

function getRecordAverage(record: LimitChallengeRecord) {
  const values = Object.values(record.scores).filter(isNumber);
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
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

function AxisSummaryCard({
  label,
  emoji,
  average,
  best,
  breakthroughs,
}: {
  label: string;
  emoji: string;
  average: number | null;
  best: number | null;
  breakthroughs: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-foreground/50">100点以上で限界突破</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sunrise-orange/10 text-xl">
          {emoji}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/40 px-2 py-2">
          <p className="text-[10px] text-foreground/50">平均</p>
          <p className="text-sm font-bold text-foreground">{average !== null ? average.toFixed(1) : '--'}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2 py-2">
          <p className="text-[10px] text-foreground/50">最高</p>
          <p className="text-sm font-bold text-sunrise-orange">{best !== null ? `${best}点` : '--'}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2 py-2">
          <p className="text-[10px] text-foreground/50">突破回数</p>
          <p className="text-sm font-bold text-foreground">{breakthroughs}</p>
        </div>
      </div>
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
    []
  );

  const periodSummaries = useMemo(
    () => [
      { label: '直近7日', ...buildPeriodSummary(records, 7) },
      { label: '直近30日', ...buildPeriodSummary(records, 30) },
      { label: '全期間', ...buildPeriodSummary(records, null) },
    ],
    [records]
  );

  const axisSummaries = useMemo(
    () =>
      LIMIT_CHALLENGE_AXES.map((axis) => {
        const values = records.map((record) => record.scores[axis.key]).filter(isNumber);
        const average = values.length > 0
          ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
          : null;
        const best = values.length > 0 ? Math.max(...values) : null;
        const breakthroughs = values.filter((value) => value >= 100).length;

        return {
          ...axis,
          average,
          best,
          breakthroughs,
        };
      }),
    [records]
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
    <div className="px-4 pt-12 pb-4 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">限界チャレンジ</h1>
        <p className="text-sm text-foreground/60 mt-0.5">5軸で自分の限界を可視化する記録</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-neu p-5 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-sunrise-orange uppercase">Daily Limit</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">100点以上の軸が、その日の限界突破</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">
              学習・長期目標行動・人間関係・仕事・健康の5軸を毎日10点刻みで採点します。
            </p>
          </div>
          <div className="hidden min-w-[92px] rounded-2xl bg-sunrise-orange/10 px-4 py-3 text-center sm:block">
            <p className="text-[10px] text-foreground/50">累計突破軸</p>
            <p className="text-2xl font-bold font-display text-sunrise-orange">{totalBreakthroughs}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-sunrise-orange/20 bg-sunrise-orange/8 p-3">
            <p className="text-[10px] text-foreground/50">記録日数</p>
            <p className="mt-1 text-2xl font-bold font-display text-foreground">{records.length}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">突破した日</p>
            <p className="mt-1 text-2xl font-bold font-display text-foreground">{breakthroughDays}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">累計突破軸</p>
            <p className="mt-1 text-2xl font-bold font-display text-sunrise-orange">{totalBreakthroughs}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/70 p-3">
            <p className="text-[10px] text-foreground/50">平均突破軸</p>
            <p className="mt-1 text-2xl font-bold font-display text-foreground">
              {records.length > 0 ? (totalBreakthroughs / records.length).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/35 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">今日の記録はホームからすぐ入力できます</p>
            <p className="text-xs text-foreground/55">入力後はここで日別履歴と軸別の傾向を見返せます。</p>
          </div>
          <Button
            onClick={() => setLocation('/')}
            className="bg-sunrise-orange hover:bg-sunrise-orange/90 text-white rounded-xl"
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
                <p className="text-lg font-bold font-display text-foreground">{summary.recordDays}</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-[10px] text-foreground/50">突破日</p>
                <p className="text-lg font-bold font-display text-foreground">{summary.breakthroughDays}</p>
              </div>
              <div className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-[10px] text-foreground/50">突破軸</p>
                <p className="text-lg font-bold font-display text-sunrise-orange">{summary.totalBreakthroughs}</p>
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
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={17} className="text-sunrise-orange" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">軸別サマリー</h3>
            <p className="text-xs text-foreground/50">どの軸で限界突破しやすいかを一覧で確認</p>
          </div>
        </div>
        <div className="space-y-3">
          {axisSummaries.map((axis) => (
            <AxisSummaryCard
              key={axis.key}
              label={axis.label}
              emoji={axis.emoji}
              average={axis.average}
              best={axis.best}
              breakthroughs={axis.breakthroughs}
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
          <div className="flex items-center gap-2 mb-3">
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
                <p className="text-xs text-foreground/55 mt-1">
                  {countLimitBreakthroughs(highlight)}/5軸で限界突破
                  {getRecordAverage(highlight) !== null && ` ・ 平均 ${getRecordAverage(highlight)?.toFixed(1)}点`}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] text-foreground/50">突破軸</p>
                <p className="text-xl font-bold font-display text-sunrise-orange">{countLimitBreakthroughs(highlight)}</p>
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
        <div className="flex items-center gap-2 mb-4">
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
                      <div className="shrink-0 rounded-2xl px-3 py-2 text-center shadow-sm border border-sunrise-orange/25 bg-sunrise-orange/10">
                        <p className="text-[10px] text-foreground/55">突破軸</p>
                        <p className="text-lg font-bold font-display text-sunrise-orange">{breakthroughCount}</p>
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
                    {record.comment.trim() && (
                      <div className="mt-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/45">Comment</p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/75">{record.comment}</p>
                      </div>
                    )}
                    {!record.comment.trim() && (
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
