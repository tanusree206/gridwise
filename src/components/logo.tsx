export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="gw" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#22d3a4" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        stroke="url(#gw)"
        strokeWidth="1.5"
        fill="rgba(34,211,164,0.06)"
      />
      <path
        d="M9 19 L13 11 L17 19 L21 13 L24 19"
        stroke="url(#gw)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="19" r="1.5" fill="#22d3a4" />
      <circle cx="13" cy="11" r="1.5" fill="#22d3a4" />
      <circle cx="17" cy="19" r="1.5" fill="#60a5fa" />
      <circle cx="21" cy="13" r="1.5" fill="#60a5fa" />
      <circle cx="24" cy="19" r="1.5" fill="#a78bfa" />
    </svg>
  );
}
