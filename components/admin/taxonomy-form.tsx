"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTaxonomy } from "@/server/actions/admin-blog";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TaxonomyForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"category" | "tag" | "author">("category");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveTaxonomy({ kind, nameEn, nameFr, slug });
      if (res.ok) {
        toast.success("Saved");
        setNameEn(""); setNameFr(""); setSlug("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Type</span>
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="category">Category</option>
          <option value="tag">Tag</option>
          <option value="author">Author</option>
        </Select>
      </label>
      <Input placeholder={kind === "author" ? "Author name" : "Name (EN)"} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
      {kind !== "author" ? (
        <>
          <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
          <Input placeholder="slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </>
      ) : null}
      <Button type="submit" variant="gradient" loading={pending}>
        {pending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}
