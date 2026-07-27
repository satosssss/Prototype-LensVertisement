import { RotateCcw } from "lucide-react";
import TechniqueCard from "./TechniqueCard.jsx";
import { MOCK_TECHNIQUES } from "../data/techniques.js";

export default function ResultsScreen({ fileName, onReset }) {
  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-6 overflow-y-auto">
      <div className="mb-5">
        <p className="text-xs text-stone-400 mb-1">{fileName}</p>
        <h1 className="text-xl font-semibold text-stone-900">
          {MOCK_TECHNIQUES.length} techniques detected
        </h1>
        <p className="text-sm text-stone-500 mt-1">Here's what's likely influencing you, and why.</p>
      </div>

      <div className="flex flex-col gap-3">
        {MOCK_TECHNIQUES.map((t) => (
          <TechniqueCard key={t.id} technique={t} />
        ))}
      </div>

      <button
        onClick={onReset}
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-medium text-stone-600 py-3 rounded-xl border border-stone-200"
      >
        <RotateCcw className="w-4 h-4" />
        Analyze another ad
      </button>
    </div>
  );
}