import { scenarios } from "../data/scenarios";
import { createState, validateSettings } from "./simulation";
import type { SimulationState } from "../types";
export const storageKey = "nexa-sense:v1";
// Local persistence is untrusted input. Invalid or older data restores a safe demo.
export function restoreState(raw: string | null): SimulationState {
  try {
    if (!raw) return createState();
    const s = JSON.parse(raw) as SimulationState;
    if (
      s.version !== 1 ||
      !Object.hasOwn(scenarios, s.scenarioId) ||
      !["detected", "action_registered", "monitoring", "completed"].includes(
        s.status,
      ) ||
      validateSettings(s.settings) ||
      typeof s.recommendationShown !== "boolean"
    )
      return createState();
    if (
      s.tables.length !== 22 ||
      new Set(s.tables.map((t) => t.id)).size !== 22 ||
      s.tables.some(
        (t) =>
          !Number.isInteger(t.id) ||
          t.id < 1 ||
          t.id > 22 ||
          !["occupied", "available", "needs_preparation"].includes(t.status) ||
          typeof t.sector !== "string" ||
          !["20:43", "20:46", "21:01"].includes(t.changedAt),
      )
    )
      return createState();
    const scenario = scenarios[s.scenarioId];
    const expected = [
      scenario.initial,
      ...(s.status === "completed" ? [scenario.final] : []),
    ];
    if (
      s.measurements.length !== expected.length ||
      s.measurements.some(
        (m, i) =>
          m.time !== (i === 0 ? "20:43" : "21:01") ||
          Object.keys(expected[i]).some(
            (key) =>
              m.metrics[key as keyof typeof m.metrics] !==
              expected[i][key as keyof typeof m.metrics],
          ),
      )
    )
      return createState();
    if (
      !Array.isArray(s.events) ||
      s.events.length > 5 ||
      new Set(s.events.map((e) => e.id)).size !== s.events.length ||
      s.events.some(
        (e) =>
          ![
            "detected",
            "recommendation",
            "action",
            "monitoring",
            "result",
          ].includes(e.id) ||
          typeof e.title !== "string" ||
          typeof e.detail !== "string" ||
          !["20:43", "20:46", "21:01"].includes(e.time),
      )
    )
      return createState();
    if (
      (s.status === "detected" && s.action !== null) ||
      (s.status !== "detected" &&
        (!s.recommendationShown ||
          s.action?.time !== "20:46" ||
          s.action?.description !== scenario.recommendation.description))
    )
      return createState();
    return s;
  } catch {
    return createState();
  }
}
