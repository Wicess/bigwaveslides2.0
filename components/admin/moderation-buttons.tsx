"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Star, Trash2 } from "lucide-react";
import {
  setReviewStatus,
  deleteReview,
  setTestimonialStatus,
  toggleTestimonialFeatured,
} from "@/server/actions/admin-moderation";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

function IconBtn({
  onClick,
  title,
  className,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ReviewButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Failed");
    });

  return (
    <div className="flex gap-1.5">
      {status !== "APPROVED" ? (
        <IconBtn title="Approve" disabled={pending} className="text-green-600 hover:border-green-300" onClick={() => run(() => setReviewStatus(id, "APPROVED"))}>
          <Check className="size-4" />
        </IconBtn>
      ) : null}
      {status !== "REJECTED" ? (
        <IconBtn title="Reject" disabled={pending} className="text-amber-600 hover:border-amber-300" onClick={() => run(() => setReviewStatus(id, "REJECTED"))}>
          <X className="size-4" />
        </IconBtn>
      ) : null}
      <IconBtn title="Delete" disabled={pending} className="text-red-600 hover:border-red-300" onClick={() => { if (confirm("Delete this review?")) run(() => deleteReview(id)); }}>
        <Trash2 className="size-4" />
      </IconBtn>
    </div>
  );
}

export function TestimonialButtons({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Failed");
    });

  return (
    <div className="flex gap-1.5">
      {status !== "APPROVED" ? (
        <IconBtn title="Approve" disabled={pending} className="text-green-600 hover:border-green-300" onClick={() => run(() => setTestimonialStatus(id, "APPROVED"))}>
          <Check className="size-4" />
        </IconBtn>
      ) : null}
      {status !== "REJECTED" ? (
        <IconBtn title="Reject" disabled={pending} className="text-amber-600 hover:border-amber-300" onClick={() => run(() => setTestimonialStatus(id, "REJECTED"))}>
          <X className="size-4" />
        </IconBtn>
      ) : null}
      <IconBtn title="Toggle featured" disabled={pending} className={featured ? "border-primary text-primary" : ""} onClick={() => run(() => toggleTestimonialFeatured(id))}>
        <Star className={cn("size-4", featured && "fill-current")} />
      </IconBtn>
    </div>
  );
}
