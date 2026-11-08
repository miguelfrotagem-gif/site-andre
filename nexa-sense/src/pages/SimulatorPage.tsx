import { useState } from "react";
import {
  ArrowRight,
  Armchair,
  Clock3,
  FlaskConical,
  Lightbulb,
  Users,
  UsersRound,
} from "lucide-react";
import { scenarios } from "../data/scenarios";
import { useSimulation } from "../hooks/useSimulation";
import { currentTime, metrics } from "../domain/simulation";
import type { ScenarioId } from "../types";
import { statusLabels } from "../utils/format";
import { Badge, Confirm, Note, PageIntro, Panel } from "../components/ui";
import {
  Progress,
  SimulationControls,
} from "../components/ui/SimulationControls";
export function SimulatorPage() {
  const { state, dispatch } = useSimulation();
  const [next, setNext] = useState<ScenarioId | null>(null);
  const scenario = scenarios[state.scenarioId],
    m = metrics(state);
  const icons = { queue: Users, tables: Armchair, team: UsersRound };
  return (
    <>
      <PageIntro
        eyebrow="Simulador operacional"
        title="Laboratório de situações"
        description="Experimente como o NEXA SENSE identifica problemas e acompanha ações."
        action={
          <span className="lab-tag">
            <FlaskConical size={16} />
            Sem impacto na operação real
          </span>
        }
      />
      <div className="scenario-grid">
        {Object.values(scenarios).map((s, i) => {
          const Icon = icons[s.id];
          return (
            <Panel
              className={`scenario-card ${state.scenarioId === s.id ? "active" : ""}`}
              key={s.id}
            >
              <div className="scenario-card-top">
                <span className="scenario-icon">
                  <Icon size={21} />
                </span>
                <span className="subtle-label">
                  Cenário {String.fromCharCode(65 + i)}
                </span>
              </div>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <button className="text-link" onClick={() => setNext(s.id)}>
                Iniciar cenário
                <ArrowRight size={16} />
              </button>
              {state.scenarioId === s.id && (
                <span className="scenario-active">Cenário ativo</span>
              )}
            </Panel>
          );
        })}
      </div>
      <Panel className="simulation-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Demonstração em andamento</span>
            <h2>{scenario.title}</h2>
          </div>
          <Badge tone={state.status === "completed" ? "green" : "neutral"}>
            {statusLabels[state.status]}
          </Badge>
        </div>
        <Progress />
        <div className="simulation-body">
          <div>
            <span className="simulation-clock">
              <Clock3 size={16} />
              {currentTime(state)} · horário simulado
            </span>
            <h3>
              {state.status === "completed"
                ? "O que mudou após a ação?"
                : state.status === "monitoring"
                  ? "Acompanhe a evolução"
                  : state.status === "action_registered"
                    ? "Ação registrada. E agora?"
                    : state.recommendationShown
                      ? "Uma ação clara para o gerente"
                      : "Um problema foi identificado"}
            </h3>
            <p>
              {state.status === "completed"
                ? "O acompanhamento foi concluído. Compare a medição inicial com a medição das 21:01 na página de resultados."
                : state.status === "monitoring"
                  ? "Avance 15 minutos para gerar a próxima medição determinística. Nenhum indicador muda antes deste avanço."
                  : state.status === "action_registered"
                    ? "O registro foi feito às 20:46. Inicie o acompanhamento para observar os indicadores antes de avaliar o resultado."
                    : `${m.queue} pessoas aguardam, com espera estimada de ${m.wait} minutos.`}
            </p>
            {state.recommendationShown && (
              <div className="recommendation">
                <Lightbulb size={19} />
                <div>
                  <span>{scenario.recommendation.title}</span>
                  <p>{scenario.recommendation.description}</p>
                </div>
              </div>
            )}
            <SimulationControls reset />
          </div>
          <div className="scenario-snapshot">
            <span className="eyebrow">Indicadores atuais</span>
            <dl>
              <div>
                <dt>Pessoas no estabelecimento</dt>
                <dd>{m.people}</dd>
              </div>
              <div>
                <dt>Pessoas aguardando</dt>
                <dd>{m.queue}</dd>
              </div>
              <div>
                <dt>Espera estimada</dt>
                <dd>{m.wait} min</dd>
              </div>
              <div>
                <dt>Mesas ocupadas</dt>
                <dd>{m.occupied}</dd>
              </div>
              <div>
                <dt>Aguardando preparação</dt>
                <dd>{m.needs_preparation}</dd>
              </div>
              <div>
                <dt>Disponíveis e preparadas</dt>
                <dd>{m.available}</dd>
              </div>
              <div className="snapshot-total">
                <dt>Total de mesas</dt>
                <dd>{state.tables.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Panel>
      <Note>
        A simulação não utiliza câmeras, rastreamento ou vendas reais. Cada
        cenário tem valores e transições predefinidos.
      </Note>
      {next && (
        <Confirm
          title={`Iniciar “${scenarios[next].title}”?`}
          description="O cenário atual, seus ajustes de mesas e o histórico serão substituídos. As configurações do estabelecimento serão mantidas."
          label="Iniciar cenário"
          onClose={() => setNext(null)}
          onConfirm={() => dispatch({ type: "start", id: next })}
        />
      )}
    </>
  );
}
