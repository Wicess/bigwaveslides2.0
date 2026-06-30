// whatsapp-fab.tsx
// A floating "chat on WhatsApp" button (FAB = Floating Action Button) fixed to
// the bottom-left corner. Clicking it opens a WhatsApp conversation with the
// business, optionally pre-filled with a message.

"use client";

// Inputs: the business phone number, an accessible label, and an optional
// pre-written message.
type WhatsAppFabProps = {
  phone?: string;
  label: string;
  message?: string;
};

/** Floating WhatsApp click-to-chat button (bottom-left). */
export function WhatsAppFab({ phone, label, message }: WhatsAppFabProps) {
  // No phone configured -> render nothing (hide the button entirely).
  if (!phone) return null;
  // WhatsApp links need digits only, so strip spaces, "+", dashes, etc.
  const digits = phone.replace(/[^0-9]/g, "");
  // Build the wa.me link. If a message was provided, add it as a URL-encoded
  // ?text= so it appears pre-typed in the chat box.
  const href = `https://wa.me/${digits}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    // target="_blank" opens WhatsApp in a new tab; rel="noopener noreferrer"
    // is the standard security practice for external links.
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-20 left-3 z-50 flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-white shadow-[0_10px_30px_-8px_rgba(16,142,86,0.7)] ring-1 ring-white/15 transition-transform duration-200 hover:scale-[1.04] [background:linear-gradient(135deg,#3ad07f_0%,#22b06a_45%,#109e5e_100%)] sm:bottom-6 sm:left-6 sm:gap-2.5 sm:py-2.5 sm:pl-2.5 sm:pr-5"
    >
      {/* Left badge with the three randomly-jiggling "typing" dots. */}
      <span className="flex size-6 items-center justify-center gap-[2px] rounded-full bg-white/20 shadow-inner sm:size-9 sm:gap-[3px]">
        <span className="size-1 rounded-full bg-white animate-wa-dot-1 sm:size-1.5" />
        <span className="size-1 rounded-full bg-white animate-wa-dot-2 sm:size-1.5" />
        <span className="size-1 rounded-full bg-white animate-wa-dot-3 sm:size-1.5" />
      </span>

      {/* Label: bold call-to-action with a quieter "on WhatsApp" subline
          (subline hidden on mobile to keep the button compact). */}
      <span className="text-left leading-none">
        <span className="block text-[11px] font-extrabold uppercase tracking-wide sm:text-sm">
          Chat now
        </span>
        <span className="mt-1 hidden text-[10px] font-medium tracking-wide text-white/85 sm:block">
          on WhatsApp
        </span>
      </span>
    </a>
  );
}
