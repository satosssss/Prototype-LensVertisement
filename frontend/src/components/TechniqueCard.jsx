import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';

/**
 * How certain the AI said it was. This is a statement about the *model's
 * confidence in its own reading of the ad* — deliberately NOT a score for how
 * "manipulative" or psychologically powerful a technique is. We have no
 * measurement that would justify a number like that.
 */
const CONFIDENCE_STYLES = {
  high: 'bg-teal-50 text-teal-800 border-teal-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-stone-100 text-stone-600 border-stone-300',
};

/**
 * TechniqueCard
 * Renders one detected persuasive technique.
 *
 * Expected shape (produced by Gemini in Milestone 2, validated by the
 * Psychology Engine in Milestone 3):
 * {
 *   name: string,
 *   evidence: string,            // what in the ad supports this
 *   explanation: string,         // why it works, in plain language
 *   psychologyConcept: string,   // e.g. "Scarcity principle"
 *   possibleEffect: string,      // what may be encouraged
 *   confidence?: 'high'|'medium'|'low',
 *   reflectionQuestion?: string  // critical-thinking prompt
 * }
 */
export default function TechniqueCard({ technique }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const confidence = technique.confidence
    ? CONFIDENCE_STYLES[technique.confidence] ?? CONFIDENCE_STYLES.low
    : null;

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-stone-50"
        >
          <span className="min-w-0 flex-1">
            <span className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">
                {technique.name}
              </span>
              {confidence && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${confidence}`}
                  title="How confident the AI is in this reading — not a measure of psychological impact"
                >
                  AI confidence: {technique.confidence}
                </span>
              )}
            </span>

            {technique.evidence && (
              <span className="inline-block rounded border-l-2 border-amber-400 bg-amber-50 px-2 py-1 text-xs leading-relaxed text-stone-700">
                “{technique.evidence}”
              </span>
            )}
          </span>

          {open ? (
            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          )}
        </button>
      </h3>

      {open && (
        <div id={panelId} className="space-y-3 border-t border-stone-100 px-4 py-4">
          {technique.explanation && (
            <p className="text-sm leading-relaxed text-stone-600">
              {technique.explanation}
            </p>
          )}

          <dl className="grid gap-3 sm:grid-cols-2">
            {technique.psychologyConcept && (
              <div className="rounded-lg bg-stone-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Related concept
                </dt>
                <dd className="mt-0.5 text-sm text-stone-800">
                  {technique.psychologyConcept}
                </dd>
              </div>
            )}

            {technique.possibleEffect && (
              <div className="rounded-lg bg-stone-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Possible effect
                </dt>
                <dd className="mt-0.5 text-sm text-stone-800">
                  {technique.possibleEffect}
                </dd>
              </div>
            )}
          </dl>

          {technique.reflectionQuestion && (
            <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-teal-800">
                Ask yourself
              </p>
              <p className="text-sm leading-relaxed text-teal-900">
                {technique.reflectionQuestion}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
