"use client";

import * as React from "react";
import { UploadCloud, ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadedMedia = {
  id: string;
  key: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "DOC";
};

type UploadDropzoneProps = {
  folder?: string;
  accept?: string;
  className?: string;
  onUploaded?: (media: UploadedMedia) => void;
};

type Status = "idle" | "uploading" | "done" | "error";

/** Drag-and-drop uploader → POST /api/media/upload with live progress. */
export function UploadDropzone({
  folder = "uploads",
  accept = "image/*,video/mp4",
  className,
  onUploaded,
}: UploadDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<UploadedMedia | null>(null);

  const upload = React.useCallback(
    (file: File) => {
      setStatus("uploading");
      setProgress(0);
      setError(null);

      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/media/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const media = JSON.parse(xhr.responseText) as UploadedMedia;
          setPreview(media);
          setStatus("done");
          onUploaded?.(media);
        } else {
          let message = "Upload failed";
          try {
            message = JSON.parse(xhr.responseText).error ?? message;
          } catch {
            /* ignore */
          }
          setError(message);
          setStatus("error");
        }
      };
      xhr.onerror = () => {
        setError("Network error");
        setStatus("error");
      };
      xhr.send(body);
    },
    [folder, onUploaded],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors",
          dragging && "border-primary bg-primary-50",
          status === "error" && "border-red-300 bg-red-50",
        )}
      >
        {status === "uploading" ? (
          <>
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading… {progress}%</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : status === "done" && preview ? (
          <>
            <ImageIcon className="size-7 text-primary" />
            <p className="text-sm font-medium">Uploaded</p>
            <p className="max-w-xs truncate text-xs text-muted-foreground">
              {preview.url}
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag &amp; drop, or{" "}
              <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Images or MP4 · up to 25 MB
            </p>
          </>
        )}
      </button>

      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <X className="size-4" /> {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
