"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() => {
        if (!confirm("Delete this product? This cannot be undone.")) return;
        startTransition(async () => {
          const res = await deleteProduct(id);
          if (res.ok) {
            toast.success("Product deleted");
            router.push("/admin/products");
            router.refresh();
          } else {
            toast.error(res.error ?? "Delete failed");
          }
        });
      }}
      className="text-red-600 hover:border-red-300"
    >
      <Trash2 className="size-4" /> Delete
    </Button>
  );
}
