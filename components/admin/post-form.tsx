"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { savePost, deletePost } from "@/server/actions/admin-blog";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type PostFormValues = {
  id?: string;
  titleEn: string;
  titleFr: string;
  slug: string;
  excerptEn: string;
  excerptFr: string;
  contentEn: string;
  contentFr: string;
  coverImage: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  readingMinutes: string;
  featured: boolean;
  authorId: string;
  categoryId: string;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function PostForm({
  defaults,
  authors,
  categories,
}: {
  defaults: PostFormValues;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<PostFormValues>({
    defaultValues: defaults,
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await savePost({ ...values, id: defaults.id });
          if (res.ok) {
            toast.success("Post saved");
            router.push("/admin/blog");
            router.refresh();
          } else {
            toast.error(res.error ?? "Save failed");
          }
        }),
      )}
      className="space-y-6"
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (EN)" error={errors.titleEn?.message}>
          <Input {...register("titleEn", { required: "Required" })} />
        </Field>
        <Field label="Title (FR)" error={errors.titleFr?.message}>
          <Input {...register("titleFr", { required: "Required" })} />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input {...register("slug", { required: "Required" })} />
        </Field>
        <Field label="Cover image URL">
          <Input {...register("coverImage")} placeholder="https://…" />
        </Field>
        <Field label="Status">
          <Select {...register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
        <Field label="Reading minutes">
          <Input type="number" min="1" {...register("readingMinutes")} />
        </Field>
        <Field label="Author">
          <Select {...register("authorId")}>
            <option value="">— None —</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Category">
          <Select {...register("categoryId")}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm sm:col-span-2">
          <input type="checkbox" className="size-4 rounded border-border" {...register("featured")} />
          Featured
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Excerpt (EN)"><Textarea rows={2} {...register("excerptEn")} /></Field>
        <Field label="Excerpt (FR)"><Textarea rows={2} {...register("excerptFr")} /></Field>
        <Field label="Content (EN)"><Textarea rows={8} {...register("contentEn")} /></Field>
        <Field label="Content (FR)"><Textarea rows={8} {...register("contentFr")} /></Field>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="gradient" loading={pending}>
          {pending ? "Saving…" : "Save post"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
          Cancel
        </Button>
        {defaults.id ? (
          <Button
            type="button"
            variant="outline"
            className="ml-auto text-red-600 hover:border-red-300"
            onClick={() => {
              if (!confirm("Delete this post?")) return;
              start(async () => {
                const res = await deletePost(defaults.id!);
                if (res.ok) { toast.success("Deleted"); router.push("/admin/blog"); router.refresh(); }
                else toast.error(res.error ?? "Failed");
              });
            }}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
