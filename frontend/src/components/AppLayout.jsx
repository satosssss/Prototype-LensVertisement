import { Eye } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

/** Shared nav-link styling; active state is exposed via aria-current too. */
const navLinkClass = ({ isActive }) =>
  [
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-teal-700 text-white'
      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200',
  ].join(' ');

/**
 * AppLayout
 * Header, footer and the skip link. Wraps every route so the chrome is
 * defined once instead of being repeated per page.
 */
export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Keyboard users can jump past the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg text-stone-900"
            aria-label="MindLens home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight">MindLens</span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/analyze" className={navLinkClass}>
              Analyze
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm text-stone-500 sm:px-6">
          <p className="font-medium text-stone-700">
            MindLens explains advertisements, not people.
          </p>
          <p>
            An educational project built for the UNESCO Youth Hackathon 2026. MindLens
            does not measure brain activity, diagnose anyone, or predict how a specific
            person will react to an advertisement.
          </p>
        </div>
      </footer>
    </div>
  );
}
