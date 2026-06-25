import * as React from "react";
// Slot lets <Button asChild> render its child element instead of a <button>,
// while still applying the button's classes. See the `asChild` notes below.
import { Slot } from "@radix-ui/react-slot";
// cva ("class-variance-authority") builds a function that returns the right
// Tailwind classes for a given combination of `variant` and `size`.
// `VariantProps` derives a TypeScript type for those options automatically.
import { cva, type VariantProps } from "class-variance-authority";
// Loader2 is the spinner icon shown while `loading` is true.
import { Loader2 } from "lucide-react";
// cn merges class strings and resolves Tailwind conflicts (the later class
// wins), so a caller's `className` can safely override the variant defaults.
import { cn } from "@/lib/utils";

/**
 * Button — the shared button used everywhere on the site (CTAs, forms, links
 * styled as buttons, etc.).
 *
 * Two things to know:
 *   - `variant` + `size` choose the look via the cva config below.
 *   - `asChild` makes it wrap an existing element (e.g. a Next.js <Link>)
 *     instead of rendering a real <button>, so links can look like buttons.
 *
 * Usage:
 *   <Button>Book now</Button>
 *   <Button variant="outline" size="lg">Learn more</Button>
 *   <Button asChild><Link href="/contact">Contact</Link></Button>
 */

// cva(baseClasses, { variants, defaultVariants }):
// - first arg = classes applied to every button
// - `variants` = named groups of mutually exclusive style options
// - `defaultVariants` = which option to use when the prop is omitted
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[var(--shadow-glow)] hover:brightness-110",
        gradient:
          "text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)] hover:brightness-110",
        secondary: "bg-accent text-white hover:bg-accent-light",
        outline:
          "border border-border bg-transparent text-foreground hover:border-primary hover:text-primary",
        ghost: "text-foreground hover:bg-muted",
        glass: "glass text-foreground hover:shadow-[var(--shadow-soft)]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

// ButtonProps = all native <button> attributes (onClick, type, disabled, ...)
//   + the `variant`/`size` options from cva (via VariantProps)
//   + our two extras below.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // render the child element instead of a <button>
  loading?: boolean; // show a spinner and disable the button
}

// forwardRef lets a parent attach a `ref` to the underlying DOM node, e.g. to
// focus the button programmatically. The ref is passed through to <Comp> below.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    // Pick the element to render: Slot (clone the child) or a real <button>.
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        // Compute the variant/size classes, then merge any caller className.
        className={cn(buttonVariants({ variant, size }), className)}
        // Disable while loading so it can't be clicked mid-action.
        disabled={disabled || loading}
        // Forward the rest of the props (onClick, type, aria-*, etc.).
        {...props}
      >
        {asChild ? (
          // Slot requires exactly one child, so don't inject the spinner here;
          // just pass the child through.
          children
        ) : (
          // Normal button: optionally show the spinner before the label.
          // <> </> is a Fragment (groups elements without adding a wrapper).
          <>
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
// displayName gives the component a readable name in React DevTools (otherwise
// forwardRef components show up as anonymous).
Button.displayName = "Button";

export { buttonVariants };
