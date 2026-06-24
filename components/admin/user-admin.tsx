"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  createAdminUser,
  updateAdminUser,
  toggleAdminUser,
} from "@/server/actions/admin-governance";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewUserForm({ roles }: { roles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState({ name: "", email: "", password: "", roleId: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await createAdminUser(v);
      if (res.ok) {
        toast.success("Admin user created");
        setV({ name: "", email: "", password: "", roleId: "" });
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input placeholder="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
      <Input type="email" placeholder="Email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required />
      <Input type="password" placeholder="Temporary password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required />
      <Select value={v.roleId} onChange={(e) => setV({ ...v, roleId: e.target.value })}>
        <option value="">— Role —</option>
        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </Select>
      <Button type="submit" variant="gradient" loading={pending}>
        {pending ? "Creating…" : "Create user"}
      </Button>
    </form>
  );
}

export function EditUserButton({
  user,
  roles,
}: {
  user: { id: string; name: string; email: string; roleId: string | null };
  roles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({
    name: user.name,
    email: user.email,
    password: "",
    roleId: user.roleId ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await updateAdminUser({ id: user.id, ...v });
      if (res.ok) {
        toast.success("User updated");
        setOpen(false);
        setV((s) => ({ ...s, password: "" }));
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label="Edit user">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit admin user</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required />
          <Input type="email" placeholder="Email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required />
          <Input type="password" placeholder="New password (leave blank to keep)" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
          <Select value={v.roleId} onChange={(e) => setV({ ...v, roleId: e.target.value })}>
            <option value="">— Role —</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Button type="submit" variant="gradient" loading={pending} className="w-full">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleUserButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleAdminUser(id);
          if (res.ok) router.refresh();
          else toast.error(res.error ?? "Failed");
        })
      }
    >
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
