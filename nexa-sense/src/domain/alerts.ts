import { scenarios } from "../data/scenarios";
import { metrics } from "./simulation";
import type { Alert, Metrics, SimulationState } from "../types";
function rules(s: SimulationState, m: Metrics): Alert[] {
  const settings = s.settings,
    scenario = scenarios[s.scenarioId],
    alerts: Alert[] = [];
  if (m.queue > settings.queueLimit || m.wait > settings.waitLimit)
    alerts.push({
      id: "service",
      title: "Demora no atendimento",
      priority: m.wait > settings.waitLimit ? "Alta" : "Média",
      sector: "Entrada e salão",
      reason: `${m.queue} pessoas aguardando; espera estimada de ${m.wait} minutos.`,
      recommendation: scenario.recommendation.description,
      status: "pending",
    });
  if (m.needs_preparation >= settings.preparationLimit)
    alerts.push({
      id: "preparation",
      title: "Mesas aguardando preparação",
      priority: "Média",
      sector: "Salão",
      reason: `${m.needs_preparation} mesas precisam de preparação.`,
      recommendation: "Organize a preparação das mesas e coordene a recepção.",
      status: "pending",
    });
  if (scenario.balanceIssue && m.queue > 0 && m.available >= 3)
    alerts.push({
      id: "balance",
      title: "Possível desequilíbrio no atendimento",
      priority: "Média",
      sector: "Entrada, balcão e salão",
      reason: `${m.queue} pessoas aguardam enquanto há ${m.available} mesas preparadas.`,
      recommendation: scenario.recommendation.description,
      status: "pending",
    });
  return alerts;
}
export function getAlerts(s: SimulationState): Alert[] {
  const current = rules(s, metrics(s));
  const original = rules(s, scenarios[s.scenarioId].initial);
  if (s.status === "detected") return current;
  const merged = [
    ...current,
    ...original.filter((a) => !current.some((c) => c.id === a.id)),
  ];
  return merged.map((a) => ({
    ...a,
    status:
      s.status === "completed" && !current.some((c) => c.id === a.id)
        ? "resolved"
        : "following",
  }));
}
