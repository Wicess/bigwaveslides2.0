"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  type: "IMAGE" | "VIDEO" | "MODEL_3D" | string;
  url: string;
  alt?: string;
};

export function ProductGallery({
  items,
  title,
}: {
  items: GalleryItem[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  if (!current) {
    return (
      <div className="aspect-square w-full rounded-[var(--radius-lg)] bg-muted" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-muted">
        {current.type === "VIDEO" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            className="aspect-[4/3] w-full object-cover sm:aspect-square"
          />
        ) : (
          <MediaImage
            src={current.url}
            alt={current.alt || title}
            priority
            rounded={false}
            sizes="(min-width:1024px) 50vw, 100vw"
            className="aspect-[4/3] w-full sm:aspect-square"
          />
        )}
      </div>

      {items.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2 sm:gap-3">
          {items.map((item, i) => (
            <li key={item.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${title} — ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-lg ring-2 transition-all",
                  i === active
                    ? "ring-primary"
                    : "ring-transparent hover:ring-border",
                )}
              >
                {item.type === "VIDEO" ? (
                  <span className="grid size-full place-items-center bg-accent/10 text-accent">
                    <Play className="size-5" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
