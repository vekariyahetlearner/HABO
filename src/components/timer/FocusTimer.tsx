'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Headphones,
  CheckCircle2,
  Clock,
  Sparkles,
  Leaf,
  Music2,
  Radio,
  Upload,
  Sliders,
  X,
} from 'lucide-react';
import {
  sounds,
  focusMusic,
  FocusSoundTrack,
  SOUND_TRACKS,
  FocusCategory,
  SoundTrackDef,
} from '@/lib/audio';
import { HabitData } from '@/lib/streaks/calculator';
import { CustomTrack } from '@/lib/customAudioStorage';
import { CustomAudioUploader } from './CustomAudioUploader';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  habits: HabitData[];
  onLogProgress?: (habitId: string, minutes: number) => void;
}

const TIMER_PRESETS = [
  { label: 'Sprint', minutes: 25, badge: '25m' },
  { label: 'Deep Work', minutes: 50, badge: '50m' },
  { label: 'Short Break', minutes: 5, badge: '5m' },
  { label: 'Long Break', minutes: 15, badge: '15m' },
] as const;

type FilterTab = 'all' | FocusCategory;

export const FocusTimer: React.FC<FocusTimerProps> = ({ habits, onLogProgress }) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSound, setActiveSound] = useState<FocusSoundTrack>('none');
  const [activeCustomTrack, setActiveCustomTrack] = useState<CustomTrack | null>(null);
  const [volume, setVolume] = useState<number>(0.6);
  // Only habits that have selected "Needs Timer" (or explicitly configured with minutes units)
  const timerHabits = useMemo(() => {
    return habits.filter((h) =>
      h.needsTimer === true ||
      (h.needsTimer === undefined && (h.unit === 'mins' || h.unit === 'minutes' || h.unit === 'min'))
    );
  }, [habits]);

  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionMessage, setSessionMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived active habit ID: use selectedHabitId if it exists in timerHabits, else default to first timer habit
  const effectiveHabitId = timerHabits.some((h) => h.id === selectedHabitId)
    ? selectedHabitId
    : timerHabits[0]?.id || '';

  const targetHabit = useMemo(() => {
    return timerHabits.find((h) => h.id === effectiveHabitId);
  }, [timerHabits, effectiveHabitId]);

  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('45');

  const isCustom = !TIMER_PRESETS.some((preset) => preset.minutes === selectedMinutes);

  // Handle Preset Selection
  const handleSelectPreset = (mins: number) => {
    sounds.playClick();
    setIsRunning(false);
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setSessionCompleted(false);
    setSessionMessage('');
  };

  // Handle Custom Duration Setting
  const handleApplyCustomMinutes = (mins: number) => {
    const validMins = Math.max(1, Math.min(360, Math.floor(mins)));
    sounds.playClick();
    setIsRunning(false);
    setSelectedMinutes(validMins);
    setSecondsRemaining(validMins * 60);
    setSessionCompleted(false);
    setSessionMessage('');
    setShowCustomInput(false);
  };

  // Completion Trigger (Full countdown finished)
  const handleTimerComplete = useCallback(() => {
    sounds.playTimerComplete();
    focusMusic.stop();
    setActiveSound('none');
    setActiveCustomTrack(null);
    setSessionCompleted(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#FACC15', '#38BDF8', '#000000'],
      });
    } catch {}

    const habitTitle = targetHabit?.title || 'task';
    setSessionMessage(`Session Crushed! +${selectedMinutes}m saved to ${habitTitle}!`);

    // Automatically log progress if habit callback is provided
    if (effectiveHabitId && onLogProgress) {
      onLogProgress(effectiveHabitId, selectedMinutes);
    }
  }, [effectiveHabitId, selectedMinutes, onLogProgress, targetHabit]);

  // Keep latest onComplete callback ref for interval
  const completeRef = useRef(handleTimerComplete);
  useEffect(() => {
    completeRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            completeRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Start Sprint
  const handleStart = () => {
    sounds.playClick();
    setIsRunning(true);
    setSessionCompleted(false);
    setSessionMessage('');
    // Auto-start ambient focus sound if one was selected
    if (activeSound === 'custom' && activeCustomTrack) {
      focusMusic.setVolume(volume);
      focusMusic.playCustom(activeCustomTrack.blob, activeCustomTrack.id);
    } else if (activeSound !== 'none' && activeSound !== 'custom') {
      focusMusic.setVolume(volume);
      focusMusic.play(activeSound);
    }
  };

  // Pause Sprint
  const handlePause = () => {
    sounds.playClick();
    setIsRunning(false);
    focusMusic.stop();
  };

  // Resume Sprint
  const handleResume = () => {
    sounds.playClick();
    setIsRunning(true);
    setSessionCompleted(false);
    // Auto-resume ambient focus sound if one was selected
    if (activeSound === 'custom' && activeCustomTrack) {
      focusMusic.setVolume(volume);
      focusMusic.playCustom(activeCustomTrack.blob, activeCustomTrack.id);
    } else if (activeSound !== 'none' && activeSound !== 'custom') {
      focusMusic.setVolume(volume);
      focusMusic.play(activeSound);
    }
  };

  // Stop Sprint & Log Elapsed Minutes
  const handleStopAndLog = () => {
    sounds.playTimerComplete();
    focusMusic.stop();
    setActiveSound('none');
    setActiveCustomTrack(null);
    setIsRunning(false);

    const totalSecs = selectedMinutes * 60;
    const elapsedSeconds = totalSecs - secondsRemaining;
    const elapsedMins = Math.floor(elapsedSeconds / 60);

    if (elapsedMins > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#FACC15', '#38BDF8', '#000000'],
        });
      } catch {}

      if (effectiveHabitId && onLogProgress) {
        onLogProgress(effectiveHabitId, elapsedMins);
      }
      const habitTitle = targetHabit?.title || 'task';
      setSessionMessage(`+${elapsedMins}m saved to ${habitTitle}!`);
      setSessionCompleted(true);
    } else {
      setSessionMessage('Sprint ended (less than 1 min elapsed).');
      setSessionCompleted(false);
    }

    setSecondsRemaining(selectedMinutes * 60);
  };


  // Reset / Discard
  const handleReset = () => {
    sounds.playClick();
    setIsRunning(false);
    setSecondsRemaining(selectedMinutes * 60);
    setSessionCompleted(false);
    setSessionMessage('');
    focusMusic.stop();
    setActiveSound('none');
    setActiveCustomTrack(null);
  };

  // Procedural Sound Track Change
  const handleSoundChange = (track: FocusSoundTrack) => {
    sounds.playClick();
    if (activeSound === track) {
      // Toggle off / Mute
      setActiveSound('none');
      setActiveCustomTrack(null);
      focusMusic.stop();
      return;
    }

    setActiveCustomTrack(null);
    setActiveSound(track);
    focusMusic.setVolume(volume);
    focusMusic.play(track);
  };

  // Custom Audio Track Playback
  const handlePlayCustomTrack = (track: CustomTrack) => {
    setActiveSound('custom');
    setActiveCustomTrack(track);
    focusMusic.setVolume(volume);
    focusMusic.playCustom(track.blob, track.id);
  };

  const handleStopCustomTrack = () => {
    setActiveSound('none');
    setActiveCustomTrack(null);
    focusMusic.stop();
  };

  // Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    focusMusic.setVolume(val);
  };

  // Formatting MM:SS and Elapsed Time
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSeconds = selectedMinutes * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const isPaused = !isRunning && secondsRemaining < totalSeconds && secondsRemaining > 0 && !sessionCompleted;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecsRemainder = elapsedSeconds % 60;

  const currentTrackDef = SOUND_TRACKS.find((t) => t.id === activeSound);

  // Grouped tracks by Category
  const enhancers = SOUND_TRACKS.filter((t) => t.category === 'enhancers');
  const natureSounds = SOUND_TRACKS.filter((t) => t.category === 'nature');
  const instrumentals = SOUND_TRACKS.filter((t) => t.category === 'instrumental');

  const renderTrackCard = (track: SoundTrackDef) => {
    const isSelected = activeSound === track.id;
    return (
      <button
        key={track.id}
        type="button"
        onClick={() => handleSoundChange(track.id)}
        className={cn(
          'p-3 border-2 border-[var(--border-color)] text-left transition-all cursor-pointer flex flex-col gap-1.5 shadow-sm rounded-[inherit]',
          isSelected
            ? 'bg-[var(--accent-primary)] text-black -translate-y-1 font-semibold'
            : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:opacity-90 hover:-translate-y-0.5'
        )}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">{track.icon}</span>
            <span className="font-black text-xs tracking-tight">{track.label}</span>
          </div>
          <span
            className={cn(
              'text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[var(--border-color)] uppercase shrink-0',
              isSelected ? 'bg-black text-[var(--accent-primary)]' : 'bg-[var(--paper-surface)] text-[var(--ink-muted)]'
            )}
          >
            {track.badge}
          </span>
        </div>

        <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 leading-tight">
          {track.science}
        </div>

        <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-snug line-clamp-2">
          {track.desc}
        </p>

        {isSelected && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-black/30 mt-auto">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider">Playing Offline</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 1. Digital Sprint Clock & Progress Header */}
      <section className="w-full neo-card bg-[var(--paper-surface)] border-2 border-[var(--border-color)] p-5 sm:p-7 shadow-[var(--card-shadow)] flex flex-col gap-6 transition-colors">
        {/* Top Banner / Section Title */}
        <div className="flex items-center justify-between border-b-2 border-[var(--border-color)] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FACC15] border-2 border-[var(--border-color)] flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--ink-primary)] leading-none">
                Deep Work Pomodoro Sprint
              </h2>
              <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400">
                Auto Habit Logging • Zero Distractions • Focus Interval
              </span>
            </div>
          </div>

          {/* Selected Habit Anchor — ONLY habits that have selected "Needs Timer" */}
          {timerHabits.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-stone-600 dark:text-stone-400 hidden sm:inline">
                Target Habit:
              </span>
              <select
                value={effectiveHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="bg-[var(--paper-surface)] text-[var(--ink-primary)] text-xs font-bold font-mono border-2 border-[var(--border-color)] px-2.5 py-1.5 shadow-sm outline-none cursor-pointer"
              >
                {timerHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} ({h.targetValue ? `${h.targetValue} ${h.unit || 'mins'}` : 'mins'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-stone-700 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono shadow-[2px_2px_0px_#000]">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>No timer habits (Enable &quot;Needs Timer&quot; in habit settings)</span>
            </div>
          )}
        </div>

        {/* Digital Clock Section */}
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Preset Buttons & Custom Duration Option */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {TIMER_PRESETS.map((preset) => {
                const isActive = selectedMinutes === preset.minutes && !showCustomInput;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      handleSelectPreset(preset.minutes);
                    }}
                    className={cn(
                      'px-3.5 py-1.5 font-black text-xs border-2 border-black dark:border-stone-700 transition-all cursor-pointer shadow-[2px_2px_0px_#000]',
                      isActive
                        ? 'bg-[#22C55E] text-black -translate-y-0.5'
                        : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    {preset.label} <span className="font-mono opacity-80">({preset.badge})</span>
                  </button>
                );
              })}

              {/* Custom Timer Button */}
              <button
                type="button"
                onClick={() => setShowCustomInput((prev) => !prev)}
                className={cn(
                  'px-3.5 py-1.5 font-black text-xs border-2 border-black dark:border-stone-700 transition-all cursor-pointer shadow-[2px_2px_0px_#000] flex items-center gap-1.5',
                  isCustom && !showCustomInput
                    ? 'bg-[#22C55E] text-black -translate-y-0.5'
                    : showCustomInput
                    ? 'bg-[#FACC15] text-black -translate-y-0.5'
                    : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                )}
                title="Configure custom timer duration"
              >
                <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isCustom ? `Custom (${selectedMinutes}m)` : 'Custom'}</span>
              </button>
            </div>

            {/* Interactive Custom Duration Config Panel */}
            {showCustomInput && (
              <div className="flex items-center gap-2 flex-wrap justify-center p-2.5 bg-white dark:bg-[#1A1A24] border-2 border-black dark:border-stone-700 shadow-[3px_3px_0px_#000] animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase text-stone-700 dark:text-stone-300">Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={customMinutesInput}
                    onChange={(e) => setCustomMinutesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(customMinutesInput, 10);
                        if (!isNaN(val) && val > 0) handleApplyCustomMinutes(val);
                      }
                    }}
                    placeholder="45"
                    className="w-16 px-2 py-1 text-center font-mono font-black text-sm border-2 border-black dark:border-stone-600 bg-stone-50 dark:bg-[#121218] text-black dark:text-white outline-none focus:ring-2 focus:ring-[#22C55E]"
                    autoFocus
                  />
                  <span className="text-xs font-mono font-bold text-stone-500">mins</span>
                </div>

                {/* Popular Quick Intervals */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[10, 30, 45, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setCustomMinutesInput(String(m));
                        handleApplyCustomMinutes(m);
                      }}
                      className={cn(
                        'px-2 py-0.5 text-[11px] font-mono font-bold border border-black dark:border-stone-700 cursor-pointer shadow-[1px_1px_0px_#000]',
                        selectedMinutes === m
                          ? 'bg-[#22C55E] text-black font-black'
                          : 'bg-stone-100 dark:bg-[#252532] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const val = parseInt(customMinutesInput, 10);
                    if (!isNaN(val) && val > 0) handleApplyCustomMinutes(val);
                  }}
                  className="px-3 py-1 text-xs font-black uppercase bg-[#22C55E] hover:bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="p-1 text-stone-500 hover:text-black dark:hover:text-white cursor-pointer"
                  title="Close custom input"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Big Digital Clock Card */}
          <div className="w-full max-w-xl bg-[var(--paper-subtle)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-[var(--card-shadow)] flex flex-col items-center gap-3 relative overflow-hidden rounded-[inherit]">
            {/* Progress Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-stone-200 dark:bg-stone-800">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-1000 ease-linear"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>

            {/* Time Typography */}
            <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-black text-[var(--ink-primary)] tracking-tighter select-none py-2">
              {timeDisplay}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-center">
              {isRunning ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-[#22C55E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
                  Sprint In Progress
                </span>
              ) : isPaused ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-[#FACC15]">
                  <Pause className="w-4 h-4 stroke-[3]" />
                  Sprint Paused • {elapsedMins}m {elapsedSecsRemainder > 0 && elapsedMins < 1 ? `${elapsedSecsRemainder}s ` : ''}elapsed
                </span>
              ) : sessionCompleted ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-[#22C55E]">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {sessionMessage || 'Session Crushed! Saved to streak'}
                </span>
              ) : sessionMessage ? (
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                  {sessionMessage}
                </span>
              ) : (
                <span className="text-stone-500 dark:text-stone-400">
                  Ready to focus
                </span>
              )}
            </div>

            {/* Action Buttons: Play/Pause/Stop/Resume/Reset */}
            <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
              {isRunning ? (
                <>
                  <BrutalistButton
                    variant="danger"
                    size="md"
                    onClick={handlePause}
                    className="gap-2 px-8 py-3 text-sm"
                  >
                    <Pause className="w-5 h-5 stroke-[2.5]" /> Pause Sprint
                  </BrutalistButton>

                  <BrutalistButton
                    variant="secondary"
                    size="md"
                    onClick={handleReset}
                    title="Reset sprint"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </BrutalistButton>
                </>
              ) : isPaused ? (
                <>
                  <BrutalistButton
                    variant="primary"
                    size="md"
                    onClick={handleResume}
                    className="gap-2 px-6 py-3 text-sm"
                  >
                    <Play className="w-5 h-5 stroke-[2.5] fill-current" /> Resume Sprint
                  </BrutalistButton>

                  <BrutalistButton
                    variant="yellow"
                    size="md"
                    onClick={handleStopAndLog}
                    className="gap-2 px-6 py-3 text-sm font-black"
                    title={
                      elapsedMins > 0
                        ? `Stop sprint and log ${elapsedMins} min${elapsedMins === 1 ? '' : 's'} to ${targetHabit?.title || 'task'}`
                        : 'Stop sprint without adding time (under 1 min elapsed)'
                    }
                  >
                    <Square className="w-4 h-4 stroke-[2.5] fill-current" />
                    {elapsedMins > 0 ? `Stop & Add +${elapsedMins}m` : 'Stop Sprint'}
                  </BrutalistButton>

                  <BrutalistButton
                    variant="secondary"
                    size="md"
                    onClick={handleReset}
                    title="Discard paused sprint without saving"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </BrutalistButton>
                </>
              ) : (
                <>
                  <BrutalistButton
                    variant="primary"
                    size="md"
                    onClick={handleStart}
                    className="gap-2 px-8 py-3 text-sm"
                  >
                    <Play className="w-5 h-5 stroke-[2.5] fill-current" /> Start Sprint
                  </BrutalistButton>

                  <BrutalistButton
                    variant="secondary"
                    size="md"
                    onClick={handleReset}
                    title="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  </BrutalistButton>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 100% Offline Focus Soundscapes & Audio Station */}
      <section className="w-full neo-card bg-[var(--paper-surface)] border-2 border-[var(--border-color)] p-5 sm:p-7 shadow-[var(--card-shadow)] flex flex-col gap-6 transition-colors">
        {/* Top Header of Sound Station */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[var(--border-color)] pb-4 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--accent-primary)] border-2 border-[var(--border-color)] flex items-center justify-center shadow-sm">
              <Headphones className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--ink-primary)]">
                  Offline Soundscapes &amp; Custom Audio
                </h3>
                <span className="neo-badge bg-[#38BDF8] text-black hidden sm:inline">100% Offline</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                Scientific binaural waves, biophilic nature, procedural instrumental &amp; custom local song uploader.
              </p>
            </div>
          </div>

          {/* Master Volume & Quick Mute Controller */}
          <div className="flex items-center gap-3 w-full sm:w-auto bg-[var(--paper-subtle)] p-2.5 border-2 border-[var(--border-color)] shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (activeSound !== 'none') {
                  sounds.playClick();
                  setActiveSound('none');
                  setActiveCustomTrack(null);
                  focusMusic.stop();
                }
              }}
              title={activeSound !== 'none' ? 'Mute audio' : 'Muted'}
              className={cn(
                'px-2.5 py-1 border-2 border-[var(--border-color)] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:translate-y-0.5',
                activeSound === 'none'
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  : 'bg-[#FB7185] text-black hover:bg-rose-400'
              )}
            >
              {activeSound === 'none' ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 stroke-[2.5]" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" /> Stop Sound
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                disabled={activeSound === 'none'}
                aria-label="Sound volume"
                className="w-24 sm:w-28 accent-[#22C55E] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[var(--ink-primary)] w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Audio Bar (If playing) */}
        {activeSound !== 'none' && (
          <div className="w-full bg-[#22C55E] border-2 border-black p-3 shadow-[3px_3px_0px_#000] flex items-center justify-between flex-wrap gap-2 text-black">
            <div className="flex items-center gap-2.5">
              <div className="flex items-end gap-0.5 h-4 w-5 px-1 bg-black/10 rounded">
                <span className="w-1 bg-black animate-[bounce_0.6s_infinite_0.1s] h-3" />
                <span className="w-1 bg-black animate-[bounce_0.6s_infinite_0.2s] h-4" />
                <span className="w-1 bg-black animate-[bounce_0.6s_infinite_0.3s] h-2" />
                <span className="w-1 bg-black animate-[bounce_0.6s_infinite_0.15s] h-3.5" />
              </div>

              {activeSound === 'custom' && activeCustomTrack ? (
                <>
                  <span className="text-base">🎵</span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block leading-none">
                      Playing Custom Audio: {activeCustomTrack.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold opacity-80">
                      {activeCustomTrack.fileName} • 100% Offline IndexedDB Track
                    </span>
                  </div>
                </>
              ) : currentTrackDef ? (
                <>
                  <span className="text-base">{currentTrackDef.icon}</span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block leading-none">
                      Currently Synthesizing: {currentTrackDef.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold opacity-80">
                      {currentTrackDef.science} • {currentTrackDef.badge}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveSound('none');
                setActiveCustomTrack(null);
                focusMusic.stop();
              }}
              className="px-2.5 py-1 bg-black text-[#22C55E] text-xs font-black uppercase tracking-wider border border-black cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-stone-900"
            >
              Mute &amp; Silence
            </button>
          </div>
        )}

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap border-b-2 border-black dark:border-stone-700 pb-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('all');
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black border-2 border-black dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-all',
              activeTab === 'all'
                ? 'bg-[#FACC15] text-black -translate-y-0.5'
                : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Radio className="w-3.5 h-3.5 stroke-[2.5]" /> All Audio
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('enhancers');
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black border-2 border-black dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-all',
              activeTab === 'enhancers'
                ? 'bg-[#22C55E] text-black -translate-y-0.5'
                : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" /> 1. Focus Enhancers ({enhancers.length})
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('nature');
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black border-2 border-black dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-all',
              activeTab === 'nature'
                ? 'bg-[#38BDF8] text-black -translate-y-0.5'
                : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Leaf className="w-3.5 h-3.5 stroke-[2.5]" /> 2. Nature Sounds ({natureSounds.length})
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('instrumental');
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black border-2 border-black dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-all',
              activeTab === 'instrumental'
                ? 'bg-[#E879F9] text-black -translate-y-0.5'
                : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Music2 className="w-3.5 h-3.5 stroke-[2.5]" /> 3. Instrumental ({instrumentals.length})
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('custom');
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-black border-2 border-black dark:border-stone-700 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition-all',
              activeTab === 'custom'
                ? 'bg-[#A855F7] text-white -translate-y-0.5'
                : 'bg-white dark:bg-[#20202A] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" /> 4. Custom Songs / Audio
          </button>
        </div>

        {/* The 4 Structured Soundscape Sections */}
        <div className="flex flex-col gap-8">
          {/* Section 1: Scientifically Proven Focus Enhancers */}
          {(activeTab === 'all' || activeTab === 'enhancers') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-black/20 dark:border-stone-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#22C55E] border border-black flex items-center justify-center font-black text-xs text-black">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-[var(--ink-primary)]">
                      Scientifically Proven Focus Enhancers
                    </h4>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      Neuroacoustic Binaural Brainwaves &amp; Targeted Psychoacoustic Masks
                    </span>
                  </div>
                </div>
                <span className="neo-badge bg-[#22C55E] text-black text-[10px]">
                  Clinical Research
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enhancers.map((track) => renderTrackCard(track))}
              </div>
            </div>
          )}

          {/* Section 2: Nature Sounds / Voices */}
          {(activeTab === 'all' || activeTab === 'nature') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-black/20 dark:border-stone-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#38BDF8] border border-black flex items-center justify-center font-black text-xs text-black">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-[var(--ink-primary)]">
                      Biophilic Nature Sounds &amp; Voices
                    </h4>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      Rain, Ocean Tides, Warm Campfire, Pines Wind &amp; Freshwater Stream
                    </span>
                  </div>
                </div>
                <span className="neo-badge bg-[#38BDF8] text-black text-[10px]">
                  Stress Reduction
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {natureSounds.map((track) => renderTrackCard(track))}
              </div>
            </div>
          )}

          {/* Section 3: Generative Offline Instrumental */}
          {(activeTab === 'all' || activeTab === 'instrumental') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-black/20 dark:border-stone-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#E879F9] border border-black flex items-center justify-center font-black text-xs text-black">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-[var(--ink-primary)]">
                      Offline Generative Instrumental
                    </h4>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      Lo-Fi Rhodes, Tibetan Bowls, Ethereal Harp, Analog Pad &amp; Cello Drone
                    </span>
                  </div>
                </div>
                <span className="neo-badge bg-[#E879F9] text-black text-[10px]">
                  100% Procedural
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {instrumentals.map((track) => renderTrackCard(track))}
              </div>
            </div>
          )}

          {/* Section 4: Custom Offline Songs & Audio Uploader */}
          {(activeTab === 'all' || activeTab === 'custom') && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between border-b border-black/20 dark:border-stone-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#A855F7] border border-black flex items-center justify-center font-black text-xs text-white">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-black dark:text-white">
                      Custom Offline Songs &amp; Audio Uploader
                    </h4>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      Upload Personal MP3, WAV, FLAC, M4A Tracks • Stored 100% On-Device in IndexedDB
                    </span>
                  </div>
                </div>
                <span className="neo-badge bg-[#A855F7] text-white text-[10px]">
                  IndexedDB Local
                </span>
              </div>

              <CustomAudioUploader
                activeCustomTrackId={activeSound === 'custom' ? (activeCustomTrack?.id ?? null) : null}
                isPlaying={activeSound === 'custom'}
                onPlayTrack={handlePlayCustomTrack}
                onStopTrack={handleStopCustomTrack}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
