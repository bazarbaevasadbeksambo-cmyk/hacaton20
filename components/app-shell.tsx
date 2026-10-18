"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale";
import { SettingsControls } from "./settings-controls";

/** `short` is the label under the icon in the mobile bottom bar. */
export type NavItem = { href: string; label: string; short?: string; icon: LucideIcon };

type AppShellProps = {
  nav: NavItem[];
  /** Small identity block shown at the top of the desktop sidebar. */
  identity: React.ReactNode;
  /** Extra controls (e.g. log out) next to the language/theme switches. */
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavProps = { nav: NavItem[]; pathname: string | null; label: string };

function isActive(pathname: string | null, href: string, rootHref: string) {
  if (!pathname) return false;
  return href === rootHref ? pathname === href : pathname.startsWith(href);
}

function SideNav({ nav, pathname, label: menuLabel }: NavProps) {
  return (
    <nav className="flex flex-col gap-1" aria-label={menuLabel}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href, nav[0].href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-ink text-on-ink" : "text-ink-soft hover:bg-grid/60 hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNav({ nav, pathname }: NavProps) {
  return (
    <ul className="mx-auto flex max-w-md">
      {nav.map(({ href, label, short, icon: Icon }) => {
        const active = isActive(pathname, href, nav[0].href);
        return (
          <li key={href} className="min-w-0 flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-accent" : "text-ink-soft",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="max-w-full truncate">{short ?? label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL, so it lives behind Suspense; the fallback is the same menu without highlight. */
function WithPathname({
  nav,
  label,
  render,
}: {
  nav: NavItem[];
  label: string;
  render: (props: NavProps) => React.ReactNode;
}) {
  const pathname = usePathname();
  return render({ nav, pathname, label });
}

/** Role layout: sidebar on desktop; top bar + fixed bottom bar on mobile. */
export function AppShell({ nav, identity, actions, children }: AppShellProps) {
  const t = useT();
  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-grid bg-paper/95 p-4 md:flex">
        <Link href="/" className="mb-8 px-2 font-display text-xl font-semibold text-ink">
          Daftar
        </Link>
        <div className="mb-6 px-2">{identity}</div>
        <Suspense fallback={<SideNav nav={nav} pathname={null} label={t.nav.menu} />}>
          <WithPathname nav={nav} label={t.nav.menu} render={SideNav} />
        </Suspense>
        <div className="mt-auto flex flex-col gap-3 px-2">
          {actions}
          <SettingsControls />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-grid bg-paper px-4 py-2 md:hidden">
        <Link href="/" className="font-display text-lg font-semibold text-ink">
          Daftar
        </Link>
        <div className="flex items-center gap-2">
          {actions}
          <SettingsControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10">{children}</main>

      <nav
        aria-label={t.nav.menu}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-grid bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <Suspense fallback={<BottomNav nav={nav} pathname={null} label={t.nav.menu} />}>
          <WithPathname nav={nav} label={t.nav.menu} render={BottomNav} />
        </Suspense>
      </nav>
    </div>
  );
}
