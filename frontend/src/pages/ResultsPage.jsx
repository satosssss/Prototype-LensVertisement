import { FlaskConical, RotateCcw } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import EducationalDisclaimer from '../components/EducationalDisclaimer.jsx';
import TechniqueCard from '../components/TechniqueCard.jsx';
import { useAnalysis } from '../context/AnalysisContext.jsx';

/**
 * ResultsPage
 * Renders exactly what the backend returned — nothing invented.
 *
 * Until Milestone 2 connects Gemini, the backend reports
 * `analysisStatus: 'not_analyzed'`. This page says so plainly instead of
 * filling the space with fake technique cards.
 */
export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, meta, input, status, reset } = useAnalysis();

  // Reaching this URL without a result (refresh, bookmark) has nothing to show.
  if (!result) {
    return <Navigate to="/analyze" replace />;
  }

  const pending = result.analysisStatus !== 'analyzed';
  const techniques = Array.isArray(result.techniques) ? result.techniques : [];

  const handleReset = () => {
    reset();
    navigate('/analyze');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-teal-700">
          Analysis result
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          {pending ? 'Upload verified' : `${techniques.length} techniques detected`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {pending
            ? 'Your advertisement reached the server intact. The persuasion analysis step is not built yet.'
            : 'Here is what the advertisement contains, and the psychology behind it.'}
        </p>
      </header>

      {/* Honest status banner while AI analysis is unimplemented */}
      {pending && (
        <section
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
          aria-labelledby="pending-heading"
        >
          <div className="flex items-start gap-3">
            <FlaskConical
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <h2 id="pending-heading" className="text-sm font-semibold text-amber-900">
                Pipeline check — no AI analysis yet
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">
                {result.notice}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                No techniques are listed below because none were detected — the
                detector does not exist yet. Nothing on this page is simulated.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* What the server received — facts only */}
      <section className="mb-6" aria-labelledby="input-heading">
        <h2 id="input-heading" className="mb-2 text-sm font-semibold text-stone-900">
          What was received
        </h2>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            {result.analysisType === 'image' ? (
              <>
                <Field label="File name" value={result.input.originalName} breakAll />
                <Field label="Type" value={result.input.mimeType} />
                <Field label="Size" value={`${result.input.sizeKb} KB`} />
              </>
            ) : (
              <>
                <Field label="Characters" value={result.input.characters.toLocaleString()} />
                <Field label="Words" value={result.input.words.toLocaleString()} />
                <Field label="Preview" value={result.input.preview} className="sm:col-span-1" />
              </>
            )}
          </dl>
        </div>
      </section>

      {/* Techniques */}
      <section className="mb-6" aria-labelledby="techniques-heading">
        <h2 id="techniques-heading" className="mb-2 text-sm font-semibold text-stone-900">
          Detected persuasive techniques
        </h2>

        {techniques.length > 0 ? (
          <div className="space-y-3">
            {techniques.map((technique, index) => (
              <TechniqueCard key={`${technique.name}-${index}`} technique={technique} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
            <p className="text-sm font-medium text-stone-700">No analysis to display</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-stone-500">
              Once the Gemini analysis step is connected, this is where each detected
              technique will appear — with the evidence from the ad, the related
              psychological concept, and a question to consider.
            </p>
          </div>
        )}
      </section>

      <EducationalDisclaimer className="mb-6" />

      {/* Request metadata, for debugging the pipeline */}
      {meta && (
        <section
          className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-4"
          aria-labelledby="meta-heading"
        >
          <h2 id="meta-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Request details
          </h2>
          <dl className="grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600">Request ID</dt>
              <dd className="truncate font-mono" title={meta.requestId}>
                {meta.requestId}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600">Processed</dt>
              <dd>{new Date(meta.processedAt).toLocaleString()}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600">Server time</dt>
              <dd>{meta.durationMs} ms</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-stone-600">Input</dt>
              <dd>{input?.type ?? result.analysisType}</dd>
            </div>
          </dl>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Analyze another ad
        </button>
        <Link
          to="/about"
          className="inline-flex items-center rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          About the methodology
        </Link>
      </div>
    </div>
  );
}

/** Small labelled value used in the "what was received" grid. */
function Field({ label, value, breakAll = false, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-stone-900 ${breakAll ? 'break-all' : ''}`}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
