import {
  Eye,
  ListChecks,
  Quote,
  RotateCcw,
  ScanSearch,
  ShieldQuestion,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import EducationalDisclaimer from '../components/EducationalDisclaimer.jsx';
import TechniqueCard from '../components/TechniqueCard.jsx';
import { useAnalysis } from '../context/AnalysisContext.jsx';

/**
 * ResultsPage
 * Renders exactly what the backend returned — nothing invented.
 *
 * The page is organised around the distinction MindLens is built on:
 *
 *   What the ad contains   → extracted text + visual observations (facts)
 *   What the AI identified → techniques, each with its evidence
 *   What psychology says   → inside each card (concept + possible effect)
 *   What cannot be concluded → limitations, always shown
 *
 * If the AI found no techniques, the page says so and explains that absence of
 * evidence is not evidence of absence. It never fills the gap with filler.
 */
export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, meta, input, reset } = useAnalysis();

  // Reaching this URL without a result (refresh, bookmark) has nothing to show.
  if (!result) {
    return <Navigate to="/analyze" replace />;
  }

  const techniques = Array.isArray(result.techniques) ? result.techniques : [];
  const observations = Array.isArray(result.visualObservations)
    ? result.visualObservations
    : [];
  const indicators = Array.isArray(result.targetAudienceIndicators)
    ? result.targetAudienceIndicators
    : [];
  const questions = Array.isArray(result.criticalThinkingQuestions)
    ? result.criticalThinkingQuestions
    : [];
  const limitations = Array.isArray(result.limitations) ? result.limitations : [];

  const isImage = result.analysisType === 'image';
  const hasAdContent = Boolean(result.extractedText) || observations.length > 0;

  const handleReset = () => {
    reset();
    navigate('/analyze');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-teal-700">
          Analysis result
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          {techniques.length > 0
            ? `${techniques.length} persuasive ${techniques.length === 1 ? 'technique' : 'techniques'} detected`
            : 'No persuasive techniques detected'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          {result.adSummary}
        </p>
        <Provenance ai={result.ai} />
      </header>

      {/* 1. What the ad contains — observable facts, no interpretation */}
      {hasAdContent && (
        <section className="mb-8" aria-labelledby="content-heading">
          <SectionHeading
            id="content-heading"
            icon={Eye}
            title="What the ad contains"
            hint="Observed in the advertisement itself"
          />

          {result.extractedText && (
            <div className="mb-3 rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                Text read from the image
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">
                {result.extractedText}
              </p>
            </div>
          )}

          {observations.length > 0 && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {observations.map((item, index) => (
                <div
                  key={`${item.element}-${index}`}
                  className="rounded-xl border border-stone-200 bg-white p-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    {item.element}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-stone-800">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      {/* Text ads have no "what it contains" beyond the text itself, so show
          the submitted preview instead of an empty section. */}
      {!isImage && result.input?.preview && (
        <section className="mb-8" aria-labelledby="submitted-heading">
          <SectionHeading
            id="submitted-heading"
            icon={Quote}
            title="Submitted text"
            hint="What was analysed"
          />
          <blockquote className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-700">
            {result.input.preview}
          </blockquote>
        </section>
      )}

      {/* 2. What the AI identified */}
      <section className="mb-8" aria-labelledby="techniques-heading">
        <SectionHeading
          id="techniques-heading"
          icon={ScanSearch}
          title="What the AI identified"
          hint="Each technique is tied to evidence from the ad"
        />

        {techniques.length > 0 ? (
          <div className="space-y-3">
            {techniques.map((technique, index) => (
              <TechniqueCard key={technique.id ?? `${technique.name}-${index}`} technique={technique} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
            <p className="text-sm font-medium text-stone-800">
              No technique could be evidenced in this advertisement
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
              That is a legitimate result — plenty of advertising is straightforward,
              and MindLens only lists techniques it can point to evidence for. It is
              not proof that none exist: a technique may be present in a form the
              analysis did not recognise.
            </p>
          </div>
        )}
      </section>

      {/* 3. Who the ad appears to address */}
      {indicators.length > 0 && (
        <section className="mb-8" aria-labelledby="audience-heading">
          <SectionHeading
            id="audience-heading"
            icon={Users}
            title="Who the ad appears to address"
            hint="Inferred from the ad's content alone — not a profile of any real person"
          />
          <ul className="space-y-2">
            {indicators.map((item, index) => (
              <li
                key={`${item.indicator}-${index}`}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-stone-900">{item.indicator}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  Evidence: “{item.evidence}”
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Questions worth asking */}
      {questions.length > 0 && (
        <section className="mb-8" aria-labelledby="questions-heading">
          <SectionHeading
            id="questions-heading"
            icon={ListChecks}
            title="Questions worth asking"
            hint="Use these on the next ad you see"
          />
          <ol className="space-y-2">
            {questions.map((question, index) => (
              <li
                key={`${question}-${index}`}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 5. What cannot be concluded */}
      {limitations.length > 0 && (
        <section className="mb-8" aria-labelledby="limits-heading">
          <SectionHeading
            id="limits-heading"
            icon={TriangleAlert}
            title="What this analysis cannot tell you"
            hint="The boundaries of what was actually measured"
          />
          <ul className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            {limitations.map((limitation, index) => (
              <li
                key={`${limitation}-${index}`}
                className="flex gap-2.5 text-sm leading-relaxed text-amber-900 [&:not(:first-child)]:mt-2.5"
              >
                <ShieldQuestion
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                {limitation}
              </li>
            ))}
          </ul>
        </section>
      )}

      <EducationalDisclaimer className="mb-8" />

      {/* Provenance + request metadata, for auditing the pipeline */}
      <section
        className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-4"
        aria-labelledby="meta-heading"
      >
        <h2
          id="meta-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500"
        >
          Request details
        </h2>
        <dl className="grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
          <Meta label="Input">
            {isImage
              ? `${result.input.originalName} · ${result.input.sizeKb} KB`
              : `${result.input.characters.toLocaleString()} characters`}
          </Meta>
          <Meta label="Input type">{input?.type ?? result.analysisType}</Meta>
          {meta?.requestId && (
            <Meta label="Request ID" mono title={meta.requestId}>
              {meta.requestId}
            </Meta>
          )}
          {meta?.processedAt && (
            <Meta label="Processed">{new Date(meta.processedAt).toLocaleString()}</Meta>
          )}
          {meta?.durationMs != null && <Meta label="Server time">{meta.durationMs} ms</Meta>}
        </dl>
      </section>

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

/**
 * Provenance line. The model name is shown on purpose: a reader should be able
 * to see which system produced the interpretation, and that it is the free tier
 * (whose data-use terms differ from the paid tier).
 */
function Provenance({ ai }) {
  if (!ai?.model) return null;

  const seconds = ai.latencyMs ? (ai.latencyMs / 1000).toFixed(1) : null;

  return (
    <p className="mt-3 text-xs text-stone-500">
      Analysed by {ai.provider} ·{' '}
      <span className="font-mono text-stone-600">{ai.model}</span> · free tier
      {seconds ? ` · ${seconds}s` : ''}
    </p>
  );
}

/** Section heading with an icon and a one-line scope hint. */
function SectionHeading({ id, icon: Icon, title, hint }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        <Icon className="h-4 w-4 text-teal-700" aria-hidden="true" />
        {title}
      </h2>
      {hint && <p className="mt-0.5 pl-6 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/** One label/value pair inside the request-details block. */
function Meta({ label, children, mono = false, title }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium text-stone-600">{label}</dt>
      <dd className={`truncate ${mono ? 'font-mono' : ''}`} title={title}>
        {children}
      </dd>
    </div>
  );
}
