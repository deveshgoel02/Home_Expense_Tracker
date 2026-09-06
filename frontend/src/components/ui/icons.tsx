import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const X = base(<path d="M18 6 6 18M6 6l12 12" />);
export const Plus = base(<path d="M12 5v14M5 12h14" />);
export const Trash = base(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </>
);
export const Edit = base(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>
);
export const Search = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
);
export const Filter = base(<path d="M4 6h16M7 12h10M10 18h4" />);
export const ChevronDown = base(<path d="m6 9 6 6 6-6" />);
export const ChevronRight = base(<path d="m9 6 6 6-6 6" />);
export const Copy = base(
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
);
export const Download = base(
  <>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </>
);
export const ArrowUp = base(<path d="M12 19V5M5 12l7-7 7 7" />);
export const ArrowDown = base(<path d="M12 5v14M5 12l7 7 7-7" />);
export const Menu = base(<path d="M4 6h16M4 12h16M4 18h16" />);
export const Home = base(
  <>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </>
);
export const Receipt = base(
  <>
    <path d="M4 3h16v18l-3-2-3 2-2-2-2 2-3-2-3 2Z" />
    <path d="M8 8h8M8 12h8M8 16h4" />
  </>
);
export const Wallet = base(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M16 13h2" />
  </>
);
export const PiggyBank = base(
  <>
    <path d="M19 9a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v3a2 2 0 0 1-2 2H8v-3H6a4 4 0 0 1-4-4V9a3 3 0 0 1 3-3h1V5a1 1 0 0 1 1-1h1.5" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
  </>
);
export const Users = base(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 8.5a3 3 0 1 1 4 2.83" />
    <path d="M20.5 20a6 6 0 0 0-4.5-5.8" />
  </>
);
export const ChartBar = base(
  <>
    <path d="M4 20V10M12 20V4M20 20v-7" />
    <path d="M4 20h16" />
  </>
);
export const Settings = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.16.36.42.66.75.86.32.2.7.29 1.08.23H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
  </>
);
export const AlertTriangle = base(
  <>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </>
);
export const CheckCircle = base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>
);
export const CreditCard = base(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>
);
export const Calendar = base(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);
export const Sun = base(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
);
export const Moon = base(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />);
export const Sparkles = base(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    <circle cx="12" cy="12" r="2.2" />
  </>
);
export const LogOut = base(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>
);
