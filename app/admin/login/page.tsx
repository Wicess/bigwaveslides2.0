import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-white p-6">
      <div className="admin-pop relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Splash Republic"
            width={200}
            height={170}
            priority
            className="h-16 w-auto"
          />
          <p className="text-muted-foreground mt-3 text-xs font-bold tracking-[0.18em] uppercase">
            Splash Republic
          </p>
        </div>
        <Card className="p-8">
          <h1 className="font-display text-xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
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
