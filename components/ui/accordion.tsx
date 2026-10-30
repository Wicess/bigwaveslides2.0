"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-border border-b", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "hover:text-primary focus-visible:ring-ring flex flex-1 items-center justify-between py-4 text-left text-base font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform duration-300" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

/** False on the server and during hydration, true once hydrated. */
const noopSubscribe = () => () => {};
function useHydrated() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, forceMount, ...props }, ref) => {
  // Radix unmounts closed panels, so the server HTML carried only the answer
  // that starts open. AI crawlers that don't run JavaScript (GPTBot, ClaudeBot,
  // PerplexityBot, OAI-SearchBot) saw 1 of every 4–6 FAQ answers, while the
  // FAQPage schema on the same page listed all of them. Until hydration every
  // panel is mounted and the closed ones are hidden with display:none, so every
  // answer is in the HTML; once hydrated, Radix's normal behaviour and its
  // open/close animation take over unchanged. No visual change.
  const hydrated = useHydrated();
  return (
    <AccordionPrimitive.Content
      ref={ref}
      forceMount={hydrated ? forceMount : true}
      className={cn(
        "text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm",
        !hydrated && "data-[state=closed]:hidden",
      )}
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = "AccordionContent";
