interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}

export function Avatar({ name, color, size = 36, ring = false }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${
        ring ? "ring-2 ring-cream-50" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
      }}
      aria-label={name}
    >
      {name.slice(0, 1)}
    </span>
  );
}
