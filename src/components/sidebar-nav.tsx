"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/usage", label: "Usage", icon: "usage" },
  { href: "/recommendations", label: "Recommendations", icon: "recs" },
  { href: "/appliances", label: "Appliances", icon: "appliances" },
  { href: "/forecast", label: "Forecast", icon: "forecast" },
  { href: "/about", label: "About", icon: "about" },
] as const;

function Icon({ name }: { name: (typeof items)[number]["icon"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "usage":
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 3 5-7 4 5" />
        </svg>
      );
    case "recs":
      return (
        <svg {...common}>
          <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 7.22 16.7l.91-5.32L4.27 7.62l5.34-.78L12 2z" />
        </svg>
      );
    case "appliances":
      return (
        <svg {...common}>
          <path d="M4 4h16v6H4z" />
          <path d="M4 14h16v6H4z" />
          <path d="M8 7h.01M8 17h.01" />
        </svg>
      );
    case "forecast":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v.01M11 12h1v4h1" />
        </svg>
      );
  }
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-grid-accent/10 text-grid-text ring-1 ring-grid-accent/30"
                : "text-grid-muted hover:bg-grid-card hover:text-grid-text",
            )}
          >
            <span
              className={cn(
                "transition",
                active ? "text-grid-accent" : "text-grid-muted group-hover:text-grid-text",
              )}
            >
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
