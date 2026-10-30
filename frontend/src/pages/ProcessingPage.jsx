import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAnalysis } from '../context/AnalysisContext.jsx';

/**
 * ProcessingPage
 * Shown while the single analysis request is in flight.
 *
 * There are no fake pipeline stages here on purpose: the app performs one
 * request, so a rotating list of invented "steps" would be theatre. Instead we
 * show the real status and an elapsed clock, then move on when the request
 * actually finishes.
 */
export default function ProcessingPage() {
  const navigate = useNavigate();
  const { status, error } = useAnalysis();
  const [elapsed, setElapsed] = useState(0);

  // Advance only when the request genuinely resolves.
  useEffect(() => {
    if (status === 'done') navigate('/results', { replace: true });
  }, [status, navigate]);

  // Landing here directly (refresh, bookmark) means there is nothing to wait for.
  useEffect(() => {
    if (status === 'idle') navigate('/analyze', { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (status !== 'uploading') return undefined;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h1 className="text-base font-semibold text-red-900">
                The analysis could not be completed
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-red-800">
                {error?.message || 'An unexpected error occurred.'}
              </p>
              {error?.status ? (
                <p className="mt-1 text-xs text-red-700">Server status: {error.status}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/analyze"
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
            >
              Try again
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <LoaderCircle
        className="h-12 w-12 animate-spin text-teal-700"
        aria-hidden="true"
      />
      <h1 className="mt-6 text-lg font-semibold text-stone-900">
        Analysing your advertisement
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
        Gemini is reading the advertisement and checking which persuasive
        techniques it can point to evidence for. This usually takes a few
        seconds; the free tier can be slower when it is busy.
      </p>
      <p className="mt-4 text-xs tabular-nums text-stone-400">
        {elapsed}s elapsed
      </p>
    </div>
  );
}
