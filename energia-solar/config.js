window.SOLAR_CONFIG = {
  brandName: 'Energia Solar',
  logoUrl: '',
  whatsappNumber: '',
  ownerName: 'Eude Militão',
  savingsClaim: { validated: false, percentage: 90 },
  // Normalized image coordinates: center, full region to retain, maximum zoom.
  // Desktop: 1672×941. Mobile: 934×1684, with a different arrangement.
  solutionScene: {
    duration: 780,
    desktop: {
      focus: [.76, .58],
      targets: {
        residencial: { center: [.79, .69], region: [.50, .54, .995, .85], zoom: 1.38 },
        empresarial: { center: [.52, .47], region: [.36, .39, .70, .56], zoom: 1.64 },
        rural: { center: [.85, .39], region: [.68, .31, .995, .46], zoom: 1.90 }
      }
    },
    mobile: {
      focus: [.52, .62],
      targets: {
        residencial: { center: [.66, .55], region: [.23, .48, .995, .63], zoom: 1.24 },
        empresarial: { center: [.26, .44], region: [.04, .40, .50, .49], zoom: 1.52 },
        rural: { center: [.78, .41], region: [.56, .37, .995, .45], zoom: 1.68, focus: [.52, .70] }
      }
    }
  },
  generalMessage: 'Olá! Gostaria de falar com a equipe sobre energia solar.',
  messages: {
    hero: 'Olá! Gostaria de entender o potencial de economia com energia solar para o meu imóvel.',
    residencial: 'Olá! Tenho interesse em energia solar para minha casa.',
    empresarial: 'Olá! Quero avaliar uma solução solar para minha empresa.',
    rural: 'Olá! Gostaria de conversar sobre energia solar para uma propriedade rural.',
    project: 'Olá! Vi os projetos no site e gostaria de uma solução para o meu imóvel.',
    contact: 'Olá! Gostaria de falar com a equipe sobre energia solar.',
    proposal: 'Olá! Gostaria de solicitar uma proposta de energia solar para o meu imóvel.',
    analysis: 'Olá! Gostaria de começar uma análise do meu consumo de energia.',
    faq: 'Olá! Gostaria de tirar uma dúvida sobre energia solar.'
  }
};
