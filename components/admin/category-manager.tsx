"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { saveCategory, deleteCategory } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type CategoryItem = {
  id: string;
  nameEn: string;
  nameFr: string;
  slug: string;
  order: number;
  productCount: number;
};

const EMPTY = { id: "", nameEn: "", nameFr: "", slug: "", order: "" };

export function CategoryManager({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState(EMPTY);
  const editing = Boolean(v.id);

  const reset = () => setV(EMPTY);

  const startEdit = (c: CategoryItem) => {
    setV({ id: c.id, nameEn: c.nameEn, nameFr: c.nameFr, slug: c.slug, order: String(c.order) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveCategory({
        id: v.id || undefined,
        nameEn: v.nameEn,
        nameFr: v.nameFr,
        slug: v.slug,
        order: v.order,
      });
      if (res.ok) {
        toast.success(editing ? "Category updated" : "Category added");
        reset();
        router.refresh();
      } else {
        toast.error(res.error ?? "Save failed");
      }
    });
  };

  const remove = (c: CategoryItem) => {
    if (!confirm(`Delete "${c.nameEn}"?`)) return;
    start(async () => {
      const res = await deleteCategory(c.id);
      if (res.ok) {
        toast.success("Category deleted");
        if (v.id === c.id) reset();
        router.refresh();
      } else {
        toast.error(res.error ?? "Delete failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden p-0">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{c.nameEn}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">/{c.slug}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.productCount} products</span>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    aria-label={`Edit ${c.nameEn}`}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    aria-label={`Delete ${c.nameEn}`}
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

      <Card className="h-fit p-5 lg:sticky lg:top-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{editing ? "Edit category" : "Add category"}</h2>
          {editing ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Cancel
            </button>
          ) : null}
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <Input placeholder="Name (EN)" value={v.nameEn} onChange={(e) => setV({ ...v, nameEn: e.target.value })} required />
          <Input placeholder="Name (FR)" value={v.nameFr} onChange={(e) => setV({ ...v, nameFr: e.target.value })} required />
          <Input placeholder="slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} required />
          <Input type="number" placeholder="Order" value={v.order} onChange={(e) => setV({ ...v, order: e.target.value })} />
          <Button type="submit" variant="gradient" loading={pending} className="w-full">
            {pending ? "Saving…" : editing ? "Save changes" : (
              <>
                <Plus className="size-4" /> Add category
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
