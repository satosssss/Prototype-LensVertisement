import { Link } from 'react-router-dom';

/** NotFoundPage — shown for any unmatched route. */
export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-teal-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-2 text-sm text-stone-600">
        That link doesn&apos;t point to a MindLens screen.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Go home
        </Link>
        <Link
          to="/analyze"
          className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Analyze an ad
        </Link>
      </div>
    </div>
  );
}
