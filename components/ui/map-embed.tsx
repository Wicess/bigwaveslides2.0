import { cn } from "@/lib/utils";

/** Keyless Google Maps embed for a place/address query. */
export function MapEmbed({
  query,
  className,
  title = "Map",
}: {
  query: string;
  className?: string;
  title?: string;
}) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("w-full border-0", className)}
    />
  );
}
