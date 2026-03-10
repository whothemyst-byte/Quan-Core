export type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING";

export interface PlanLimits {
  specialistSlots: number | null;
  dailyRunLimit: number | null;
  historyDays: number;
  fullFlowchart: boolean;
}

export interface PlanModelPolicy {
  ceo: string;
  manager: string;
  specialist: string;
}
