"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fileSizeLabel, classNames } from "@/lib/utils";
import { useToast } from "@/components/Toast";

type UploadResult = { path: string; url?: string | null };

/**
 * Drag-and-drop upload area.
 * - mode "api": POSTs FormData {file} to `endpoint` via XHR (progress events).
 *   The endpoint must answer JSON: { path, url? }.
 * - mode "direct": uploads straight to a Supabase bucket path with the
 *   browser client (for public buckets / user-owned folders like avatars).
 */
export default function UploadZone({
  label,
  accept,
  maxSizeMB = 100,
  hint,
  currentFile,
  onUploaded,
  onRemoved,
  ...props
}: {
  label: string;
  accept: string;
  maxSizeMB?: number;
  hint?: string;
  currentFile?: { name: string; size?: number; url?: string } | null;
  onUploaded: (r: UploadResult) => void;
  onRemoved?: () => void;
} & (
  | { mode: "api"; endpoint: string; bucket?: never; path?: never }
  | { mode: "direct"; bucket: string; path: string; endpoint?: never }
)) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum ${maxSizeMB} MB.`);
      return;
    }
    setFileName(file.name);
    setProgress(0);
    try {
      let result: UploadResult;
      if (props.mode === "api") {
        result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", props.endpoint);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error("Invalid server response."));
              }
            } else {
              try {
                const body = JSON.parse(xhr.responseText);
                reject(new Error(body.error || `Upload failed (${xhr.status}).`));
              } catch {
                reject(new Error(`Upload failed (${xhr.status}).`));
              }
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload."));
          const fd = new FormData();
          fd.append("file", file);
          xhr.send(fd);
        });
      } else {
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from(props.bucket)
          .upload(props.path, file, { upsert: true, contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from(props.bucket).getPublicUrl(props.path);
        result = { path: props.path, url: data.publicUrl };
        setProgress(100);
      }
      setProgress(100);
      onUploaded(result);
      toast("File uploaded successfully.", "success");
    } catch (e: any) {
      setError(e?.message || "Upload failed.");
      setProgress(null);
    }
  }

  return (
    <div>
      <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-sand">{label}</p>
      {currentFile && progress === 100 && (
        <div className="mb-3 flex items-center justify-between border border-gold/30 bg-wine/40 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-sans text-sm text-cream">{currentFile.name}</p>
            {typeof currentFile.size === "number" && (
              <p className="font-sans text-xs text-clay">{fileSizeLabel(currentFile.size)}</p>
            )}
          </div>
          {onRemoved && (
            <button
              type="button"
              onClick={() => {
                setProgress(null);
                setFileName(null);
                onRemoved();
              }}
              className="ml-4 shrink-0 font-sans text-xs uppercase tracking-[0.18em] text-ember hover:text-cream"
            >
              Replace
            </button>
          )}
        </div>
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} — drag a file here or click to browse`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className={classNames(
          "flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-gold bg-wine/50" : "border-cream/20 bg-coal hover:border-gold/50"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-gold/80" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <p className="mt-4 font-sans text-sm text-cream">
          Drag & drop your file here, or <span className="text-gold underline underline-offset-4">browse</span>
        </p>
        {hint && <p className="mt-2 font-sans text-xs text-clay">{hint}</p>}
        {fileName && progress !== null && progress < 100 && (
          <p className="mt-2 font-sans text-xs text-sand">{fileName} — {fileSizeLabel(0)}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {progress !== null && progress < 100 && (
        <div className="mt-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-1 w-full bg-cream/10">
            <div className="h-1 bg-gold transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 font-sans text-xs text-sand">Uploading… {progress}%</p>
        </div>
      )}
      {progress === 100 && fileName && (
        <p className="mt-3 font-sans text-xs text-gold">✓ {fileName} uploaded</p>
      )}
      {error && (
        <p className="mt-3 border border-ember/50 bg-ember/10 px-4 py-3 font-sans text-xs text-cream" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
