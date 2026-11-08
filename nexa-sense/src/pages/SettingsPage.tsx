import { useState } from "react";
import type { FormEvent } from "react";
import { Check, RotateCcw, Save, Trash2 } from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { defaults } from "../data/scenarios";
import { validateSettings } from "../domain/simulation";
import type { Settings } from "../types";
import { Confirm, Note, PageIntro, Panel } from "../components/ui";
export function SettingsPage() {
  const { state, dispatch } = useSimulation();
  const [draft, setDraft] = useState<Settings>({ ...state.settings });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<
    "restoreSettings" | "reset" | "clearHistory" | null
  >(null);
  function change(key: keyof Settings, value: string | number) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
    setError("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const message = validateSettings(draft);
    if (message) {
      setError(message);
      return;
    }
    dispatch({ type: "settings", settings: draft });
    setSaved(true);
  }
  const operations = {
    restoreSettings: {
      title: "Restaurar configurações?",
      description:
        "O nome, ticket e limites voltarão aos valores iniciais. A etapa atual do cenário será preservada.",
    },
    reset: {
      title: "Reiniciar todos os cenários?",
      description:
        "A demonstração volta ao cenário Fila excessiva às 20:43, sem ação registrada. O mapa e histórico atuais serão substituídos. Suas configurações serão mantidas.",
    },
    clearHistory: {
      title: "Limpar histórico local?",
      description:
        "Os registros de atividades desta demonstração serão removidos. As configurações, a etapa e as medições serão preservadas.",
    },
  };
  return (
    <>
      <PageIntro
        title="Configurações"
        description="Ajuste o estabelecimento e as regras da sua demonstração."
      />
      <form onSubmit={submit} noValidate className="settings-form">
        <Panel className="settings-panel">
          <div className="settings-section-intro">
            <span className="eyebrow">Estabelecimento</span>
            <h2>Seu contexto operacional</h2>
            <p>Informações locais usadas em todas as telas.</p>
          </div>
          <div className="form-grid">
            <label>
              Nome do estabelecimento
              <input
                value={draft.name}
                maxLength={60}
                required
                onChange={(e) => change("name", e.target.value)}
              />
            </label>
            <label>
              Quantidade de mesas
              <input value={22} readOnly aria-describedby="table-count-help" />
              <small id="table-count-help">
                Esta versão usa 22 mesas fixas para manter os cenários
                coerentes.
              </small>
            </label>
            <label>
              Ticket médio ilustrativo (R$)
              <input
                type="number"
                min="0"
                max="10000"
                step="0.01"
                value={Number.isNaN(draft.ticket) ? "" : draft.ticket}
                onChange={(e) => change("ticket", e.target.valueAsNumber)}
              />
            </label>
          </div>
        </Panel>
        <Panel className="settings-panel">
          <div className="settings-section-intro">
            <span className="eyebrow">Regras de alertas</span>
            <h2>Quando chamar sua atenção</h2>
            <p>As alterações recalculam os alertas do cenário ativo.</p>
          </div>
          <div className="form-grid">
            <label>
              Pessoas na fila
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Number.isNaN(draft.queueLimit) ? "" : draft.queueLimit}
                onChange={(e) => change("queueLimit", e.target.valueAsNumber)}
              />
              <small>Alerta quando a fila estiver acima deste limite.</small>
            </label>
            <label>
              Espera estimada (minutos)
              <input
                type="number"
                min="0"
                max="120"
                step="1"
                value={Number.isNaN(draft.waitLimit) ? "" : draft.waitLimit}
                onChange={(e) => change("waitLimit", e.target.valueAsNumber)}
              />
              <small>Espera acima do limite eleva a prioridade.</small>
            </label>
            <label>
              Mesas pendentes de preparação
              <input
                type="number"
                min="1"
                max="22"
                step="1"
                value={
                  Number.isNaN(draft.preparationLimit)
                    ? ""
                    : draft.preparationLimit
                }
                onChange={(e) =>
                  change("preparationLimit", e.target.valueAsNumber)
                }
              />
              <small>Alerta a partir desta quantidade de mesas.</small>
            </label>
          </div>
        </Panel>
        <div className="settings-save">
          <span
            role="status"
            className={error ? "field-error" : "save-success"}
          >
            {error ||
              (saved ? (
                <>
                  <Check size={16} />
                  Configurações salvas neste navegador.
                </>
              ) : (
                "As preferências ficam salvas apenas neste navegador."
              ))}
          </span>
          <button type="submit" className="button primary">
            <Save size={16} />
            Salvar configurações
          </button>
        </div>
      </form>
      <Panel className="settings-demo">
        <div className="section-heading">
          <div>
            <h2>Controle da demonstração</h2>
            <p>
              Cada operação solicita confirmação antes de alterar dados locais.
            </p>
          </div>
        </div>
        <div className="demo-operations">
          <button
            className="button"
            onClick={() => setConfirm("restoreSettings")}
          >
            <RotateCcw size={16} />
            Restaurar configurações
          </button>
          <button className="button" onClick={() => setConfirm("reset")}>
            <RotateCcw size={16} />
            Reiniciar todos os cenários
          </button>
          <button
            className="button danger"
            onClick={() => setConfirm("clearHistory")}
          >
            <Trash2 size={16} />
            Limpar histórico local
          </button>
        </div>
        <Note>
          Não há câmeras, contas, serviços pagos ou sistemas de caixa
          conectados. Não insira informações pessoais ou credenciais.
        </Note>
      </Panel>
      {confirm && (
        <Confirm
          {...operations[confirm]}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            dispatch({ type: confirm });
            if (confirm === "restoreSettings") {
              setDraft({ ...defaults });
              setSaved(false);
              setError("");
            }
          }}
        />
      )}
    </>
  );
}
