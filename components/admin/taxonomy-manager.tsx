"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { saveTaxonomy, deleteTaxonomy } from "@/server/actions/admin-blog";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Kind = "category" | "tag" | "author";
export type TaxItem = { id: string; nameEn: string; nameFr?: string; slug?: string };
type Groups = Record<Kind, TaxItem[]>;

const TITLES: Record<Kind, string> = {
  category: "Categories",
  tag: "Tags",
  author: "Authors",
};

export function TaxonomyManager({ groups }: { groups: Groups }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind>("category");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");

  const reset = () => {
    setEditingId(null);
    setNameEn("");
    setNameFr("");
    setSlug("");
  };

  const startEdit = (k: Kind, item: TaxItem) => {
    setKind(k);
    setEditingId(item.id);
    setNameEn(item.nameEn);
    setNameFr(item.nameFr ?? "");
    setSlug(item.slug ?? "");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveTaxonomy({
        id: editingId ?? undefined,
        kind,
        nameEn,
        nameFr,
        slug,
      });
      if (res.ok) {
        toast.success(editingId ? "Updated" : "Added");
        reset();
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const remove = (k: Kind, item: TaxItem) => {
    if (!confirm(`Delete "${item.nameEn}"? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteTaxonomy(k, item.id);
      if (res.ok) {
        toast.success("Deleted");
        if (editingId === item.id) reset();
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {(Object.keys(TITLES) as Kind[]).map((k) => (
          <Card key={k} className="p-5">
            <h2 className="mb-3 font-semibold">{TITLES[k]}</h2>
            {groups[k].length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {groups[k].map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="font-medium">{item.nameEn}</span>
                      {item.slug ? (
                        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                          /{item.slug}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(k, item)}
                        aria-label={`Edit ${item.nameEn}`}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(k, item)}
                        aria-label={`Delete ${item.nameEn}`}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card className="h-fit p-5 lg:sticky lg:top-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? "Edit" : "Add"}</h2>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Cancel
            </button>
          ) : null}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Type</span>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              disabled={Boolean(editingId)}
            >
              <option value="category">Category</option>
              <option value="tag">Tag</option>
              <option value="author">Author</option>
            </Select>
          </label>
          <Input
            placeholder={kind === "author" ? "Author name" : "Name (EN)"}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
          {kind !== "author" ? (
            <>
              <Input placeholder="Name (FR)" value={nameFr} onChange={(e) => setNameFr(e.target.value)} />
              <Input placeholder="slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </>
          ) : null}
          <Button type="submit" variant="gradient" loading={pending} className="w-full">
            {pending ? "Saving…" : editingId ? "Save changes" : (
              <>
                <Plus className="size-4" /> Add
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
