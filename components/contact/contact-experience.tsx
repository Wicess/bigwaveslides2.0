"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
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

const leftStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const leftItem: Variants = {
  hidden: { opacity: 0, x: -26 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE_OUT } },
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
      ? {
          key: "address",
          icon: MapPin,
          label: t("addressLabel"),
          value: info.address,
          href: undefined,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <section className="relative overflow-hidden pb-20 pt-8 sm:pt-12">
      {/* ── Smooth layered background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_45%_at_12%_8%,rgba(0,153,255,0.12),transparent_60%),radial-gradient(45%_45%_at_92%_85%,rgba(0,212,255,0.14),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,51,102,0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {!reduce ? (
          <>
            <motion.div
              className="absolute -left-24 top-16 size-80 rounded-full bg-primary/15 blur-3xl"
              animate={{ x: [0, 40, 0], y: [0, 28, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-20 bottom-0 size-96 rounded-full bg-secondary/15 blur-3xl"
              animate={{ x: [0, -36, 0], y: [0, -22, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : null}
      </div>

      <Container className="relative">
        {/* Breadcrumb */}
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="mb-7 flex items-center gap-1 text-xs font-medium text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            {t("crumbHome")}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{t("crumb")}</span>
        </motion.nav>

        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ── Left — info ── */}
          <motion.div variants={leftStagger} initial="hidden" animate="show">
            <motion.span
              variants={leftItem}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-50/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm"
            >
              <Sparkles className="size-3.5" />
              {t("infoEyebrow")}
            </motion.span>

            <motion.h1
              variants={leftItem}
              className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.5rem]"
            >
              {t.rich("infoHeading", {
                hl: (chunks) => (
                  <span className="text-gradient">{chunks}</span>
                ),
              })}
            </motion.h1>

            <motion.p
              variants={leftItem}
              className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              {t("infoLead")}
            </motion.p>

            <motion.ul variants={leftStagger} className="mt-9 grid gap-3">
              {rows.map((row) => {
                const Icon = row.icon;
                const inner = (
                  <>
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_22px_-8px_rgba(0,153,255,0.7)] transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="block truncate text-[15px] font-semibold text-foreground">
                        {row.value}
                      </span>
                    </span>
                    {row.href ? (
                      <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    ) : null}
                  </>
                );
                const cardCls =
                  "group flex items-center gap-4 rounded-2xl border border-border/60 bg-white/70 p-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-[var(--shadow-soft)]";
                return (
                  <motion.li key={row.key} variants={leftItem}>
                    {row.href ? (
                      <a href={row.href} className={cardCls}>
                        {inner}
                      </a>
                    ) : (
                      <div className={cardCls}>{inner}</div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>

            <motion.div variants={leftItem} className="mt-8 flex flex-wrap items-center gap-3">
              {info.whatsappDigits ? (
                <a
                  href={`https://wa.me/${info.whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgba(37,211,102,0.8)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <MessageCircle className="size-4" />
                  {t("whatsappCta")}
                </a>
              ) : null}
              {tel ? (
                <a
                  href={tel}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white/60 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
                >
                  <Phone className="size-4" />
                  {t("callCta")}
                </a>
              ) : null}
            </motion.div>

            <motion.div
              variants={leftItem}
              className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              {t("desc")}
            </motion.div>
          </motion.div>

          {/* ── Right — form card ── */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
            className="relative"
          >
            {/* Glow behind the card */}
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 opacity-60 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/60 bg-white/85 p-6 shadow-[0_30px_70px_-30px_rgba(0,51,102,0.45)] backdrop-blur-md sm:p-8">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
              />
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                {t("sendTitle")}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("sendIntro")}</p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
