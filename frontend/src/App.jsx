import { useState } from "react";
import UploadScreen from "./components/UploadScreen";
import AnalyzingScreen from "./components/AnalyzingScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const [stage, setStage] = useState("upload");
  const [fileName, setFileName] = useState(null);

  const handleAnalyze = () => {
    setStage("analyzing");
    setTimeout(() => setStage("results"), 3200);
  };

  const handleReset = () => {
    setStage("upload");
    setFileName(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-6">
      <div 
        className="w-full max-w-sm bg-stone-50 rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden"
        style={{ height: "680px" }}
      >
        {stage === "upload" && (
          <UploadScreen 
            fileName={fileName} 
            onFileSelect={setFileName} 
            onAnalyze={handleAnalyze} 
          />
        )}

        {stage === "analyzing" && (
          <AnalyzingScreen />
        )}

        {stage === "results" && (
          <ResultsScreen 
            fileName={fileName} 
            onReset={handleReset} 
          />
        )}
      </div>
    </div>
  );
}
