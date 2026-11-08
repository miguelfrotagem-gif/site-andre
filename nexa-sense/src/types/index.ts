export type TableStatus = "occupied" | "available" | "needs_preparation";
export type OccurrenceStatus =
  | "detected"
  | "action_registered"
  | "monitoring"
  | "completed";
export type ScenarioId = "queue" | "tables" | "team";
export interface Establishment {
  name: string;
  tableCount: number;
  ticket: number;
}
export interface Settings extends Establishment {
  queueLimit: number;
  waitLimit: number;
  preparationLimit: number;
}
export interface Table {
  id: number;
  status: TableStatus;
  sector: string;
  changedAt: string;
}
export interface Metrics {
  people: number;
  queue: number;
  wait: number;
  occupied: number;
  needs_preparation: number;
  available: number;
}
export interface RecommendedAction {
  title: string;
  description: string;
}
export interface OperationalScenario {
  id: ScenarioId;
  title: string;
  description: string;
  initial: Metrics;
  final: Metrics;
  recommendation: RecommendedAction;
  finance: { additionalCustomers: number; additionalOrders: number };
  balanceIssue: boolean;
  recent: { time: string; people: number; queue: number }[];
}
export interface OperationalEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
}
export interface ActionExecution {
  time: string;
  description: string;
}
export interface Measurement {
  time: string;
  metrics: Metrics;
}
export interface Alert {
  id: string;
  title: string;
  priority: "Alta" | "Média";
  sector: string;
  reason: string;
  recommendation: string;
  status: "pending" | "following" | "resolved";
}
export interface FinancialEstimate {
  customers: number;
  ticket: number;
  orders: number;
  associated: number;
  total: number;
}
export interface SimulationState {
  version: 1;
  scenarioId: ScenarioId;
  status: OccurrenceStatus;
  recommendationShown: boolean;
  tables: Table[];
  measurements: Measurement[];
  events: OperationalEvent[];
  action: ActionExecution | null;
  settings: Settings;
}
export interface OperationalDataProvider {
  getScenario(id: ScenarioId): OperationalScenario;
}
