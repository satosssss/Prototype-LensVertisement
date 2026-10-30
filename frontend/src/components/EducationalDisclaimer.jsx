import { Info } from 'lucide-react';

/**
 * EducationalDisclaimer
 * The honesty contract, in the UI. Rendered wherever analysis output appears,
 * so a reader can never mistake an interpretation for a measurement.
 *
 * Keep this wording aligned with the project's scientific and ethical
 * guidelines — it is not decorative copy.
 */
export default function EducationalDisclaimer({ className = '' }) {
  return (
    <aside
      className={`rounded-xl border border-stone-300 bg-stone-50 p-4 ${className}`}
      aria-labelledby="disclaimer-heading"
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
        <div className="space-y-1.5">
          <h2 id="disclaimer-heading" className="text-sm font-semibold text-stone-800">
            What MindLens can and cannot tell you
          </h2>
          <p className="text-sm leading-relaxed text-stone-600">
            MindLens describes techniques that appear{' '}
            <em>in an advertisement</em> and connects them to established psychological
            concepts. That connection is educational: it suggests what{' '}
            <em>may</em> be encouraged, not what a given person actually feels or
            decides. MindLens does not measure brain activity, read minds, diagnose
            conditions, or prove that an advertisement manipulated anyone.
          </p>
        </div>
      </div>
    </aside>
  );
}
