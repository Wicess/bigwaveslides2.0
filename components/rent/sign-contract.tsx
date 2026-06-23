"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signContract } from "@/server/actions/contracts";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignContract({
  contractNumber,
  expectedName,
}: {
  contractNumber: string;
  expectedName?: string;
}) {
  const t = useTranslations("Contract");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(expectedName ?? "");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (name.trim().length < 2) {
      setError(t("nameRequired"));
      return;
    }
    if (!agree) {
      setError(t("agreeRequired"));
      return;
    }
    startTransition(async () => {
      const res = await signContract({ contractNumber, signerName: name.trim(), agree: true });
      if (res.ok) {
        toast.success(t("signedToast"));
        router.refresh();
      } else {
        setError(res.error ?? t("signError"));
      }
    });
  };

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("typeName")}</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("fullNamePlaceholder")}
          autoComplete="name"
        />
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <span>{t("agree")}</span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button onClick={submit} size="lg" variant="gradient" loading={pending} className="w-full sm:w-auto">
        {pending ? t("signing") : t("signNow")}
      </Button>
    </div>
  );
}
