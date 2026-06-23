"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--radius)] !border-border !bg-background !text-foreground !shadow-[var(--shadow-soft)]",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-white",
        },
      }}
    />
  );
}

export { toast } from "sonner";
