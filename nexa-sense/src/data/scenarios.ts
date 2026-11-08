import type {
  OperationalDataProvider,
  OperationalScenario,
  ScenarioId,
  Settings,
} from "../types";
export const defaults: Settings = {
  name: "Bar do Centro",
  tableCount: 22,
  ticket: 55,
  queueLimit: 6,
  waitLimit: 10,
  preparationLimit: 3,
};
export const scenarios: Record<ScenarioId, OperationalScenario> = {
  queue: {
    id: "queue",
    title: "Fila excessiva",
    description: "A entrada ficou movimentada e a espera começou a crescer.",
    initial: {
      people: 67,
      queue: 9,
      wait: 14,
      occupied: 18,
      needs_preparation: 4,
      available: 0,
    },
    final: {
      people: 69,
      queue: 2,
      wait: 5,
      occupied: 21,
      needs_preparation: 0,
      available: 1,
    },
    recommendation: {
      title: "Reforce a recepção",
      description:
        "Direcionar um funcionário para a entrada e preparar as mesas pendentes.",
    },
    finance: { additionalCustomers: 7, additionalOrders: 101 },
    balanceIssue: false,
    recent: [
      { time: "20:13", people: 55, queue: 4 },
      { time: "20:28", people: 62, queue: 6 },
      { time: "20:43", people: 67, queue: 9 },
    ],
  },
  tables: {
    id: "tables",
    title: "Mesas sem preparação",
    description: "Há espaço no salão, mas as mesas ainda não estão prontas.",
    initial: {
      people: 58,
      queue: 5,
      wait: 8,
      occupied: 16,
      needs_preparation: 6,
      available: 0,
    },
    final: {
      people: 61,
      queue: 3,
      wait: 6,
      occupied: 19,
      needs_preparation: 2,
      available: 1,
    },
    recommendation: {
      title: "Prepare o salão",
      description: "Priorizar preparação das mesas e coordenar a recepção.",
    },
    finance: { additionalCustomers: 3, additionalOrders: 45 },
    balanceIssue: false,
    recent: [
      { time: "20:13", people: 46, queue: 0 },
      { time: "20:28", people: 53, queue: 2 },
      { time: "20:43", people: 58, queue: 5 },
    ],
  },
  team: {
    id: "team",
    title: "Equipe mal distribuída",
    description:
      "Entrada e salão precisam de uma distribuição mais equilibrada.",
    initial: {
      people: 61,
      queue: 6,
      wait: 11,
      occupied: 17,
      needs_preparation: 2,
      available: 3,
    },
    final: {
      people: 64,
      queue: 3,
      wait: 6,
      occupied: 19,
      needs_preparation: 1,
      available: 2,
    },
    recommendation: {
      title: "Equilibre o atendimento",
      description: "Redistribuir a equipe entre entrada, balcão e salão.",
    },
    finance: { additionalCustomers: 3, additionalOrders: 60 },
    balanceIssue: true,
    recent: [
      { time: "20:13", people: 49, queue: 1 },
      { time: "20:28", people: 56, queue: 3 },
      { time: "20:43", people: 61, queue: 6 },
    ],
  },
};
export const simulatedProvider: OperationalDataProvider = {
  getScenario: (id) => scenarios[id],
};
