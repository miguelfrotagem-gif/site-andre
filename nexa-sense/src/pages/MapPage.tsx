import { useEffect, useState } from "react";
import {
  Armchair,
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  RotateCcw,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { counts } from "../domain/simulation";
import type { TableStatus } from "../types";
import { tableLabels } from "../utils/format";
import { Confirm, PageIntro, Panel } from "../components/ui";
export function MapPage() {
  const { state, dispatch } = useSimulation();
  const [selected, setSelected] = useState<number | null>(null);
  const [reset, setReset] = useState(false);
  const table = state.tables.find((t) => t.id === selected);
  const totals = counts(state.tables);
  useEffect(() => {
    if (selected !== null && matchMedia("(max-width: 600px)").matches) {
      document.querySelector(".table-details")?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [selected]);
  return (
    <>
      <PageIntro
        title="Mapa do bar"
        description="Visualize a distribuição e o estado das mesas."
        action={
          <button className="button" onClick={() => setReset(true)}>
            <RotateCcw size={16} />
            Restaurar mapa do cenário
          </button>
        }
      />
      <div className="map-legend">
        {(Object.keys(tableLabels) as TableStatus[]).map((status) => (
          <span key={status}>
            {status === "occupied" ? (
              <Armchair size={14} />
            ) : status === "available" ? (
              <Check size={14} />
            ) : (
              <Clock3 size={14} />
            )}
            <i className={`table-dot ${status}`} />
            {tableLabels[status]}
            <strong>{totals[status]}</strong>
          </span>
        ))}
      </div>
      <div className={`map-layout ${table ? "with-details" : ""}`}>
        <Panel className="floor-panel">
          <div className="section-heading">
            <h2>Salão · 22 mesas</h2>
            <span className="subtle-label">Planta ilustrativa</span>
          </div>
          <div className="floor-plan">
            <div className="bar-counter">
              <UtensilsCrossed size={18} />
              <span>Balcão e área de atendimento</span>
            </div>
            <div className="floor-sector">
              <span>Salão principal</span>
              <span>Salão lateral</span>
            </div>
            <div className="tables-grid">
              {state.tables.map((t) => (
                <button
                  key={t.id}
                  data-table-id={t.id}
                  className={`table ${t.status} ${selected === t.id ? "selected" : ""}`}
                  onClick={() => setSelected(t.id)}
                  aria-label={`Mesa ${String(t.id).padStart(2, "0")}, ${tableLabels[t.status]}`}
                  aria-pressed={selected === t.id}
                >
                  <span className="chair top" />
                  <span className="chair bottom" />
                  {t.status === "available" ? (
                    <Check size={14} />
                  ) : t.status === "needs_preparation" ? (
                    <Clock3 size={14} />
                  ) : (
                    <Armchair size={14} />
                  )}
                  <strong>{String(t.id).padStart(2, "0")}</strong>
                  <span className="sr-only">{tableLabels[t.status]}</span>
                </button>
              ))}
            </div>
            <div className="entrance">
              <ArrowDown size={17} />
              <span>Entrada e recepção</span>
              <ArrowRight size={17} />
            </div>
          </div>
          <p className="map-help">
            Selecione uma mesa para consultar e alterar o estado demonstrativo.
          </p>
        </Panel>
        {table ? (
          <Panel className="table-details">
            <div className="section-heading">
              <span className="eyebrow">Detalhes da mesa</span>
              <button
                className="icon-button"
                aria-label="Fechar detalhes da mesa"
                onClick={() => {
                  setSelected(null);
                  document
                    .querySelector<HTMLButtonElement>(
                      `.table[data-table-id="${table.id}"]`,
                    )
                    ?.focus();
                }}
              >
                <X size={18} />
              </button>
            </div>
            <span className={`table-detail-symbol ${table.status}`}>
              <Armchair size={29} />
            </span>
            <h2>Mesa {String(table.id).padStart(2, "0")}</h2>
            <span className={`state-label ${table.status}`}>
              <i className={`table-dot ${table.status}`} />
              {tableLabels[table.status]}
            </span>
            <dl>
              <div>
                <dt>Setor</dt>
                <dd>{table.sector}</dd>
              </div>
              <div>
                <dt>Última mudança simulada</dt>
                <dd>{table.changedAt}</dd>
              </div>
            </dl>
            <h3>Alterar estado</h3>
            <p className="muted">
              A alteração atualiza o mapa, a ocupação e os alertas.
            </p>
            <div className="table-state-actions">
              {(Object.keys(tableLabels) as TableStatus[]).map((status) => (
                <button
                  key={status}
                  className={`button ${table.status === status ? "selected" : ""}`}
                  disabled={table.status === status}
                  onClick={() =>
                    dispatch({ type: "table", id: table.id, status })
                  }
                >
                  {tableLabels[status]}
                  {table.status === status && <Check size={16} />}
                </button>
              ))}
            </div>
            <p className="note">
              A próxima medição do cenário substitui os ajustes manuais.
              Resultados preservam a medição concluída.
            </p>
          </Panel>
        ) : (
          <aside className="map-placeholder">
            <Armchair size={28} />
            <h3>Cada mesa, um contexto.</h3>
            <p>Toque em uma mesa para ver o setor e as opções de preparação.</p>
          </aside>
        )}
      </div>
      {reset && (
        <Confirm
          title="Restaurar o mapa?"
          description="Os ajustes manuais das mesas serão substituídos pelo mapa da etapa atual do cenário. As demais etapas serão preservadas."
          label="Restaurar mapa"
          onClose={() => setReset(false)}
          onConfirm={() => dispatch({ type: "resetMap" })}
        />
      )}
    </>
  );
}
