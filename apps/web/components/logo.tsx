import { cn } from "@/lib/utils";

export const Logo = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
  // Radar icon with signal waves and a dot, modern style, taller and narrower
  return (
    <svg
      viewBox="0 0 36 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground h-7 w-auto", className)}
    >
      {/* Radar circle */}
      <circle
        cx="16"
        cy="16"
        r="12"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="2"
      />
      {/* Radar sweep */}
      <path
        d="M16 16 L27 5"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Radar dot */}
      <circle cx="25" cy="7" r="2" fill={uniColor ? "currentColor" : "url(#logo-gradient)"} />
      {/* Signal waves */}
      <path
        d="M16 4 A12 12 0 0 1 28 16"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M16 28 A12 12 0 0 0 28 16"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="36"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B99FE" />
          <stop offset="1" stopColor="#2BC8B7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
  // Compact radar icon for favicon or avatar
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="2"
      />
      <path
        d="M12 12 L18 6"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="17" cy="7" r="1.5" fill={uniColor ? "currentColor" : "url(#logo-gradient)"} />
      <path
        d="M12 3 A9 9 0 0 1 21 12"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="1.1"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M12 21 A9 9 0 0 0 21 12"
        stroke={uniColor ? "currentColor" : "url(#logo-gradient)"}
        strokeWidth="1.1"
        fill="none"
        opacity="0.5"
      />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B99FE" />
          <stop offset="1" stopColor="#2BC8B7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn("size-7 w-7", className)}
      viewBox="0 0 71 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M61.25 1.625L70.75 1.5625C70.75 4.77083 70.25 7.79167 69.25 10.625C68.2917 13.4583 66.8958 15.9583 65.0625 18.125C63.2708 20.25 61.125 21.9375 58.625 23.1875C56.1667 24.3958 53.4583 25 50.5 25C46.875 25 43.6667 24.2708 40.875 22.8125C38.125 21.3542 35.125 19.2083 31.875 16.375C29.75 14.4167 27.7917 12.8958 26 11.8125C24.2083 10.7292 22.2708 10.1875 20.1875 10.1875C18.0625 10.1875 16.25 10.7083 14.75 11.75C13.25 12.75 12.0833 14.1875 11.25 16.0625C10.4583 17.9375 10.0625 20.1875 10.0625 22.8125L0 22.9375C0 19.6875 0.479167 16.6667 1.4375 13.875C2.4375 11.0833 3.83333 8.64583 5.625 6.5625C7.41667 4.47917 9.54167 2.875 12 1.75C14.5 0.583333 17.2292 0 20.1875 0C23.8542 0 27.1042 0.770833 29.9375 2.3125C32.8125 3.85417 35.7708 5.97917 38.8125 8.6875C41.1042 10.7708 43.1042 12.3333 44.8125 13.375C46.5625 14.375 48.4583 14.875 50.5 14.875C52.6667 14.875 54.5417 14.3125 56.125 13.1875C57.75 12.0625 59 10.5 59.875 8.5C60.7917 6.5 61.25 4.20833 61.25 1.625Z"
        fill="none"
        strokeWidth={0.5}
        stroke="currentColor"
      />
    </svg>
  );
};
