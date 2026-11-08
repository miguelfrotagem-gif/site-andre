import { useState } from "react";
import { ArrowRight, Check, Clock3, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useSimulation } from "../../hooks/useSimulation";
import { scenarios } from "../../data/scenarios";
import { Confirm } from "./index";
export function SimulationControls({ reset = false }: { reset?: boolean }) {
  const { state, dispatch } = useSimulation();
  const [confirm, setConfirm] = useState<"register" | "reset" | null>(null);
  return (
    <>
      <div className="simulation-controls">
        {state.status === "detected" && !state.recommendationShown && (
          <button
            className="button primary"
            onClick={() => dispatch({ type: "recommend" })}
          >
            Ver recomendação
            <ArrowRight size={16} />
          </button>
        )}
        {state.status === "detected" && state.recommendationShown && (
          <button
            className="button primary"
            onClick={() => setConfirm("register")}
          >
            <Check size={16} />
            Registrar ação executada
          </button>
        )}
        {state.status === "action_registered" && (
          <button
            className="button primary"
            onClick={() => dispatch({ type: "monitor" })}
          >
            <Play size={16} />
            Iniciar acompanhamento
          </button>
        )}
        {state.status === "monitoring" && (
          <button
            className="button primary"
            onClick={() => dispatch({ type: "advance" })}
          >
            <Clock3 size={16} />
            Avançar acompanhamento de 15 minutos
          </button>
        )}
        {state.status === "completed" && (
          <Link className="button primary" to="/resultados">
            Ver resultado
            <ArrowRight size={16} />
          </Link>
        )}
        {reset && (
          <button className="button" onClick={() => setConfirm("reset")}>
            <RotateCcw size={16} />
            Reiniciar cenário
          </button>
        )}
      </div>
      {confirm && (
        <Confirm
          title={
            confirm === "register"
              ? "Confirmar ação executada?"
              : "Reiniciar este cenário?"
          }
          description={
            confirm === "register"
              ? `Confirme a execução demonstrativa: ${scenarios[state.scenarioId].recommendation.description} O registro será feito às 20:46. Os indicadores só mudam na próxima medição.`
              : "O mapa, as medições e o histórico da ocorrência atual serão restaurados. Suas configurações serão mantidas."
          }
          label={
            confirm === "register" ? "Confirmar ação" : "Reiniciar cenário"
          }
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            dispatch(
              confirm === "register"
                ? { type: "register" }
                : { type: "start", id: state.scenarioId },
            )
          }
        />
      )}
    </>
  );
}
export function Progress() {
  const { state } = useSimulation();
  const step =
    state.status === "completed"
      ? 3
      : state.status === "monitoring"
        ? 2
        : state.status === "action_registered"
          ? 1
          : 0;
  return (
    <ol className="progress" aria-label="Etapas da simulação">
      {["Identificação", "Ação", "Acompanhamento", "Resultado"].map(
        (label, i) => (
          <li
            key={label}
            className={i < step ? "done" : i === step ? "current" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={13} /> : i + 1}</span>
            <strong>{label}</strong>
          </li>
        ),
      )}
    </ol>
  );
}
