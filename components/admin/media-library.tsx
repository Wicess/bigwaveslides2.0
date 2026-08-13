"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Copy } from "lucide-react";
import { deleteMedia } from "@/server/actions/admin-governance";
import { toast } from "@/components/ui/toaster";
import {
  UploadDropzone,
  type UploadedMedia,
} from "@/components/media/upload-dropzone";

export type MediaItem = {
  id: string;
  url: string;
  type: string;
  mimeType: string | null;
};

export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();

  const onUploaded = (m: UploadedMedia) => {
    setItems((prev) => [
      { id: m.id, url: m.url, type: "IMAGE", mimeType: null },
      ...prev,
    ]);
    router.refresh();
  };

  const remove = (id: string) => {
    if (!confirm("Delete this file? It will be removed from storage.")) return;
    const prev = items;
    setItems((l) => l.filter((i) => i.id !== id));
    start(async () => {
      const res = await deleteMedia(id);
      if (!res.ok) {
        setItems(prev);
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const copy = (url: string) => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success("URL copied"),
      () => toast.error("Copy failed"),
    );
  };

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={onUploaded} folder="library" />

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No media yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="group border-border relative overflow-hidden rounded-[var(--radius-lg)] border"
            >
              <div className="bg-muted aspect-square">
                {m.type === "VIDEO" ? (
                  <video src={m.url} className="size-full object-cover" muted />
                ) : m.type === "DOC" ? (
                  <div className="text-muted-foreground grid size-full place-items-center text-xs">
                    PDF
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => copy(m.url)}
                  aria-label="Copy URL"
                  className="bg-background/90 text-foreground hover:text-primary grid size-7 place-items-center rounded-full"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label="Delete"
                  className="bg-background/90 text-foreground grid size-7 place-items-center rounded-full hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
