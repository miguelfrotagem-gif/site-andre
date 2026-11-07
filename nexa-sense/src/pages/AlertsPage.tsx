import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Bell,
  Clock3,
  Lightbulb,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation";
import { getAlerts } from "../domain/alerts";
import { metrics } from "../domain/simulation";
import { alertStatusLabels } from "../utils/format";
import { Badge, EmptyState, Note, PageIntro, Panel } from "../components/ui";
import {
  Progress,
  SimulationControls,
} from "../components/ui/SimulationControls";
export function AlertsPage() {
  const { state } = useSimulation();
  const { id } = useParams();
  const [filter, setFilter] = useState("all");
  const alerts = getAlerts(state),
    m = metrics(state),
    alert = alerts.find((a) => a.id === id);
  if (id && !alert)
    return (
      <>
        <PageIntro
          title="Ocorrência indisponível"
          description="O cenário ou os limites mudaram e esta ocorrência não está mais ativa."
        />
        <EmptyState
          title="Nenhum alerta correspondente"
          description="Consulte a central para ver os alertas do cenário atual."
          to="/alertas"
          label="Voltar para alertas"
        />
      </>
    );
  if (alert)
    return (
      <>
        <Link className="back-link" to="/alertas">
          <ArrowLeft size={16} />
          Central de alertas
        </Link>
        <PageIntro
          title={alert.title}
          description={alert.reason}
          action={
            <Badge tone={alert.status === "resolved" ? "green" : "amber"}>
              {alertStatusLabels[alert.status]}
            </Badge>
          }
        />
        <div className="detail-grid">
          <Panel className="alert-detail">
            <div className="alert-meta">
              <Badge tone="amber">
                Prioridade {alert.priority.toLowerCase()}
              </Badge>
              <span>Detectado às 20:43 · {alert.sector}</span>
            </div>
            <h2>Entenda a situação</h2>
            <p>
              Os indicadores do cenário foram comparados aos limites definidos
              nas configurações.
            </p>
            <div className="inline-metrics">
              <div>
                <Users size={18} />
                <strong>{m.queue}</strong>
                <span>Pessoas aguardando</span>
              </div>
              <div>
                <Clock3 size={18} />
                <strong>{m.wait} min</strong>
                <span>Espera estimada</span>
              </div>
              <div>
                <Armchair size={18} />
                <strong>{m.needs_preparation}</strong>
                <span>Mesas pendentes</span>
              </div>
            </div>
            <div className="recommendation">
              <Lightbulb size={21} />
              <div>
                <span>Recomendação operacional</span>
                <p>{alert.recommendation}</p>
              </div>
            </div>
            {alert.status === "resolved" ? (
              <Note>
                Os indicadores desta ocorrência ficaram dentro dos limites. A
                evolução é simulada.
              </Note>
            ) : (
              <Note>
                Uma única ação coordenada trata a ocorrência e seus alertas
                associados. O registro não altera os indicadores imediatamente.
              </Note>
            )}
            <SimulationControls />
            <Link className="text-link follow-link" to="/monitoramento">
              Ver acompanhamento
              <ArrowRight size={16} />
            </Link>
          </Panel>
          <Panel className="next-steps">
            <h2>Próximas etapas</h2>
            <Progress />
            <p>
              Confirme a ação executada, inicie o acompanhamento e avance o
              relógio demonstrativo.
            </p>
            <div className="divider" />
            <span className="eyebrow">Regras em uso</span>
            <dl>
              <div>
                <dt>Fila</dt>
                <dd>Acima de {state.settings.queueLimit} pessoas</dd>
              </div>
              <div>
                <dt>Espera</dt>
                <dd>Acima de {state.settings.waitLimit} min</dd>
              </div>
              <div>
                <dt>Preparação</dt>
                <dd>{state.settings.preparationLimit} mesas ou mais</dd>
              </div>
            </dl>
            <Link className="text-link" to="/configuracoes">
              Ajustar limites
              <ArrowUpRight size={15} />
            </Link>
          </Panel>
        </div>
      </>
    );
  const shown = alerts.filter((a) => filter === "all" || a.status === filter);
  return (
    <>
      <PageIntro
        title="Central de alertas"
        description="Entenda o problema, a recomendação e a próxima ação."
        action={
          <Badge
            tone={
              alerts.some((a) => a.status !== "resolved") ? "amber" : "green"
            }
          >
            {alerts.filter((a) => a.status !== "resolved").length} em atenção
          </Badge>
        }
      />
      <div className="filter-tabs" aria-label="Filtrar alertas">
        {[
          ["all", "Todos"],
          ["pending", "Pendentes"],
          ["following", "Em acompanhamento"],
          ["resolved", "Resolvidos"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
            <span>
              {value === "all"
                ? alerts.length
                : alerts.filter((a) => a.status === value).length}
            </span>
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="alerts-list">
          {shown.map((a) => (
            <Panel className="alert-row" key={a.id}>
              <span
                className={`alert-row-icon ${a.status === "resolved" ? "green" : "amber"}`}
              >
                <Bell size={20} />
              </span>
              <div className="alert-row-content">
                <div className="alert-row-title">
                  <h2>{a.title}</h2>
                  <Badge tone={a.status === "resolved" ? "green" : "amber"}>
                    {a.status === "resolved" ? "Resolvido" : a.priority}
                  </Badge>
                </div>
                <p>{a.reason}</p>
                <div className="alert-row-meta">
                  <span>20:43</span>
                  <span>{a.sector}</span>
                  <span>{alertStatusLabels[a.status]}</span>
                </div>
              </div>
              <Link className="button" to={`/alertas/${a.id}`}>
                Analisar ocorrência
                <ArrowRight size={16} />
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma ocorrência neste filtro"
          description={
            alerts.length
              ? "Selecione outro filtro para consultar as demais ocorrências."
              : "Os indicadores estão dentro dos limites configurados. Experimente outro cenário ou ajuste os limites."
          }
        />
      )}
      <Note>
        Regras determinísticas sobre dados simulados. O cenário “Equipe mal
        distribuída” demonstra também o alerta de distribuição.
      </Note>
    </>
  );
}
