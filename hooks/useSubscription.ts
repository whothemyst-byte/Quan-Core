"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/types/subscription";

export function useSubscription() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/agents")
      .then(async (response) => {
        const data = (await response.json()) as { plan?: SubscriptionPlan };
        if (!response.ok) {
          throw new Error("Unauthorized");
        }
        return data;
      })
      .then((data) => {
        if (isMounted && data.plan) {
          setPlan(data.plan);
          setAuthenticated(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlan(null);
          setAuthenticated(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { plan, authenticated };
}
