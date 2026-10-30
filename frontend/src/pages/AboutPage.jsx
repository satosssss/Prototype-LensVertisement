import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    heading: 'Mission',
    body: 'MindLens exists to make persuasion visible. Most advertising works by borrowing established psychological effects — scarcity, social proof, authority, emotional framing — and presenting them as ordinary information. Naming those techniques is the first step toward evaluating them.',
  },
  {
    heading: 'Methodology',
    body: 'An advertisement is uploaded as an image or text. The server validates and accepts it, then (from Milestone 2) sends it to a multimodal Gemini model that returns a structured list of techniques with the evidence behind each one. A separate Psychology & Media Literacy Engine, written by this team, maps those techniques to established concepts and generates the educational explanations and reflection questions. The AI identifies; our engine interprets.',
  },
  {
    heading: 'What is measured, and what is inferred',
    body: 'Every result separates four things: what the advertisement visibly contains, what the AI identified, what established psychology suggests may follow, and what cannot be concluded from the advertisement alone. Cognitive-impact indicators are labelled as estimated educational indicators. They are derived from a documented rubric, not from any measurement of a person.',
  },
  {
    heading: 'Limitations',
    body: 'MindLens does not read minds, measure brain activity, diagnose conditions, or predict an individual response. It cannot prove manipulation occurred. An advertisement that uses a technique is not automatically unethical, and a technique MindLens misses is not evidence that the ad is honest. Cultural context, language, and audience differ, and the analysis inherits the model\u2019s errors.',
  },
];

/**
 * AboutPage
 * Mission, method and the limits — the page a judge will read to decide
 * whether the project understands its own claims.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-teal-700">
          About
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Media literacy, built on honest claims
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-600">
          MindLens is an educational tool for the UNESCO Youth Hackathon 2026. It
          explains how advertisements persuade — and teaches people to evaluate them
          independently.
        </p>
      </header>

      <div className="space-y-6">
        {SECTIONS.map(({ heading, body }) => (
          <section key={heading} aria-labelledby={`s-${heading}`}>
            <h2 id={`s-${heading}`} className="text-base font-semibold text-stone-900">
              {heading}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{body}</p>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-sm font-semibold text-stone-900">Team</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
          Built by a three-person Computer Science student team for the UNESCO Youth
          Hackathon 2026.
        </p>
      </section>

      <Link
        to="/analyze"
        className="mt-8 inline-flex rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
      >
        Analyze an advertisement
      </Link>
    </div>
  );
}
