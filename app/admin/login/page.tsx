import { redirect } from "next/navigation";
import { Waves } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-primary">
          <Waves className="size-7" />
          <span className="text-lg font-bold">Big Wave Slides</span>
        </div>
        <Card className="p-8">
          <h1 className="text-xl font-bold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage the store.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </Card>
      </div>
    </main>
  );
}
