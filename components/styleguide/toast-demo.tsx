"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="primary"
        onClick={() =>
          toast.success("Booking request received", {
            description: "We'll email your payment details shortly.",
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Something went wrong", {
            description: "Please try again or contact us on WhatsApp.",
          })
        }
      >
        Error toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast("New quote saved", {
            description: "View it in the admin dashboard.",
            action: { label: "Open", onClick: () => {} },
          })
        }
      >
        With action
      </Button>
    </div>
  );
}
