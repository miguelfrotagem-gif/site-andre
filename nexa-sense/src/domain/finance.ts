import type { FinancialEstimate, OperationalScenario } from "../types";
export function estimate(
  scenario: OperationalScenario,
  ticket: number,
): FinancialEstimate {
  if (!Number.isFinite(ticket) || ticket < 0 || ticket > 10000)
    throw new Error("Ticket inválido");
  const customers = scenario.finance.additionalCustomers,
    orders = scenario.finance.additionalOrders;
  const associated = Math.round(customers * ticket * 100) / 100;
  return {
    customers,
    ticket,
    orders,
    associated,
    total: Math.round((associated + orders) * 100) / 100,
  };
}
