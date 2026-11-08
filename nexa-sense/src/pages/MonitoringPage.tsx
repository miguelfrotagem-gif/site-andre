import { Activity, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation";
import { scenarios } from "../data/scenarios";
import { Badge, EmptyState, Note, PageIntro, Panel } from "../components/ui";
import { SimulationControls } from "../components/ui/SimulationControls";
import { LineChart } from "../components/charts/LineChart";
export function MonitoringPage() {
  const { state } = useSimulation();
  const measurements = state.measurements;
  return (
    <>
      <PageIntro
        title="Monitoramento"
        description="Acompanhe o comportamento dos indicadores após uma ação."
      />
      {state.status === "detected" || state.status === "action_registered" ? (
        <EmptyState
          title="Nenhum acompanhamento iniciado."
          description={
            state.status === "action_registered"
              ? "A ação está registrada. Inicie o acompanhamento no simulador para medir a evolução."
              : "Registre uma ação no cenário ativo para acompanhar os indicadores."
          }
        />
      ) : (
        <>
          <Panel className="monitor-status">
            <span className="monitor-icon">
              {state.status === "completed" ? <CheckCircle2 /> : <Activity />}
            </span>
            <div>
              <h2>
                {state.status === "completed"
                  ? "Acompanhamento concluído"
                  : "Acompanhamento em andamento"}
              </h2>
              <p>
                {scenarios[state.scenarioId].title} · ação registrada às{" "}
                {state.action?.time}
              </p>
            </div>
            <Badge tone={state.status === "completed" ? "green" : "neutral"}>
              {state.status === "completed"
                ? "Nova medição às 21:01"
                : "Aguardando próxima medição"}
            </Badge>
          </Panel>
          <div className="two-columns">
            <Panel className="chart-panel">
              <div className="section-heading">
                <div>
                  <h2>Pessoas aguardando</h2>
                  <p>Medições da fila</p>
                </div>
                <span className="chart-value">
                  {measurements.at(-1)!.metrics.queue}
                  <small> pessoas</small>
                </span>
              </div>
              <LineChart
                labels={measurements.map((m) => m.time)}
                series={[
                  {
                    label: "Pessoas aguardando",
                    values: measurements.map((m) => m.metrics.queue),
                    color: "#0f766e",
                  },
                ]}
              />
            </Panel>
            <Panel className="chart-panel">
              <div className="section-heading">
                <div>
                  <h2>Tempo de espera</h2>
                  <p>Estimativa por medição</p>
                </div>
                <span className="chart-value">
                  {measurements.at(-1)!.metrics.wait}
                  <small> min</small>
                </span>
              </div>
              <LineChart
                labels={measurements.map((m) => m.time)}
                unit=" min"
                series={[
                  {
                    label: "Espera estimada",
                    values: measurements.map((m) => m.metrics.wait),
                    color: "#64748b",
                  },
                ]}
              />
            </Panel>
          </div>
          <Panel className="timeline-panel">
            <div className="section-heading">
              <div>
                <h2>Linha do tempo da ocorrência</h2>
                <p>Eventos efetivamente registrados nesta demonstração</p>
              </div>
              <Clock3 size={18} />
            </div>
            {state.events.length ? (
              <ol className="timeline">
                {state.events.map((e) => (
                  <li key={e.id}>
                    <time>{e.time}</time>
                    <span className="timeline-point" />
                    <div>
                      <h3>{e.title}</h3>
                      <p>{e.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                Histórico limpo. As medições atuais foram preservadas.
              </p>
            )}
            <SimulationControls />
            {state.status !== "completed" && (
              <Link className="text-link follow-link" to="/simulador">
                Abrir simulador
                <ArrowRight size={16} />
              </Link>
            )}
          </Panel>
          <Note>
            Linhas conectam apenas as medições disponíveis; não representam
            coleta contínua. Alterações manuais do mapa não reescrevem medições
            anteriores.
          </Note>
        </>
      )}
    </>
  );
}
