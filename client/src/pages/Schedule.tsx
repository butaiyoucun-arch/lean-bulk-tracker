/**
 * Schedule Page - Weekly training menu management
 * Features: Training/Running/Rest day selection, muscle group selection, past day editing
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getWeekDates,
  getScheduleDay,
  saveScheduleDay,
  getToday,
  formatDate,
  parseDate,
  saveRunningRecord,
  getRunningRecord,
  saveTrainingRecord,
  getTrainingRecord,
  addMuscleCount,
} from '@/lib/store';
import { MUSCLE_GROUPS, DAY_NAMES, type MuscleGroup, type ScheduleDay } from '@/lib/types';

export default function Schedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleDay>>({});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [runningDistance, setRunningDistance] = useState('');
  const today = getToday();

  useEffect(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const dates = getWeekDates(formatDate(base));
    setWeekDates(dates);
    
    const sched: Record<string, ScheduleDay> = {};
    dates.forEach((d) => {
      sched[d] = getScheduleDay(d);
    });
    setSchedules(sched);
  }, [weekOffset]);

  const toggleDayType = (date: string, type: 'training' | 'running' | 'rest') => {
    const current = { ...schedules[date] };
    
    if (type === 'rest') {
      current.dayType = 'rest';
      current.trainingMuscles = [];
      current.hasRunning = false;
    } else if (type === 'training') {
      if (current.dayType === 'training' || current.dayType === 'training+running') {
        // Toggle off training
        current.dayType = current.hasRunning ? 'running' as any : 'rest';
        current.trainingMuscles = [];
      } else {
        // Toggle on training
        current.dayType = current.hasRunning ? 'training+running' : 'training';
      }
    } else if (type === 'running') {
      if (current.hasRunning) {
        // Toggle off running
        current.hasRunning = false;
        current.dayType = current.trainingMuscles.length > 0 ? 'training' : 'rest';
      } else {
        // Toggle on running
        current.hasRunning = true;
        current.dayType = current.trainingMuscles.length > 0 ? 'training+running' : 'running' as any;
      }
    }
    
    saveScheduleDay(current);
    setSchedules((prev) => ({ ...prev, [date]: current }));
  };

  const toggleMuscle = (date: string, muscle: MuscleGroup) => {
    const current = { ...schedules[date] };
    const idx = current.trainingMuscles.indexOf(muscle);
    if (idx >= 0) {
      current.trainingMuscles = current.trainingMuscles.filter((m) => m !== muscle);
    } else {
      current.trainingMuscles = [...current.trainingMuscles, muscle];
    }
    
    if (current.trainingMuscles.length > 0) {
      current.dayType = current.hasRunning ? 'training+running' : 'training';
    } else {
      current.dayType = current.hasRunning ? 'running' as any : 'rest';
    }
    
    saveScheduleDay(current);
    setSchedules((prev) => ({ ...prev, [date]: current }));
  };

  const handleCompleteTraining = (date: string) => {
    const s = schedules[date];
    if (s.trainingMuscles.length > 0) {
      saveTrainingRecord({
        date,
        muscleGroups: s.trainingMuscles,
        notes: '',
        completed: true,
      });
      addMuscleCount(s.trainingMuscles);
      toast.success('筋トレを記録しました！');
    }
  };

  const handleSaveRunning = (date: string) => {
    const dist = parseFloat(runningDistance);
    if (isNaN(dist) || dist <= 0) {
      toast.error('正しい距離を入力してください');
      return;
    }
    saveRunningRecord({ date, distance: dist, duration: null });
    setEditingDay(null);
    setRunningDistance('');
    toast.success('ランニングを記録しました！');
  };

  const getWeekLabel = () => {
    if (weekDates.length === 0) return '';
    const start = parseDate(weekDates[0]);
    const end = parseDate(weekDates[6]);
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const getSummary = (s: ScheduleDay) => {
    const parts: string[] = [];
    if (s.trainingMuscles.length > 0) parts.push(s.trainingMuscles.join('・'));
    if (s.hasRunning) parts.push('ランニング');
    if (parts.length === 0 && s.dayType === 'rest') return '休み';
    return parts.join(' + ');
  };

  const isTrainingActive = (s: ScheduleDay) => 
    s.dayType === 'training' || s.dayType === 'training+running' || s.trainingMuscles.length > 0;
  
  const isRunningActive = (s: ScheduleDay) => s.hasRunning;
  const isRestDay = (s: ScheduleDay) => s.dayType === 'rest' && !s.hasRunning && s.trainingMuscles.length === 0;

  return (
    <div className="px-4 pt-12 pb-4 space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">スケジュール</h1>
        <p className="text-sm text-muted-foreground mt-0.5">週間トレーニングメニュー</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between card-neu px-4 py-3">
        <button onClick={() => setWeekOffset((p) => p - 1)} className="tap-active p-1">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium">{getWeekLabel()}</span>
        <button onClick={() => setWeekOffset((p) => p + 1)} className="tap-active p-1">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day Cards */}
      <div className="space-y-3">
        {weekDates.map((date, i) => {
          const s = schedules[date] || { date, dayType: 'rest', trainingMuscles: [], hasRunning: false };
          const d = parseDate(date);
          const dayIdx = d.getDay();
          const dayLabel = DAY_NAMES[dayIdx];
          const isToday = date === today;
          const isPast = date < today;
          const existingRunning = getRunningRecord(date);
          const existingTraining = getTrainingRecord(date);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card-neu p-4 ${isToday ? 'ring-2 ring-sunrise-indigo' : ''}`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isToday ? 'bg-sunrise-indigo text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {dayLabel}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {d.getMonth() + 1}/{d.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-sunrise-green/20 text-sunrise-green px-2 py-0.5 rounded-full font-medium">
                      今日
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground max-w-[160px] text-right truncate">
                  {getSummary(s)}
                </span>
              </div>

              {/* Type buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => toggleDayType(date, 'training')}
                  className={`rounded-xl py-2.5 px-2 text-sm font-medium transition-all tap-active flex items-center justify-center gap-1 ${
                    isTrainingActive(s)
                      ? 'bg-sunrise-indigo/15 text-sunrise-indigo border-2 border-sunrise-indigo/30'
                      : 'bg-muted/50 text-muted-foreground border-2 border-transparent'
                  }`}
                >
                  💪 筋トレ
                </button>
                <button
                  onClick={() => toggleDayType(date, 'running')}
                  className={`rounded-xl py-2.5 px-2 text-sm font-medium transition-all tap-active flex items-center justify-center gap-1 ${
                    isRunningActive(s)
                      ? 'bg-sunrise-green/15 text-sunrise-green border-2 border-sunrise-green/30'
                      : 'bg-muted/50 text-muted-foreground border-2 border-transparent'
                  }`}
                >
                  🏃 ランニング
                </button>
                <button
                  onClick={() => toggleDayType(date, 'rest')}
                  className={`rounded-xl py-2.5 px-2 text-sm font-medium transition-all tap-active flex items-center justify-center gap-1 ${
                    isRestDay(s)
                      ? 'bg-sunrise-warm-yellow/30 text-sunrise-orange border-2 border-sunrise-orange/30'
                      : 'bg-muted/50 text-muted-foreground border-2 border-transparent'
                  }`}
                >
                  😴 休養日
                </button>
              </div>

              {/* Rest day message */}
              {isRestDay(s) && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  😴 休養日
                </div>
              )}

              {/* Muscle group selection */}
              {isTrainingActive(s) && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-2">部位を選択:</p>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_GROUPS.map((muscle) => (
                      <button
                        key={muscle}
                        onClick={() => toggleMuscle(date, muscle)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all tap-active ${
                          s.trainingMuscles.includes(muscle)
                            ? 'bg-sunrise-indigo text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons for past/today */}
              {(isToday || isPast) && (isTrainingActive(s) || isRunningActive(s)) && (
                <div className="flex gap-2 mt-3">
                  {isTrainingActive(s) && !existingTraining?.completed && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteTraining(date)}
                      className="bg-sunrise-indigo hover:bg-sunrise-indigo/90 text-white text-xs flex-1"
                    >
                      筋トレ完了
                    </Button>
                  )}
                  {isTrainingActive(s) && existingTraining?.completed && (
                    <div className="text-xs text-sunrise-green flex items-center gap-1 flex-1 justify-center">
                      ✓ 筋トレ記録済み
                    </div>
                  )}
                  {isRunningActive(s) && !existingRunning && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingDay(date);
                        setRunningDistance('');
                      }}
                      className="text-xs flex-1 border-sunrise-green/30 text-sunrise-green"
                    >
                      ランニング記録
                    </Button>
                  )}
                  {isRunningActive(s) && existingRunning && (
                    <div className="text-xs text-sunrise-green flex items-center gap-1 flex-1 justify-center">
                      ✓ {existingRunning.distance}km 記録済み
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Running Distance Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>ランニング距離を記録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="5.0"
                value={runningDistance}
                onChange={(e) => setRunningDistance(e.target.value)}
                className="text-2xl font-bold text-center h-14"
                autoFocus
              />
              <span className="text-lg text-muted-foreground">km</span>
            </div>
            <Button
              onClick={() => editingDay && handleSaveRunning(editingDay)}
              className="w-full bg-sunrise-green hover:bg-sunrise-green/90 text-white"
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
