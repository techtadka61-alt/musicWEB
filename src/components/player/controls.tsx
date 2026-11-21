'use client';

import { useState, type ReactNode } from 'react';
import {
  Forward10Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOneIcon,
  Rewind10Icon,
  ShuffleIcon,
  VolumeIcon,
  VolumeMutedIcon,
} from '@/components/common/icons';
import { player, SEEK_STEP_SECONDS } from '@/features/playback/player-controller';
import { usePlaybackModes, usePlaybackProgress, usePlaybackStatus } from '@/hooks/use-player';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';

const iconButton =
  'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}

export function PlayPauseButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { status } = usePlaybackStatus();
  const playing = status === 'playing';
  const loading = status === 'loading';
  const sizes = {
    sm: 'size-10 text-lg',
    md: 'size-12 text-xl',
    lg: 'size-16 text-2xl',
  } as const;

  return (
    <button
      type="button"
      onClick={() => player.toggle()}
      aria-label={playing || loading ? 'Pause' : 'Play'}
      className={cn(iconButton, sizes[size], 'bg-accent text-background hover:bg-accent-strong')}
    >
      {loading ? (
        <Spinner className="size-1/2" />
      ) : playing ? (
        <PauseIcon />
      ) : (
        <PlayIcon className="translate-x-px" />
      )}
    </button>
  );
}

function TransportButton({
  label,
  onClick,
  children,
  active,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        iconButton,
        'size-10 text-xl',
        active ? 'text-accent' : 'text-foreground/80 hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PreviousButton() {
  return (
    <TransportButton label="Previous" onClick={() => player.previous()}>
      <PreviousIcon />
    </TransportButton>
  );
}

export function NextButton({ className }: { className?: string }) {
  return (
    <TransportButton label="Next" onClick={() => player.next('user')} className={className}>
      <NextIcon />
    </TransportButton>
  );
}

export function RewindButton({ className }: { className?: string }) {
  return (
    <TransportButton
      label={`Rewind ${SEEK_STEP_SECONDS} seconds`}
      onClick={() => player.seekBy(-SEEK_STEP_SECONDS)}
      className={className}
    >
      <Rewind10Icon className="text-[1.6rem]" />
    </TransportButton>
  );
}

export function ForwardButton({ className }: { className?: string }) {
  return (
    <TransportButton
      label={`Forward ${SEEK_STEP_SECONDS} seconds`}
      onClick={() => player.seekBy(SEEK_STEP_SECONDS)}
      className={className}
    >
      <Forward10Icon className="text-[1.6rem]" />
    </TransportButton>
  );
}

export function ShuffleButton() {
  const { shuffle } = usePlaybackModes();
  return (
    <TransportButton
      label={shuffle ? 'Shuffle on' : 'Shuffle off'}
      active={shuffle}
      onClick={() => player.toggleShuffle()}
    >
      <ShuffleIcon className="text-lg" />
    </TransportButton>
  );
}

export function RepeatButton() {
  const { repeat } = usePlaybackModes();
  const label = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' }[repeat];
  return (
    <TransportButton label={label} active={repeat !== 'off'} onClick={() => player.cycleRepeat()}>
      {repeat === 'one' ? (
        <RepeatOneIcon className="text-lg" />
      ) : (
        <RepeatIcon className="text-lg" />
      )}
    </TransportButton>
  );
}

/**
 * Seek bar. While dragging only the local value moves; the audio seeks once on release,
 * so a drag does not fire dozens of network Range requests.
 */
export function SeekBar({ compact = false }: { compact?: boolean }) {
  const { position, duration } = usePlaybackProgress();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const value = dragValue ?? position;
  const max = duration > 0 ? duration : 1;
  const percent = Math.min(100, (value / max) * 100);

  const commit = () => {
    if (dragValue !== null) {
      player.seek(dragValue);
      setDragValue(null);
    }
  };

  return (
    <div className={cn('flex w-full items-center gap-3', compact && 'gap-2')}>
      {!compact && (
        <span className="w-12 text-right text-xs tabular-nums text-muted">
          {formatDuration(value)}
        </span>
      )}
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(value)} of ${formatDuration(duration)}`}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="range-input flex-1"
        style={{ '--range-progress': `${percent}%` } as React.CSSProperties}
      />
      {!compact && (
        <span className="w-12 text-xs tabular-nums text-muted">{formatDuration(duration)}</span>
      )}
    </div>
  );
}

export function VolumeControl() {
  const { volume, muted } = usePlaybackModes();
  const effective = muted ? 0 : volume;
  return (
    <div className="flex items-center gap-2">
      <TransportButton label={muted ? 'Unmute' : 'Mute'} onClick={() => player.toggleMute()}>
        {effective === 0 ? (
          <VolumeMutedIcon className="text-lg" />
        ) : (
          <VolumeIcon className="text-lg" />
        )}
      </TransportButton>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)}%`}
        onChange={(e) => player.setVolume(Number(e.target.value))}
        className="range-input w-28"
        style={{ '--range-progress': `${effective * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

export function PlaybackError() {
  const { status, errorMessage } = usePlaybackStatus();
  if (status !== 'error' || !errorMessage) return null;
  return (
    <p role="alert" className="text-sm text-red-300">
      {errorMessage}
    </p>
  );
}
