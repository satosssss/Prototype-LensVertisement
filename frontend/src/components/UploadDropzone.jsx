import { ImagePlus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { ALLOWED_IMAGE_LABEL, ALLOWED_IMAGE_TYPES } from '../constants.js';

/**
 * UploadDropzone
 * Presentational file picker with drag-and-drop, preview and removal.
 * It does NOT validate — the parent validates and passes an error down, so
 * there is one place that decides what a valid advertisement is.
 *
 * @param {object} props
 * @param {File|null} props.file
 * @param {string|null} props.previewUrl - object URL for the selected image
 * @param {(file: File) => void} props.onSelect
 * @param {() => void} props.onClear
 * @param {string|null} props.error
 * @param {boolean} props.disabled
 */
export default function UploadDropzone({
  file,
  previewUrl,
  onSelect,
  onClear,
  error,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList) => {
    const next = fileList?.[0];
    if (next) onSelect(next);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  // --- Selected state: show the preview -------------------------------------
  if (file) {
    return (
      <div className="rounded-2xl border border-stone-300 bg-white p-4">
        <div className="flex items-start gap-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview of the selected advertisement"
              className="h-24 w-24 shrink-0 rounded-lg border border-stone-200 object-cover"
            />
          ) : (
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-lg border border-stone-200 bg-stone-100">
              <ImagePlus className="h-6 w-6 text-stone-400" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900" title={file.name}>
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        </div>

        {/* Hidden input kept mounted so "Replace" can reopen the picker. */}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
      </div>
    );
  }

  // --- Empty state: the dropzone itself -------------------------------------
  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging
            ? 'border-teal-500 bg-teal-50'
            : error
              ? 'border-red-300 bg-red-50/40'
              : 'border-stone-300 bg-white hover:border-teal-400 hover:bg-teal-50/50',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <span className="grid h-12 w-12 place-items-center rounded-full bg-stone-100">
          <Upload className="h-5 w-5 text-stone-500" aria-hidden="true" />
        </span>

        <span className="text-sm font-medium text-stone-800">
          Choose an advertisement image
        </span>
        <span className="text-xs text-stone-500">
          Drag and drop, or click to browse · {ALLOWED_IMAGE_LABEL}
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
