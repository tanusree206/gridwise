import Link from "next/link";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold tracking-tight text-grid-text">
                  GridWise
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-grid-muted">
                  Energy Intelligence
                </span>
              </div>
            </Link>
            <SidebarNav />
            <div className="card mt-auto text-xs text-grid-muted">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-grid-accent shadow-[0_0_10px_rgba(34,211,164,0.7)]" />
                <span className="text-grid-text">Live analysis</span>
              </div>
              Last sync just now · model
              <span className="ml-1 rounded bg-grid-surface px-1.5 py-0.5 font-mono text-[10px] text-grid-accent">
                gridwise-v3
              </span>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
