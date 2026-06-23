import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section";

/** Header band for inner pages. Top padding clears the fixed site header. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border pb-10 pt-28 sm:pt-32 lg:pb-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 60% at 80% 0%, rgba(0,212,255,0.14), transparent 70%)",
        }}
      />
      <Container>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
