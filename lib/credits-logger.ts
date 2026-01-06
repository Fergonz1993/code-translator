// ===== CREDITS LOGGING =====
// Structured logging helpers for credit consumption/refunds.

export type CreditLogEntry = {
  event: "credits";
  action: "consume" | "refund";
  requestId: string;
  amount: number;
  source: string;
  remaining: number;
};

export function buildCreditsLog(entry: CreditLogEntry) {
  return {
    event: entry.event,
    action: entry.action,
    requestId: entry.requestId,
    amount: entry.amount,
    source: entry.source,
    remaining: entry.remaining,
  };
}

export function logCreditsEvent(entry: CreditLogEntry) {
  const payload = buildCreditsLog(entry);
  console.info(JSON.stringify(payload));
}
