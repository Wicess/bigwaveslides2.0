import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      {/* warm ambient glow on the cocoa canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="admin-pop relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]">
            <Image
              src="/logo.png"
              alt="Big Wave Slides"
              width={200}
              height={170}
              priority
              className="h-9 w-auto brightness-0 invert"
            />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            Big Wave Slides
          </p>
        </div>
        <Card className="p-8">
          <h1 className="font-display text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage the store.</p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </Card>
      </div>
    </main>
  );
}
