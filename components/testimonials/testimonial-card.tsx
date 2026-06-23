import { Quote } from "lucide-react";
import { getLocalized } from "@/lib/localized";
import { Stars } from "@/components/ui/stars";
import { Card } from "@/components/ui/card";
import type { TestimonialCardData } from "@/server/data/testimonials";

export function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: TestimonialCardData;
  locale: string;
}) {
  const quote = getLocalized(testimonial.quote, locale);
  const initials = testimonial.authorName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Quote className="size-7 text-primary/30" aria-hidden />
      <Stars rating={testimonial.rating} size="size-4" />
      <p className="flex-1 text-pretty text-muted-foreground">“{quote}”</p>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        {testimonial.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.avatar}
            alt=""
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-[image:var(--gradient-wave)] text-sm font-bold text-white">
            {initials}
          </span>
        )}
        <div>
          <p className="font-semibold">{testimonial.authorName}</p>
          {testimonial.authorRole || testimonial.organization ? (
            <p className="text-xs text-muted-foreground">
              {[testimonial.authorRole, testimonial.organization]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
