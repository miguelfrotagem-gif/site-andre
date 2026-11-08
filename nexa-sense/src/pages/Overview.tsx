import {
  ArrowDownRight,
  ArrowRight,
  Armchair,
  Clock3,
  Lightbulb,
  Users,
  TriangleAlert,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation";
import { currentTime, metrics } from "../domain/simulation";
import { getAlerts } from "../domain/alerts";
import { scenarios } from "../data/scenarios";
import { estimate } from "../domain/finance";
import { money } from "../utils/format";
import { Badge, PageIntro, Panel } from "../components/ui";
import { LineChart } from "../components/charts/LineChart";
export function Overview() {
  const { state } = useSimulation();
  const m = metrics(state),
    alerts = getAlerts(state).filter((a) => a.status !== "resolved"),
    scenario = scenarios[state.scenarioId],
    financial = estimate(scenario, state.settings.ticket);
  const primary = alerts.find((a) => a.priority === "Alta") || alerts[0];
  const history = state.events.slice(-4).reverse();
  const recent = [
    ...scenario.recent,
    ...(state.status === "completed"
      ? [{ time: "21:01", people: m.people, queue: m.queue }]
      : []),
  ];
  const graphLabels = recent.map((point) => point.time);
  const people = recent.map((point) => point.people);
  const queue = recent.map((point) => point.queue);
  return (
    <>
      <PageIntro
        eyebrow="O pulso da sua operação"
        title="Visão geral"
        description="Acompanhe os indicadores e situações que precisam da sua atenção."
        action={
          <div className="time-context">
            <Clock3 size={15} />
            <span>
              {currentTime(state)}
              <small>Horário simulado</small>
            </span>
          </div>
        }
      />
      <div className="overview-grid">
        <div className="metrics-grid">
          {[
            {
              label: "Pessoas aguardando",
              value: m.queue,
              detail: "Fila de atendimento",
              icon: Users,
            },
            {
              label: "Tempo de espera",
              value: (
                <>
                  {m.wait}
                  <small>min</small>
                </>
              ),
              detail: "Média estimada",
              icon: Clock3,
            },
            {
              label: "Ocupação",
              value: (
                <>
                  {m.occupied}
                  <small>/22</small>
                </>
              ),
              detail: "Mesas ocupadas",
              icon: Armchair,
            },
          ].map(({ label, value, detail, icon: Icon }) => (
            <Panel className="metric" key={label}>
              <div className="metric-label">
                {label}
                <Icon size={18} />
              </div>
              <strong>{value}</strong>
              <span>{detail}</span>
            </Panel>
          ))}
        </div>
        <Panel className={`main-alert ${primary ? "has-alert" : "all-clear"}`}>
          <div className="alert-top">
            <span className="section-kicker">
              <span className="alert-symbol">
                {primary ? (
                  <TriangleAlert size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
              </span>
              Situação operacional
            </span>
            <Badge tone={primary ? "amber" : "green"}>
              {primary
                ? `Prioridade ${primary.priority.toLowerCase()}`
                : "Sem pendências"}
            </Badge>
          </div>
          <h2>
            {primary
              ? primary.id === "service"
                ? "Atenção necessária no atendimento"
                : primary.title
              : "Operação dentro dos limites definidos"}
          </h2>
          <p>
            {primary
              ? primary.reason
              : "Nenhum alerta ativo com os indicadores e limites atuais."}
          </p>
          {primary && (
            <div className="recommendation">
              <Lightbulb size={19} />
              <div>
                <span>Ação sugerida</span>
                <p>{primary.recommendation}</p>
              </div>
            </div>
          )}
          <div className="alert-bottom">
            <Link
              className="button primary"
              to={primary ? `/alertas/${primary.id}` : "/resultados"}
            >
              {primary ? "Analisar ocorrência" : "Consultar resultados"}
              <ArrowRight size={16} />
            </Link>
            <span>Dados do cenário · {scenario.title}</span>
          </div>
        </Panel>
        <Panel className="recent-chart">
          <div className="section-heading">
            <div>
              <h2>Movimentação recente</h2>
              <p>Evolução simulada do cenário</p>
            </div>
            <span className="subtle-label">
              {state.status === "completed" ? "48" : "30"} min
            </span>
          </div>
          <LineChart
            compact
            labels={graphLabels}
            series={[
              { label: "No estabelecimento", color: "#0f766e", values: people },
              { label: "Aguardando", color: "#d97706", values: queue },
            ]}
          />
        </Panel>
        <Panel className="finance-summary">
          <div className="finance-icon">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <span className="subtle-label">
              Receita potencial estimada no cenário
            </span>
            <strong>{money(financial.total)}</strong>
            <p>Projeção ilustrativa baseada nas hipóteses do simulador.</p>
          </div>
          <Link to="/resultados" className="text-link">
            Entender estimativa
            <ArrowRight size={15} />
          </Link>
        </Panel>
        <Panel className="activities">
          <div className="section-heading">
            <h2>Últimas atividades</h2>
            <span className="subtle-label">Ocorrência atual</span>
          </div>
          {history.length ? (
            <ul className="activity-list">
              {history.map((e) => (
                <li key={e.id}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{e.title}</strong>
                    <span>{e.detail}</span>
                  </div>
                  <time>{e.time}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              O histórico local foi limpo. Novas etapas aparecerão aqui.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
