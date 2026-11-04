// Use somente o número confirmado da FS, com DDI e DDD, sem contatos de outros projetos.
export const WHATSAPP_PHONE = '559888310153';
export const WHATSAPP_MESSAGE = 'Olá! Tenho interesse em um orçamento de perfuração de poço. Posso informar a localização do terreno?';
export function getBudgetUrl(phone = WHATSAPP_PHONE) {
  const digits = String(phone).replace(/[\s()+.-]/g, '');
  return /^[1-9]\d{9,14}$/.test(digits) ? `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}` : '#contato';
}
