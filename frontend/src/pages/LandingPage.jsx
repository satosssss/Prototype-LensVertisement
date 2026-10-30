import { ArrowRight, Lightbulb, ScanSearch, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    icon: ScanSearch,
    title: '1. Add an advertisement',
    body: 'Upload an ad image or paste its text. Nothing is stored permanently.',
  },
  {
    icon: Lightbulb,
    title: '2. See the techniques',
    body: 'MindLens points to the specific words and visuals behind each persuasive technique.',
  },
  {
    icon: ShieldCheck,
    title: '3. Learn to question it',
    body: 'Each finding comes with the psychology behind it and a question to ask yourself.',
  },
];

/**
 * LandingPage
 * Explains what MindLens is, how it works, and — importantly — what it is not.
 */
export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-teal-700">
          Media literacy, not mind reading
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
          See through the ad.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">
          Advertisements are designed to persuade. MindLens explains{' '}
          <em>how</em> — naming the techniques in an ad, the psychology they draw on,
          and the questions worth asking before you act on it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Analyze an advertisement
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-lg font-semibold text-stone-900">
          How it works
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-stone-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What this is not — the ethical boundary, stated up front */}
      <section
        className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6"
        aria-labelledby="limits-heading"
      >
        <h2 id="limits-heading" className="text-sm font-semibold text-amber-900">
          What MindLens is not
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-900/90">
          MindLens analyses <strong>advertisements</strong>, not people. It cannot
          measure brain activity, detect what you personally feel, diagnose any
          condition, or prove that an ad manipulated someone. Its cognitive-impact
          view is an <strong>estimated educational indicator</strong> based on known
          psychology — never a reading of a real brain or a prediction about you.
        </p>
      </section>
    </div>
  );
}
