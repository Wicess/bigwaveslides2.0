"use client";

import { MessageCircle } from "lucide-react";

type WhatsAppFabProps = {
  phone?: string;
  label: string;
  message?: string;
};

/** Floating WhatsApp click-to-chat button (bottom-left). */
export function WhatsAppFab({ phone, label, message }: WhatsAppFabProps) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  const href = `https://wa.me/${digits}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
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
