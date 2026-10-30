import { AlertCircle, ArrowRight, Type } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import UploadDropzone from '../components/UploadDropzone.jsx';
import {
  ALLOWED_IMAGE_LABEL,
  ALLOWED_IMAGE_TYPES,
  MAX_TEXT_CHARS,
  MAX_UPLOAD_MB,
} from '../constants.js';
import { useAnalysis } from '../context/AnalysisContext.jsx';

/**
 * UploadPage
 * Collects one advertisement (image or text), validates it client-side for
 * fast feedback, then hands it to the AnalysisContext and moves to the
 * processing screen. The backend re-validates everything — this is UX, not
 * security.
 */
export default function UploadPage() {
  const navigate = useNavigate();
  const { runAnalysis, reset } = useAnalysis();

  const [mode, setMode] = useState('image');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [fileError, setFileError] = useState(null);

  // Fresh visit = fresh analysis. Stale results from a previous run would be
  // confusing when the user lands back here.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Object URLs must be revoked or they leak for the page's lifetime.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSelectFile = (next) => {
    setFileError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(next.type)) {
      setFileError(`That file type isn't supported. Please use ${ALLOWED_IMAGE_LABEL}.`);
      return;
    }

    if (next.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFileError(
        `That image is ${(next.size / 1024 / 1024).toFixed(1)} MB. The maximum is ${MAX_UPLOAD_MB} MB.`
      );
      return;
    }

    setFile(next);
  };

  const handleClear = () => {
    setFile(null);
    setFileError(null);
  };

  const trimmedText = text.trim();
  const canSubmit =
    mode === 'image' ? Boolean(file) && !fileError : trimmedText.length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload =
      mode === 'image'
        ? { type: 'image', file }
        : { type: 'text', text: trimmedText };

    // Start the request, then move on. The processing screen watches status,
    // so no fake timers are needed to decide when to advance.
    runAnalysis(payload);
    navigate('/analyzing');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Analyze an advertisement
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Add an ad as an image or as text. MindLens will describe the persuasive
          techniques it contains and what psychology they draw on.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        {/* Input mode switch */}
        <div
          className="mb-5 inline-flex rounded-xl border border-stone-300 bg-stone-50 p-1"
          role="group"
          aria-label="Advertisement input type"
        >
          <ModeButton active={mode === 'image'} onClick={() => setMode('image')}>
            Image
          </ModeButton>
          <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
            <Type className="h-4 w-4" aria-hidden="true" />
            Text
          </ModeButton>
        </div>

        {mode === 'image' ? (
          <UploadDropzone
            file={file}
            previewUrl={previewUrl}
            onSelect={handleSelectFile}
            onClear={handleClear}
            error={fileError}
          />
        ) : (
          <div>
            <label
              htmlFor="ad-text"
              className="mb-1.5 block text-sm font-medium text-stone-800"
            >
              Advertisement text
            </label>
            <textarea
              id="ad-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_TEXT_CHARS}
              rows={10}
              placeholder="Paste the headline, body copy and call to action…"
              aria-describedby="ad-text-help"
              className="w-full resize-y rounded-xl border border-stone-300 bg-white p-4 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-teal-500"
            />
            <div
              id="ad-text-help"
              className="mt-1.5 flex items-center justify-between text-xs text-stone-500"
            >
              <span>Include the visible wording — headline, claims, and call to action.</span>
              <span className="tabular-nums">
                {text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 sm:w-auto"
        >
          Analyze this ad
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {!canSubmit && (
          <p className="mt-3 flex items-start gap-2 text-xs text-stone-500">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {mode === 'image'
              ? `Choose an image (${ALLOWED_IMAGE_LABEL}, up to ${MAX_UPLOAD_MB} MB) to continue.`
              : 'Enter some advertisement text to continue.'}
          </p>
        )}
      </form>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-white text-stone-900 shadow-sm'
          : 'text-stone-600 hover:text-stone-900',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
