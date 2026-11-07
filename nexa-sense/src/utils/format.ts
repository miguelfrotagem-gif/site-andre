export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
export const tableLabels = {
  occupied: "Ocupada",
  available: "Disponível e preparada",
  needs_preparation: "Aguardando preparação",
};
export const statusLabels = {
  detected: "Problema identificado",
  action_registered: "Ação registrada",
  monitoring: "Em acompanhamento",
  completed: "Resultado acompanhado",
};
export const alertStatusLabels = {
  pending: "Pendente",
  following: "Em acompanhamento",
  resolved: "Resolvido",
};
