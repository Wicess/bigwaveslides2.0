import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin · Big Wave Slides", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Root layout for the (non-localized) admin area. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-muted/30 antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
