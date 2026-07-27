import { useEffect, useState } from "react";

const STEPS = [
  "Reading visual layout...",
  "Cross-referencing persuasion patterns...",
  "Estimating likely emotional effects...",
  "Preparing plain-language summary...",
];

export default function AnalyzingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
      <div className="w-14 h-14 rounded-full border-2 border-stone-200 border-t-teal-600 animate-spin" />
      <p className="text-sm font-medium text-stone-800">Analyzing your ad</p>
      <p className="text-xs text-stone-500">{STEPS[stepIndex]}</p>
    </div>
  );
}