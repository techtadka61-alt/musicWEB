import type { SVGProps } from 'react';

/** Small inline icon set (24×24, currentColor). Decorative by default; pass aria-label to expose. */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden={props['aria-label'] ? undefined : true}
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
  </Icon>
);

export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
  </Icon>
);

export const NextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 6.2v11.6a1 1 0 0 0 1.55.83L15 13v4.5a1 1 0 0 0 2 0v-11a1 1 0 0 0-2 0V11L6.55 5.37A1 1 0 0 0 5 6.2Z" />
  </Icon>
);

export const PreviousIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 6.2v11.6a1 1 0 0 1-1.55.83L9 13v4.5a1 1 0 0 1-2 0v-11a1 1 0 0 1 2 0V11l8.45-5.63A1 1 0 0 1 19 6.2Z" />
  </Icon>
);

export const ShuffleIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Icon>
);

export const RepeatIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </Icon>
);

export const RepeatOneIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    <path d="M11 10h1v4" />
  </Icon>
);

export const VolumeIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </Icon>
);

export const VolumeMutedIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
    <path d="m22 9-6 6M16 9l6 6" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const MusicNoteIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 3.5v11.25a3.25 3.25 0 1 1-2-3V7.27l-8 1.6v8.88A3.25 3.25 0 1 1 7 14.75V6.6a1 1 0 0 1 .8-.98l10-2a1 1 0 0 1 1.2.98Z" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const WifiOffIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.17-2.7M19 13a10 10 0 0 0-2.17-1.6M2 8.82a15 15 0 0 1 4.17-2.65M22 8.82A15 15 0 0 0 11.3 4.95M12 20h.01" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

/** Circular arrow with the step ("10") inside; mirrored for forward. */
function SeekStepIcon({ forward, ...p }: IconProps & { forward: boolean }) {
  return (
    <Icon {...p}>
      <path
        d={forward ? 'M12 4.5a8 8 0 1 1-8 8' : 'M12 4.5a8 8 0 1 0 8 8'}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <path d={forward ? 'M11 1.5 15 4.5 11 7.5Z' : 'M13 1.5 9 4.5 13 7.5Z'} />
      <text
        x="12"
        y="15.6"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        10
      </text>
    </Icon>
  );
}

export const Rewind10Icon = (p: IconProps) => <SeekStepIcon forward={false} {...p} />;
export const Forward10Icon = (p: IconProps) => <SeekStepIcon forward {...p} />;

export const FlameIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.6 2.2a.75.75 0 0 0-1.17.53c-.33 2.6-1.66 4.12-3.03 5.7C6.9 10.13 5.25 12 5.25 15A6.75 6.75 0 0 0 12 21.75 6.75 6.75 0 0 0 18.75 15c0-3.25-1.5-5.43-2.85-7.1a.75.75 0 0 0-1.3.4c-.13.97-.5 1.8-1.12 2.36.26-3.2-.55-6.2-.88-8.46Z" />
  </Icon>
);
