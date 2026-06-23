"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCategory } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CategoryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState({ nameEn: "", nameFr: "", slug: "", order: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCategory(v);
      if (res.ok) {
        toast.success("Category saved");
        setV({ nameEn: "", nameFr: "", slug: "", order: "" });
        router.refresh();
      } else {
        toast.error(res.error ?? "Save failed");
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Input placeholder="Name (EN)" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} required />
      <Input placeholder="Name (FR)" value={v.nameFr} onChange={(e) => setV({ ...v, nameFr: e.target.value })} required />
      <Input placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} required />
      <Input type="number" placeholder="Order" value={v.order} onChange={(e) => setV({ ...v, order: e.target.value })} />
      <div className="sm:col-span-2">
        <Button type="submit" variant="gradient" loading={pending}>
          {pending ? "Saving…" : "Add category"}
        </Button>
      </div>
    </form>
  );
}
