import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSimulation } from "../../hooks/useSimulation";
import { getAlerts } from "../../domain/alerts";
import { Dialog } from "../ui";
export const navigation = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa do bar", icon: Map },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/monitoramento", label: "Monitoramento", icon: Activity },
  { to: "/resultados", label: "Resultados", icon: BarChart3 },
  { to: "/simulador", label: "Simulador", icon: FlaskConical },
];
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M5 25V7l22 18V7M5 16l11-9M16 25l11-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        NEXA
        {!compact && (
          <>
            {" "}
            <b>SENSE</b>
            <small>Inteligência operacional</small>
          </>
        )}
      </span>
    </div>
  );
}
export function Layout() {
  const { state, storageWarning } = useSimulation();
  const location = useLocation();
  const [more, setMore] = useState(false);
  const [venue, setVenue] = useState(false);
  const pending = getAlerts(state).filter(
    (a) => a.status !== "resolved",
  ).length;
  const current =
    navigation.find((n) =>
      n.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(n.to),
    )?.label || "Configurações";
  useEffect(() => {
    document.title = `${current} · NEXA SENSE`;
    setMore(false);
    setVenue(false);
    window.scrollTo(0, 0);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLHeadingElement>("h1")
        ?.focus({ preventScroll: true }),
    );
  }, [location.pathname, current]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">Workspace de demonstração</div>
        <nav aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === "/alertas" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            to="/configuracoes"
          >
            <Settings2 size={18} />
            Configurações
          </NavLink>
          <div className="sidebar-demo">
            <span className="demo-dot" />
            <div>
              Ambiente de demonstração
              <small>Versão 0.1 · Dados simulados</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="desktop-breadcrumb">
            Workspace <span>/</span> <strong>{current}</strong>
          </div>
          <div className="mobile-brand">
            <Brand compact />
            <span className="mobile-page">{current}</span>
          </div>
          <div className="topbar-right">
            <span className="demo-tag">
              <span />
              Dados simulados
            </span>
            <button
              className="venue-button"
              onClick={() => setVenue(true)}
              aria-label={`Estabelecimento: ${state.settings.name}`}
            >
              <Building2 size={16} />
              <span>{state.settings.name}</span>
              <ChevronDown size={14} />
            </button>
            <span className="avatar" aria-label="Gerente demonstrativo">
              BC
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          {storageWarning && (
            <div role="status" className="storage-warning">
              O navegador não permitiu salvar os dados. A demonstração continua
              nesta sessão.
            </div>
          )}
          <Outlet />
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} />
              Ambiente de demonstração · Dados simulados
            </span>
            <span>
              NEXA SENSE <span className="footer-version">/ v0.1</span>
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação mobile">
        <NavLink end to="/">
          <LayoutDashboard />
          <span>Início</span>
        </NavLink>
        <NavLink to="/alertas">
          <Bell />
          <span>Alertas</span>
        </NavLink>
        <NavLink to="/simulador">
          <FlaskConical />
          <span>Simulador</span>
        </NavLink>
        <button
          onClick={() => setMore(true)}
          className={
            !["/", "/alertas", "/simulador"].includes(location.pathname)
              ? "active"
              : ""
          }
        >
          <MoreHorizontal />
          <span>Mais</span>
        </button>
      </nav>
      {more && (
        <Dialog title="Mais opções" onClose={() => setMore(false)}>
          <nav className="more-nav" aria-label="Outras páginas">
            {[
              ...navigation.filter((n) =>
                ["/mapa", "/monitoramento", "/resultados"].includes(n.to),
              ),
              {
                to: "/configuracoes",
                label: "Configurações",
                icon: SlidersHorizontal,
              },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                <Icon size={20} />
                {label}
                <ArrowUpRight size={16} />
              </NavLink>
            ))}
          </nav>
        </Dialog>
      )}
      {venue && (
        <Dialog
          title="Estabelecimento da demonstração"
          description="Este protótipo usa um único estabelecimento fictício. Você pode personalizar o nome e as hipóteses nas configurações."
          onClose={() => setVenue(false)}
        >
          <div className="venue-detail">
            <Building2 />
            {state.settings.name}
            <span>22 mesas</span>
          </div>
          <NavLink className="button primary" to="/configuracoes">
            Personalizar estabelecimento
            <ArrowUpRight size={16} />
          </NavLink>
        </Dialog>
      )}
    </div>
  );
}
