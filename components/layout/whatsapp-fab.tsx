// whatsapp-fab.tsx
// A floating "chat on WhatsApp" button (FAB = Floating Action Button) fixed to
// the bottom-left corner. Clicking it opens a WhatsApp conversation with the
// business, optionally pre-filled with a message.

"use client";

import { MessageCircle } from "lucide-react";

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
      className="group fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3.5 pr-4 text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
    >
      <MessageCircle className="size-5" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
