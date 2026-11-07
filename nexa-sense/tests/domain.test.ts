import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scenarios, defaults } from "../src/data/scenarios";
import {
  counts,
  createState,
  metrics,
  reducer,
  validateSettings,
} from "../src/domain/simulation";
import { getAlerts } from "../src/domain/alerts";
import { estimate } from "../src/domain/finance";
import type { ScenarioId } from "../src/types";
describe("Cenários determinísticos", () => {
  for (const id of Object.keys(scenarios) as ScenarioId[]) {
    it(`${id}: início, etapas protegidas e resultado com 22 mesas`, () => {
      let s = createState(id, defaults, false);
      assert.equal(s.tables.length, 22);
      assert.deepEqual(metrics(s), scenarios[id].initial);
      assert.equal(reducer(s, { type: "advance" }), s);
      assert.equal(reducer(s, { type: "monitor" }), s);
      assert.equal(reducer(s, { type: "register" }), s);
      s = reducer(s, { type: "recommend" });
      assert.equal(s.events.length, 2);
      assert.equal(reducer(s, { type: "recommend" }), s);
      s = reducer(s, { type: "register" });
      assert.equal(s.action?.time, "20:46");
      assert.equal(s.status, "action_registered");
      assert.deepEqual(metrics(s), scenarios[id].initial);
      assert.equal(reducer(s, { type: "register" }), s);
      assert.equal(reducer(s, { type: "advance" }), s);
      s = reducer(s, { type: "monitor" });
      assert.equal(s.status, "monitoring");
      assert.equal(s.measurements.length, 1);
      assert.deepEqual(metrics(s), scenarios[id].initial);
      s = reducer(s, { type: "advance" });
      assert.equal(s.status, "completed");
      assert.deepEqual(metrics(s), scenarios[id].final);
      assert.equal(s.measurements[1].time, "21:01");
      assert.equal(reducer(s, { type: "advance" }), s);
      assert.equal(s.events.length, 5);
      assert.equal(
        Object.values(counts(s.tables)).reduce((a, b) => a + b),
        22,
      );
    });
  }
  it("não mistura os cenários e preserva configurações na troca", () => {
    let s = createState();
    s = reducer(s, { type: "settings", settings: { ...defaults, ticket: 80 } });
    s = reducer(s, { type: "register" });
    s = reducer(s, { type: "start", id: "tables" });
    assert.equal(s.status, "detected");
    assert.equal(s.action, null);
    assert.equal(s.settings.ticket, 80);
    assert.deepEqual(metrics(s), scenarios.tables.initial);
    assert.equal(s.events.length, 1);
  });
  it("edição e restauração do mapa recalculam totais sem reescrever medições", () => {
    let s = createState();
    s = reducer(s, { type: "table", id: 19, status: "available" });
    assert.equal(metrics(s).available, 1);
    assert.equal(metrics(s).needs_preparation, 3);
    assert.equal(s.measurements[0].metrics.needs_preparation, 4);
    assert.equal(s.tables.length, 22);
    s = reducer(s, { type: "resetMap" });
    assert.deepEqual(metrics(s), scenarios.queue.initial);
  });
  it("reinício restaura o cenário principal, configurações são separadas do histórico", () => {
    let s = createState("team");
    s = reducer(s, {
      type: "settings",
      settings: { ...defaults, name: "Bar Teste" },
    });
    s = reducer(s, { type: "clearHistory" });
    assert.equal(s.events.length, 0);
    assert.equal(s.scenarioId, "team");
    s = reducer(s, { type: "reset" });
    assert.equal(s.scenarioId, "queue");
    assert.equal(s.settings.name, "Bar Teste");
    assert.deepEqual(metrics(s), scenarios.queue.initial);
    s = reducer(s, { type: "restoreSettings" });
    assert.deepEqual(s.settings, defaults);
  });
});
describe("Regras de alertas", () => {
  it("usa limites estritos de fila/espera e inclusivo de preparação", () => {
    let s = createState();
    assert.deepEqual(
      getAlerts(s).map((a) => a.id),
      ["service", "preparation"],
    );
    s = reducer(s, {
      type: "settings",
      settings: {
        ...defaults,
        queueLimit: 9,
        waitLimit: 14,
        preparationLimit: 4,
      },
    });
    assert.deepEqual(
      getAlerts(s).map((a) => a.id),
      ["preparation"],
    );
    s = reducer(s, {
      type: "settings",
      settings: { ...s.settings, preparationLimit: 5 },
    });
    assert.equal(getAlerts(s).length, 0);
  });
  it("prioridade aumenta pela espera, sem duplicar fila e espera", () => {
    let s = createState();
    assert.equal(getAlerts(s)[0].priority, "Alta");
    s = reducer(s, {
      type: "settings",
      settings: { ...defaults, waitLimit: 20 },
    });
    assert.equal(getAlerts(s)[0].priority, "Média");
    assert.equal(getAlerts(s).filter((a) => a.id === "service").length, 1);
  });
  it("distribuição aparece somente no cenário apropriado", () => {
    assert.ok(getAlerts(createState("team")).some((a) => a.id === "balance"));
    assert.ok(!getAlerts(createState("queue")).some((a) => a.id === "balance"));
  });
  it("alertas passam por acompanhamento e resolução", () => {
    let s = createState();
    s = reducer(s, { type: "register" });
    assert.ok(getAlerts(s).every((a) => a.status === "following"));
    s = reducer(s, { type: "monitor" });
    s = reducer(s, { type: "advance" });
    assert.ok(getAlerts(s).every((a) => a.status === "resolved"));
  });
});
describe("Finanças e validação", () => {
  it("implementa clientes × ticket + pedidos e recalcula", () => {
    assert.equal(estimate(scenarios.queue, 55).total, 486);
    assert.equal(estimate(scenarios.queue, 80).total, 661);
    assert.equal(estimate(scenarios.queue, 55).associated, 385);
    assert.equal(estimate(scenarios.queue, 0).total, 101);
    assert.equal(estimate(scenarios.tables, 55).total, 210);
    assert.equal(estimate(scenarios.team, 55).total, 225);
    assert.throws(() => estimate(scenarios.queue, NaN));
  });
  it("rejeita valores inválidos, aceita zero nos limites estritos", () => {
    assert.equal(validateSettings(defaults), null);
    for (const invalid of [
      { ticket: -1 },
      { ticket: NaN },
      { name: " " },
      { tableCount: 23 },
      { queueLimit: 1.5 },
      { waitLimit: 121 },
      { preparationLimit: 0 },
    ])
      assert.ok(validateSettings({ ...defaults, ...invalid }));
    assert.equal(
      validateSettings({ ...defaults, ticket: 0, queueLimit: 0, waitLimit: 0 }),
      null,
    );
    const s = createState();
    assert.equal(
      reducer(s, { type: "settings", settings: { ...defaults, ticket: -10 } }),
      s,
    );
  });
});

describe("Persistência local segura", () => {
  it("restaura estado válido incluindo medições, tabelas manuais e preferências", () => {
    let s = createState("tables");
    s = reducer(s, { type: "table", id: 1, status: "available" });
    s = reducer(s, {
      type: "settings",
      settings: { ...defaults, name: "Bar Teste" },
    });
    assert.deepEqual(restoreState(JSON.stringify(s)), s);
    s = reducer(s, { type: "register" });
    s = reducer(s, { type: "monitor" });
    s = reducer(s, { type: "advance" });
    assert.deepEqual(restoreState(JSON.stringify(s)), s);
  });
  it("recupera dados inválidos ou antigos sem quebrar o aplicativo", () => {
    for (const raw of [
      null,
      "{broken",
      "null",
      "{}",
      JSON.stringify({ ...createState(), version: 0 }),
      JSON.stringify({ ...createState(), tables: [] }),
      JSON.stringify({
        ...createState(),
        measurements: [
          {
            time: "20:43",
            metrics: { occupied: 18, available: 0, needs_preparation: 4 },
          },
        ],
      }),
      JSON.stringify({ ...createState(), status: "completed" }),
    ])
      assert.deepEqual(restoreState(raw), createState());
  });
});
import { restoreState } from "../src/domain/storage";
