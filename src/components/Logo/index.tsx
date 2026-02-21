"use client";

/**
 * Inline SVG logo so CSS custom-properties (--accent, --accent-strong, --glow, --theme-btn…)
 * can be injected into the gradient stops when on a themed play page.
 *
 * When `themed` is false (default) the original rose/red palette is used.
 */
export default function LogoIcon({
    width = 40,
    height = 40,
    themed = false,
}: {
    width?: number;
    height?: number;
    themed?: boolean;
}) {
    // On themed pages the gradient stops reference CSS vars so they update automatically.
    const bgA  = themed ? 'var(--accent-strong)' : '#f43f5e';
    const bgB  = themed ? 'var(--accent)'        : '#dc2626';
    const bgC  = themed ? 'var(--elevated)'      : '#7f1d1d';

    const coreA = themed ? 'var(--text)'         : '#fff5f5';
    const coreB = themed ? 'var(--accent-strong)': '#fb7185';
    const coreC = themed ? 'var(--elevated)'     : '#7f1d1d';

    const edgeA = themed ? 'var(--accent-strong)': '#fde047';
    const edgeB = themed ? 'var(--muted)'        : '#f97316';

    const faceStroke  = themed ? 'var(--text)'       : '#fef2f2';
    const lineStroke  = themed ? 'var(--textWeak)'   : '#fee2e2';
    const innerLines  = themed ? 'var(--muted)'      : '#feb2b2';
    const textFill    = themed ? 'var(--text)'       : '#fef3c7';
    const textStroke  = themed ? 'var(--elevated)'   : '#7f1d1d';

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 512 512"
            role="img"
            aria-labelledby="logoTitle logoDesc"
        >
            <title id="logoTitle">Roleplaying Realm Icon</title>
            <desc id="logoDesc">D20 die inspired emblem for Roleplaying Realm</desc>
            <defs>
                <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor={bgA} />
                    <stop offset="55%"  stopColor={bgB} />
                    <stop offset="100%" stopColor={bgC} />
                </linearGradient>
                <radialGradient id="logo-core" cx="50%" cy="40%" r="70%">
                    <stop offset="0%"   stopColor={coreA} stopOpacity="0.95" />
                    <stop offset="55%"  stopColor={coreB} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={coreC} />
                </radialGradient>
                <linearGradient id="logo-edge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={edgeA} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={edgeB} stopOpacity="0.9" />
                </linearGradient>
            </defs>
            <rect width="472" height="472" x="20" y="20" rx="128" fill="url(#logo-bg)" />
            <polygon
                points="256 92 114 162 90 308 256 420 422 308 398 162"
                fill="url(#logo-core)"
                stroke={faceStroke}
                strokeWidth="8"
                strokeLinejoin="round"
            />
            <path
                d="M256 92 256 420 114 162 256 92 422 308 256 420 398 162 114 162"
                fill="none"
                stroke={lineStroke}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
            />
            <path
                d="M114 162 256 252 398 162 422 308 256 186 90 308"
                fill="none"
                stroke={innerLines}
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.75"
            />
            <path d="M210 290h92l-46 80-46-80z" fill="rgba(255,255,255,0.12)" />
            <path
                d="M196 210h120"
                stroke="#fff5f5"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.6"
            />
            <circle cx="256" cy="188" r="46" fill="none" stroke="url(#logo-edge)" strokeWidth="10" opacity="0.8" />
            <text
                x="256"
                y="228"
                textAnchor="middle"
                fontFamily="'Space Grotesk','SpaceGrotesk','Segoe UI',sans-serif"
                fontSize="88"
                fontWeight="700"
                fill={textFill}
                stroke={textStroke}
                strokeWidth="4"
                paintOrder="stroke"
            >
                20
            </text>
            <circle cx="326" cy="150" r="12" fill="#fff" opacity="0.8" />
            <circle cx="338" cy="134" r="6" fill="#fff" opacity="0.9" />
        </svg>
    );
}
