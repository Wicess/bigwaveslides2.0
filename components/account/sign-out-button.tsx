"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutCustomer } from "@/server/actions/account";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOutCustomer();
          router.refresh();
        })
      }
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
    >
      <LogOut className="size-4" />
      {label}
    </button>
  );
}
