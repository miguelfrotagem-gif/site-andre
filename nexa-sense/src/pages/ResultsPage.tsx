import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { scenarios } from "../data/scenarios";
import { estimate } from "../domain/finance";
import { money } from "../utils/format";
import { Badge, Note, PageIntro, Panel } from "../components/ui";
import { Link } from "react-router-dom";
export function ResultsPage() {
  const { state, dispatch } = useSimulation();
  const scenario = scenarios[state.scenarioId],
    completed = state.status === "completed",
    before = state.measurements[0].metrics,
    after = state.measurements.at(-1)!.metrics,
    financial = estimate(scenario, state.settings.ticket);
  const [ticketError, setTicketError] = useState("");
  const reduction = completed
    ? Math.round(
        ((before.queue - after.queue) / Math.max(1, before.queue)) * 1000,
      ) / 10
    : 0;
  return (
    <>
      <PageIntro
        title="Resultados"
        description="Entenda a evolução operacional e as hipóteses financeiras do cenário."
        action={
          <Badge tone={completed ? "green" : "neutral"}>
            {completed ? "Medição concluída" : "Resultado ainda não disponível"}
          </Badge>
        }
      />
      <Panel className="result-operational">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / Impacto operacional</span>
            <h2>
              {completed
                ? "Uma operação com menos espera."
                : "O resultado começa com uma ação."}
            </h2>
            <p>
              {scenario.title} ·{" "}
              {completed
                ? "comparação entre 20:43 e 21:01"
                : "acompanhe o cenário para comparar as medições"}
            </p>
          </div>
          {completed && (
            <span className="result-symbol">
              <CheckCircle2 size={25} />
            </span>
          )}
        </div>
        {completed ? (
          <>
            <div className="comparison-grid">
              {[
                {
                  label: "Pessoas aguardando",
                  a: before.queue,
                  b: after.queue,
                },
                {
                  label: "Espera estimada",
                  a: before.wait,
                  b: after.wait,
                  unit: " min",
                },
                {
                  label: "Mesas pendentes",
                  a: before.needs_preparation,
                  b: after.needs_preparation,
                },
                {
                  label: "Mesas ocupadas",
                  a: before.occupied,
                  b: after.occupied,
                },
              ].map((item) => (
                <div className="comparison" key={item.label}>
                  <span>{item.label}</span>
                  <div>
                    <s>
                      {item.a}
                      {item.unit}
                    </s>
                    <ArrowRight size={19} />
                    <strong>
                      {item.b}
                      {item.unit}
                    </strong>
                  </div>
                  <small>
                    Antes <span>Depois</span>
                  </small>
                </div>
              ))}
            </div>
            <div className="result-insight">
              <ArrowDownRight size={18} />
              <span>
                A fila diminuiu em{" "}
                <strong>
                  {before.queue - after.queue} pessoas (
                  {reduction.toLocaleString("pt-BR")}%)
                </strong>{" "}
                neste cenário simulado.
              </span>
            </div>
          </>
        ) : (
          <div className="result-pending">
            <p>
              Registre a ação e conclua os 15 minutos de acompanhamento. Os
              valores de depois só serão exibidos após essa etapa.
            </p>
            <Link className="button primary" to="/simulador">
              Continuar demonstração
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </Panel>
      <Panel className="financial-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / Hipótese financeira</span>
            <h2>O que essa melhoria poderia representar?</h2>
            <p>Modelo ilustrativo, independente de vendas reais.</p>
          </div>
          <Calculator size={22} />
        </div>
        <div className="financial-layout">
          <div>
            <div className="financial-assumptions">
              <div>
                <span>Clientes adicionais estimados</span>
                <strong>{financial.customers}</strong>
                <small>
                  Hipótese do cenário, não conversão comprovada da fila.
                </small>
              </div>
              <label className="ticket-field" htmlFor="result-ticket">
                Ticket médio ilustrativo
                <div className="currency-input">
                  <span>R$</span>
                  <input
                    id="result-ticket"
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    defaultValue={state.settings.ticket}
                    aria-invalid={!!ticketError}
                    aria-describedby="ticket-error"
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      if (!Number.isFinite(v) || v < 0 || v > 10000) {
                        setTicketError("Informe um valor entre 0 e 10.000.");
                        return;
                      }
                      setTicketError("");
                      dispatch({
                        type: "settings",
                        settings: { ...state.settings, ticket: v },
                      });
                    }}
                  />
                </div>
                <small>Altere para explorar a hipótese.</small>
              </label>
            </div>
            <p id="ticket-error" role="status" className="field-error">
              {ticketError}
            </p>
            <dl className="finance-breakdown">
              <div>
                <dt>
                  {financial.customers} clientes × {money(financial.ticket)}
                </dt>
                <dd>{money(financial.associated)}</dd>
              </div>
              <div>
                <dt>Pedidos adicionais estimados</dt>
                <dd>{money(financial.orders)}</dd>
              </div>
            </dl>
          </div>
          <div className="financial-total">
            <span>Receita potencial total</span>
            <strong data-testid="finance-total">
              {money(financial.total)}
            </strong>
            <Badge tone="green">Hipótese ilustrativa</Badge>
            <p>
              Clientes adicionais estimados × ticket médio + pedidos adicionais
              estimados.
            </p>
          </div>
        </div>
        <Note>
          Estimativa ilustrativa. Não representa lucro líquido, vendas
          comprovadas ou causalidade demonstrada. Pessoas que saem da fila não
          representam necessariamente novas vendas.
        </Note>
      </Panel>
    </>
  );
}
