"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, ChevronRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/forms/contact-form";
import { EASE_OUT } from "@/components/motion/variants";

type ContactInfo = {
  email?: string;
  phone?: string;
  address?: string;
  whatsappDigits?: string;
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export function ContactExperience({ info }: { info: ContactInfo }) {
  const t = useTranslations("Contact");
  const reduce = useReducedMotion();

  const tel = info.phone ? `tel:${info.phone.replace(/[^+\d]/g, "")}` : undefined;

  const rows = [
    info.phone
      ? { key: "phone", icon: Phone, label: t("phoneLabel"), value: info.phone, href: tel }
      : null,
    info.email
      ? {
          key: "email",
          icon: Mail,
          label: t("emailLabel"),
          value: info.email,
          href: `mailto:${info.email}`,
        }
      : null,
    info.address
      ? { key: "address", icon: MapPin, label: t("addressLabel"), value: info.address, href: undefined }
      : null,
  ].filter(Boolean) as {
    key: string;
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <section className="relative min-h-[calc(100dvh-7rem)] overflow-hidden bg-background pb-20 pt-10 sm:pt-14">
      {/* Calm, technical background — fine grid + one soft highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_30%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,51,102,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,51,102,0.045) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_82%_-5%,rgba(0,153,255,0.07),transparent_60%)]" />
      </div>

      <Container className="relative">
        {/* Breadcrumb */}
        <motion.nav
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            {t("crumbHome")}
          </Link>
          <ChevronRight className="size-3.5 opacity-60" />
          <span className="text-foreground">{t("crumb")}</span>
        </motion.nav>

        <div className="grid items-start gap-14 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-20">
          {/* ── Left — info ── */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div
              variants={item}
              className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            >
              <span className="h-px w-8 bg-primary/40" />
              {t("infoEyebrow")}
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-6xl"
            >
              {t.rich("infoHeading", {
                hl: (chunks) => <span className="text-primary">{chunks}</span>,
              })}
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground"
            >
              {t("infoLead")}
            </motion.p>

            {/* Contact list — hairline rows */}
            <motion.ul
              variants={stagger}
              className="mt-12 border-t border-border"
            >
              {rows.map((row) => {
                const Icon = row.icon;
                const inner = (
                  <>
                    <Icon className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[15px] font-medium text-foreground">
                        {row.value}
                      </span>
                    </span>
                    {row.href ? (
                      <ArrowUpRight className="ml-auto size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    ) : null}
                  </>
                );
                const cls = "group flex items-center gap-4 border-b border-border py-5";
                return (
                  <motion.li key={row.key} variants={item}>
                    {row.href ? (
                      <a href={row.href} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>

            <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-3">
              {info.whatsappDigits ? (
                <a
                  href={`https://wa.me/${info.whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
                >
                  <MessageCircle className="size-4" />
                  {t("whatsappCta")}
                </a>
              ) : null}
              {tel ? (
                <a
                  href={tel}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
                >
                  <Phone className="size-4" />
                  {t("callCta")}
                </a>
              ) : null}
            </motion.div>
          </motion.div>

          {/* ── Right — form card ── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
            className="rounded-xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-20px_rgba(16,24,40,0.18)] sm:p-8"
          >
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {t("sendTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("sendIntro")}
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
