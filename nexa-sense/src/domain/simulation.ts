import { defaults, simulatedProvider } from "../data/scenarios";
import type {
  Metrics,
  ScenarioId,
  Settings,
  SimulationState,
  Table,
  TableStatus,
} from "../types";
export function makeTables(metrics: Metrics, time = "20:43"): Table[] {
  return Array.from({ length: 22 }, (_, i) => ({
    id: i + 1,
    status:
      i < metrics.occupied
        ? "occupied"
        : i < metrics.occupied + metrics.needs_preparation
          ? "needs_preparation"
          : "available",
    sector:
      i >= 16
        ? "Próximo à entrada"
        : i % 4 < 2
          ? "Salão principal"
          : "Salão lateral",
    changedAt: time,
  }));
}
export function counts(tables: Table[]) {
  return tables.reduce((a, t) => ({ ...a, [t.status]: a[t.status] + 1 }), {
    occupied: 0,
    needs_preparation: 0,
    available: 0,
  });
}
export function metrics(state: SimulationState): Metrics {
  return { ...state.measurements.at(-1)!.metrics, ...counts(state.tables) };
}
export function currentTime(state: SimulationState) {
  return state.status === "completed"
    ? "21:01"
    : state.action
      ? "20:46"
      : "20:43";
}
export function createState(
  id: ScenarioId = "queue",
  settings: Settings = { ...defaults },
  showRecommendation = true,
): SimulationState {
  const scenario = simulatedProvider.getScenario(id);
  return {
    version: 1,
    scenarioId: id,
    status: "detected",
    recommendationShown: showRecommendation,
    tables: makeTables(scenario.initial),
    measurements: [{ time: "20:43", metrics: { ...scenario.initial } }],
    events: [
      {
        id: "detected",
        time: "20:43",
        title: "Situação identificada",
        detail: scenario.title,
      },
      ...(showRecommendation
        ? [
            {
              id: "recommendation",
              time: "20:43",
              title: "Recomendação apresentada",
              detail: scenario.recommendation.description,
            },
          ]
        : []),
    ],
    action: null,
    settings,
  };
}
export function validateSettings(s: Settings): string | null {
  if (!s.name.trim() || s.name.trim().length > 60)
    return "Informe um nome entre 1 e 60 caracteres.";
  if (s.tableCount !== 22)
    return "Os cenários desta versão usam exatamente 22 mesas.";
  if (!Number.isFinite(s.ticket) || s.ticket < 0 || s.ticket > 10000)
    return "O ticket deve estar entre R$ 0 e R$ 10.000.";
  if (!Number.isInteger(s.queueLimit) || s.queueLimit < 0 || s.queueLimit > 100)
    return "O limite de fila deve ser inteiro entre 0 e 100.";
  if (!Number.isInteger(s.waitLimit) || s.waitLimit < 0 || s.waitLimit > 120)
    return "O limite de espera deve ser inteiro entre 0 e 120.";
  if (
    !Number.isInteger(s.preparationLimit) ||
    s.preparationLimit < 1 ||
    s.preparationLimit > 22
  )
    return "O limite de preparação deve ser inteiro entre 1 e 22.";
  return null;
}
export type SimulationAction =
  | { type: "start"; id: ScenarioId }
  | { type: "recommend" }
  | { type: "register" }
  | { type: "monitor" }
  | { type: "advance" }
  | { type: "table"; id: number; status: TableStatus }
  | { type: "resetMap" }
  | { type: "settings"; settings: Settings }
  | { type: "restoreSettings" }
  | { type: "reset" }
  | { type: "clearHistory" };
export function reducer(
  s: SimulationState,
  a: SimulationAction,
): SimulationState {
  const scenario = simulatedProvider.getScenario(s.scenarioId);
  switch (a.type) {
    case "start":
      return createState(a.id, s.settings, false);
    case "recommend":
      return s.status === "detected" && !s.recommendationShown
        ? {
            ...s,
            recommendationShown: true,
            events: [
              ...s.events,
              {
                id: "recommendation",
                time: "20:43",
                title: "Recomendação apresentada",
                detail: scenario.recommendation.description,
              },
            ],
          }
        : s;
    case "register":
      return s.status === "detected" && s.recommendationShown
        ? {
            ...s,
            status: "action_registered",
            action: {
              time: "20:46",
              description: scenario.recommendation.description,
            },
            events: [
              ...s.events,
              {
                id: "action",
                time: "20:46",
                title: "Ação registrada pelo gerente",
                detail:
                  "A execução foi confirmada para esta demonstração. Indicadores ainda sem nova medição.",
              },
            ],
          }
        : s;
    case "monitor":
      return s.status === "action_registered"
        ? {
            ...s,
            status: "monitoring",
            events: [
              ...s.events,
              {
                id: "monitoring",
                time: "20:46",
                title: "Acompanhamento iniciado",
                detail: "Aguardando o avanço de 15 minutos simulados.",
              },
            ],
          }
        : s;
    case "advance":
      return s.status === "monitoring"
        ? {
            ...s,
            status: "completed",
            tables: makeTables(scenario.final, "21:01"),
            measurements: [
              ...s.measurements,
              { time: "21:01", metrics: { ...scenario.final } },
            ],
            events: [
              ...s.events,
              {
                id: "result",
                time: "21:01",
                title: "Resultado disponível",
                detail:
                  "Nova medição demonstrativa após 15 minutos de acompanhamento.",
              },
            ],
          }
        : s;
    case "table":
      return s.tables.some((t) => t.id === a.id) &&
        ["occupied", "available", "needs_preparation"].includes(a.status)
        ? {
            ...s,
            tables: s.tables.map((t) =>
              t.id === a.id
                ? { ...t, status: a.status, changedAt: currentTime(s) }
                : t,
            ),
          }
        : s;
    case "resetMap":
      return {
        ...s,
        tables: makeTables(
          s.status === "completed" ? scenario.final : scenario.initial,
          currentTime(s),
        ),
      };
    case "settings":
      return validateSettings(a.settings)
        ? s
        : { ...s, settings: { ...a.settings, name: a.settings.name.trim() } };
    case "restoreSettings":
      return { ...s, settings: { ...defaults } };
    case "reset":
      return createState("queue", s.settings);
    case "clearHistory":
      return { ...s, events: [] };
  }
}
