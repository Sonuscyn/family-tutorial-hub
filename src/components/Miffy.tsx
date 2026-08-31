import { useSettings } from "../lib/settings";

type Character = "miffy" | "rilakkuma";
type Decoration = "none" | "crown" | "heart" | "apple";

interface MiffyProps {
  className?: string;
  character?: Character;
  stroke?: string;
  fill?: string;
  cheek?: boolean;
  decoration?: Decoration;
  decorationColor?: string;
}

/**
 * Smooth, rounded Miffy / Rilakkuma mark with optional decorations.
 * Uses curves and round line-joins for a soft, cute look.
 */
export function Miffy({
  className,
  character = "miffy",
  stroke = "#2C2C2C",
  fill = "#FFFFFF",
  cheek = false,
  decoration = "none",
  decorationColor = "#F2C94C",
}: MiffyProps) {
  return character === "miffy" ? (
    <MiffyBody
      className={className}
      stroke={stroke}
      fill={fill}
      cheek={cheek}
      decoration={decoration}
      decorationColor={decorationColor}
    />
  ) : (
    <RilakkumaBody
      className={className}
      stroke={stroke}
      fill={fill}
      cheek={cheek}
      decoration={decoration}
      decorationColor={decorationColor}
    />
  );
}

/* ===== Decoration ===== */
function Deco({
  type,
  color,
  cx = 50,
}: {
  type: Decoration;
  color: string;
  cx?: number;
}) {
  if (type === "none") return null;

  if (type === "crown") {
    return (
      <g>
        <path
          d={`M ${cx - 12} 22 L ${cx - 7} 12 L ${cx} 17 L ${cx + 7} 12 L ${cx + 12} 22 Z`}
          fill={color}
          stroke={color}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect x={cx - 12} y="22" width="24" height="3" rx="1.5" fill={color} />
        <circle cx={cx - 7} cy="12" r="1.5" fill={color} />
        <circle cx={cx} cy="9" r="1.8" fill={color} />
        <circle cx={cx + 7} cy="12" r="1.5" fill={color} />
      </g>
    );
  }

  if (type === "heart") {
    return (
      <path
        d={`M ${cx} 24 C ${cx - 4} 16, ${cx - 11} 18, ${cx - 9} 25 C ${cx - 7} 30, ${cx} 34, ${cx} 34 C ${cx} 34, ${cx + 7} 30, ${cx + 9} 25 C ${cx + 11} 18, ${cx + 4} 16, ${cx} 24 Z`}
        fill={color}
      />
    );
  }

  if (type === "apple") {
    return (
      <g>
        <circle cx={cx} cy="20" r="7" fill={color} />
        <path d={`M ${cx} 13 L ${cx} 9`} stroke="#7B5E3A" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d={`M ${cx} 11 Q ${cx + 5} 6, ${cx + 9} 9`}
          stroke="#66BB6A"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx={cx - 2} cy="18" rx="2" ry="3" fill="#FFFFFF" opacity="0.35" />
      </g>
    );
  }

  return null;
}

/* ===== Miffy (smooth) ===== */
function MiffyBody({
  className,
  stroke,
  fill,
  cheek,
  decoration = "none",
  decorationColor = "#F2C94C",
}: MiffyProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Deco type={decoration} color={decorationColor} />

      {/* Ears */}
      <rect x="24" y="4" width="12" height="40" rx="6" fill={stroke} />
      <rect x="26" y="6" width="8" height="36" rx="4" fill={fill} />
      <rect x="64" y="4" width="12" height="40" rx="6" fill={stroke} />
      <rect x="66" y="6" width="8" height="36" rx="4" fill={fill} />

      {/* Head — smooth egg shape */}
      <path
        d="M 18 52 C 18 30 28 24 50 24 C 72 24 82 30 82 52 C 82 74 74 90 50 94 C 26 90 18 74 18 52 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Cheeks */}
      {cheek && (
        <>
          <circle cx="28" cy="60" r="4" fill="#F4A0A0" opacity="0.5" />
          <circle cx="72" cy="60" r="4" fill="#F4A0A0" opacity="0.5" />
        </>
      )}

      {/* Eyes */}
      <circle cx="37" cy="50" r="3" fill={stroke} />
      <circle cx="63" cy="50" r="3" fill={stroke} />

      {/* Mouth × */}
      <path
        d="M 42 62 L 50 70 M 50 62 L 42 70"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Rilakkuma (轻松熊) ===== */
function RilakkumaBody({
  className,
  stroke,
  fill,
  cheek,
  decoration = "none",
  decorationColor = "#F2C94C",
}: MiffyProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Deco type={decoration} color={decorationColor} cx={50} />

      {/* Ears */}
      <circle cx="28" cy="22" r="11" fill={stroke} />
      <circle cx="28" cy="22" r="6" fill={fill} />
      <circle cx="72" cy="22" r="11" fill={stroke} />
      <circle cx="72" cy="22" r="6" fill={fill} />

      {/* Head */}
      <ellipse
        cx="50"
        cy="60"
        rx="36"
        ry="38"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />

      {/* Muzzle */}
      <ellipse cx="50" cy="70" rx="16" ry="12" fill="#FFFFFF" opacity="0.85" />

      {/* Cheeks */}
      {cheek && (
        <>
          <circle cx="26" cy="58" r="4" fill="#F4A0A0" opacity="0.5" />
          <circle cx="74" cy="58" r="4" fill="#F4A0A0" opacity="0.5" />
        </>
      )}

      {/* Eyes */}
      <circle cx="38" cy="52" r="3" fill={stroke} />
      <circle cx="62" cy="52" r="3" fill={stroke} />

      {/* Nose */}
      <ellipse cx="50" cy="64" rx="2.5" ry="2" fill={stroke} />

      {/* Mouth */}
      <path
        d="M 44 70 Q 50 74 56 70"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Settings-aware wrappers ===== */

/** Big hero avatar on the landing page. Reads hero settings. */
export function HeroAvatar({ className, cheek }: { className?: string; cheek?: boolean }) {
  const { settings } = useSettings();

  if (settings.heroCustomUrl) {
    return (
      <img
        src={settings.heroCustomUrl}
        alt="头像"
        className={className}
        style={{ objectFit: "contain" }}
      />
    );
  }

  return (
    <Miffy
      className={className}
      character={settings.heroCharType}
      stroke={settings.heroStroke}
      fill={settings.heroFill}
      cheek={cheek ?? settings.heroCheek}
      decoration={settings.heroDecoration}
      decorationColor={settings.heroDecorationColor}
    />
  );
}

/** Small logo mark used in nav, footer, etc. Reads logo settings. */
export function LogoMark({ className, cheek }: { className?: string; cheek?: boolean }) {
  const { settings } = useSettings();

  if (settings.logoCustomUrl) {
    return (
      <img
        src={settings.logoCustomUrl}
        alt="logo"
        className={className}
        style={{ objectFit: "contain" }}
      />
    );
  }

  return (
    <Miffy
      className={className}
      character={settings.logoCharType}
      stroke={settings.logoStroke}
      fill={settings.logoFill}
      cheek={cheek ?? settings.logoCheek}
      decoration={settings.logoDecoration}
      decorationColor={settings.logoDecorationColor}
    />
  );
}

/** Backwards-compat alias for LogoMark. */
export const MiffyLogo = LogoMark;

/** A tiny peeking Miffy for empty states. */
export function MiffyPeek({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="22" y="2" width="8" height="20" rx="4" fill="#2C2C2C" />
      <rect x="24" y="4" width="4" height="16" rx="2" fill="#FFF" />
      <rect x="70" y="2" width="8" height="20" rx="4" fill="#2C2C2C" />
      <rect x="72" y="4" width="4" height="16" rx="2" fill="#FFF" />
      <path
        d="M 12 38 C 12 24 20 20 50 20 C 80 20 88 24 88 38 C 88 50 82 58 50 58 C 18 58 12 50 12 38 Z"
        fill="#FFF"
        stroke="#2C2C2C"
        strokeWidth="2"
      />
      <circle cx="36" cy="36" r="2" fill="#2C2C2C" />
      <circle cx="64" cy="36" r="2" fill="#2C2C2C" />
      <path d="M 44 44 L 50 50 M 50 44 L 44 50" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
