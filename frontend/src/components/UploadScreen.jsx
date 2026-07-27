import { Upload, Image as ImageIcon, Search } from "lucide-react";

export default function UploadScreen({ fileName, onFileSelect, onAnalyze }) {
  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-teal-700" />
          <span className="text-xs font-medium tracking-wide text-teal-700 uppercase">
            LensVertisement
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 leading-snug">
          See through the ad.
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Upload an ad and we'll break down the persuasion techniques at play.
        </p>
      </div>

      <label className="flex-1 border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0]?.name)}
        />
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
          {fileName ? (
            <ImageIcon className="w-5 h-5 text-teal-700" />
          ) : (
            <Upload className="w-5 h-5 text-stone-400" />
          )}
        </div>
        {fileName ? (
          <p className="text-sm font-medium text-stone-800 px-6 text-center">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-stone-700">Tap to choose an ad</p>
            <p className="text-xs text-stone-400">Image or video</p>
          </>
        )}
      </label>

      <button
        onClick={onAnalyze}
        disabled={!fileName}
        className="mt-6 w-full bg-stone-900 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-medium py-3 rounded-xl transition-colors"
      >
        Analyze this ad
      </button>
    </div>
  );
}