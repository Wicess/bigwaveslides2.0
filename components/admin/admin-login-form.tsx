"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/server/actions/admin-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminLogin({ email, password });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <Input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" size="lg" variant="gradient" loading={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
