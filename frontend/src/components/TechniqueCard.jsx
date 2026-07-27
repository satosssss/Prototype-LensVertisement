import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const INTENSITY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function TechniqueCard({ technique }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-stone-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-stone-900">{technique.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${INTENSITY_STYLES[technique.intensity]}`}>
              {technique.intensity}
            </span>
          </div>
          <span className="inline-block text-xs text-stone-700 bg-yellow-300 px-1.5 py-0.5 rounded -rotate-1">
            "{technique.quote}"
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3">
          <p className="text-sm text-stone-600 leading-relaxed mb-3">{technique.explanation}</p>
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
            <p className="text-xs font-medium text-teal-800 mb-1">Reflect</p>
            <p className="text-sm text-teal-700">{technique.reflection}</p>
          </div>
        </div>
      )}
    </div>
  );
}