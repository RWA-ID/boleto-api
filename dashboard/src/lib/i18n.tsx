'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Locale = 'en' | 'es'

const translations = {
  en: {
    nav: {
      createEvent: 'Create Event',
      apiKeys: 'API Keys',
      scanner: 'My Events',
    },
    home: {
      tagline: 'Web3 Ticketing Protocol',
      description: 'Web3 ticketing infrastructure for Latin American events. Issue ENS subdomain-based NFT tickets on Ethereum with permanent on-chain identity.',
      createEvent: 'Create Event',
      howItWorks: 'How It Works',
      pricingTitle: 'Pricing Calculator',
      ticketCount: 'Ticket Count',
      tier: 'Tier',
      rate: 'Rate',
      tickets: 'Tickets',
      protocolFee: 'Protocol Fee',
      pricingNote: 'One-time upfront payment. 100% of ticket sale revenue goes to the promoter.',
      pricingSubtitle: 'One upfront fee. 100% of ticket revenue goes to you.',
      howItWorksSubtitle: 'From event registration to door scanner in three steps',
      howItWorksDetail1: 'USDC payment on Ethereum mainnet',
      howItWorksDetail2: 'REST API — any language, any platform',
      howItWorksDetail3: 'On-chain verification, instant confirmation',
      guaranteesSubtitle: 'Built on open standards. No vendor lock-in.',
      statsReservedArtists: 'Reserved Artists',
      statsPlatformRoyalty: 'Platform Royalty',
      statsCheapMinting: 'Cheap Minting',
      step01Title: 'Register Event',
      step01Desc: 'Pay upfront protocol fee in USDC. Get an ENS subdomain like badbunny-miami25.boleto.eth',
      step02Title: 'Mint Tickets',
      step02Desc: 'Issue ERC-721 NFT tickets on Ethereum via REST API. Each ticket is soulbound or transferable — your choice.',
      step03Title: 'Verify & Redeem',
      step03Desc: 'Use the verify/redeem API endpoints with your own scanner. No app needed.',
      guaranteesTitle: 'Protocol Guarantees',
      guarantees: [
        'ENS subdomains on Ethereum L1 — permanent, verifiable identity',
        'Ticket NFTs on Ethereum — cheap minting, fast confirmation',
        'Soulbound or transferable — set per event, toggleable by promoter',
        '1% promoter royalty on secondary sales — hardcoded, goes directly to promoter',
        'Reserved artist slugs protect major acts (Bad Bunny, Shakira, etc.)',
        'No scanner app required — use the verify/redeem API with your own tools',
      ],
    },
    createEvent: {
      title: 'Create Event',
      connectWallet: 'Connect your wallet to create an event',
      ensSubdomain: 'ENS Subdomain',
      eventDetails: 'Event Details',
      artistSlug: 'Artist Slug',
      eventSlug: 'Event Slug',
      eventName: 'Event Name',
      eventDate: 'Event Date',
      venueName: 'Venue Name',
      promoterWallet: 'Promoter Wallet',
      promoterRoyalty: 'Promoter Secondary Royalty (bps — e.g. 250 = 2.5%)',
      platformNote: 'Platform royalty is fixed at 1.5% (150 bps). Total:',
      transferability: 'Ticket Transferability',
      soulboundDesc: "Soulbound — tickets are locked to the buyer's wallet. Cannot be resold on secondary markets.",
      transferableDesc: 'Transferable — tickets can be resold and traded on secondary markets.',
      soulboundNote: 'Soulbound can be toggled after deployment — you can unlock transfers post-event.',
      transferableNote: 'Transferable tickets earn royalties on secondary sales (platform 1.5% + your royalty).',
      ipfsImage: 'IPFS Image URI (optional)',
      merkleRoot: 'Merkle Root (optional — leave blank for open sale)',
      submit: 'Create Event & Get Invoice',
      submitting: 'Creating...',
      invoiceTitle: 'Invoice Created',
      invoiceId: 'Invoice ID',
      ensName: 'ENS Name',
      platformRoyalty: 'Platform Royalty',
      amountDue: 'Amount Due',
      sendTo: 'Send USDC to',
      confirmPayment: 'Confirm Payment',
      confirmDesc: 'After sending USDC, paste your transaction hash below to activate the event.',
      txHashPlaceholder: '0x transaction hash...',
      confirming: 'Confirming...',
      confirm: 'Confirm Payment',
      eventActive: 'Event Active!',
      ticketContract: 'Ticket Contract',
      splitter: 'Splitter Contract',
      ipfsManifest: 'IPFS',
      viewDashboard: 'View Event Dashboard',
    },
    event: {
      notFound: 'Event not found',
      totalSeats: 'Total Seats',
      sold: 'Sold',
      available: 'Available',
      soldPct: 'Sold %',
      sections: 'Sections',
      contracts: 'Contracts',
      ticketNft: 'Ticket NFT',
      splitter: 'Splitter',
    },
    apiKeys: {
      title: 'API Keys',
      platformKey: 'Platform API Key',
      description: 'Your API key is stored locally in your browser and sent as',
      keyLabel: 'API Key',
      keyPlaceholder: 'Enter your API key...',
      save: 'Save Key',
      saved: '✓ Saved',
      clear: 'Clear',
      apiReference: 'API Reference',
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Questions about integrating boleto.eth? Want to list your event? Get in touch.',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      subject: 'Subject',
      subjectPlaceholder: 'Integration inquiry, partnership, etc.',
      message: 'Message',
      messagePlaceholder: 'Tell us about your event, project, or question...',
      submit: 'Send Message',
      sending: 'Sending...',
      success: 'Message sent! We\'ll be in touch soon.',
      error: 'Something went wrong. Please try again.',
    },
  },
  es: {
    nav: {
      createEvent: 'Crear Evento',
      apiKeys: 'Claves API',
      scanner: 'Mis Eventos',
    },
    home: {
      tagline: 'Protocolo de Boletería Web3',
      description: 'Infraestructura de boletería Web3 para eventos latinoamericanos. Emite tickets NFT basados en subdominios ENS en Ethereum con identidad permanente en cadena.',
      createEvent: 'Crear Evento',
      howItWorks: 'Cómo Funciona',
      pricingTitle: 'Calculadora de Precios',
      ticketCount: 'Cantidad de Tickets',
      tier: 'Nivel',
      rate: 'Tarifa',
      tickets: 'Tickets',
      protocolFee: 'Tarifa de Protocolo',
      pricingNote: 'Pago único por adelantado. El 100% de los ingresos de venta de tickets va al promotor.',
      pricingSubtitle: 'Un pago único. El 100% de los ingresos de tickets va para ti.',
      howItWorksSubtitle: 'Del registro del evento al scanner de puerta en tres pasos',
      howItWorksDetail1: 'Pago en USDC en Ethereum mainnet',
      howItWorksDetail2: 'REST API — cualquier lenguaje, cualquier plataforma',
      howItWorksDetail3: 'Verificación en cadena, confirmación instantánea',
      guaranteesSubtitle: 'Construido en estándares abiertos. Sin bloqueo de proveedor.',
      statsReservedArtists: 'Artistas Reservados',
      statsPlatformRoyalty: 'Regalía de Plataforma',
      statsCheapMinting: 'Minteo Económico',
      step01Title: 'Registra tu Evento',
      step01Desc: 'Paga la tarifa de protocolo en USDC. Obtén un subdominio ENS como badbunny-miami25.boleto.eth',
      step02Title: 'Mintea los Tickets',
      step02Desc: 'Emite tickets NFT ERC-721 en Ethereum vía REST API. Cada ticket es soulbound o transferible — tú decides.',
      step03Title: 'Verifica y Canjea',
      step03Desc: 'Usa los endpoints de verificación/canje con tu propio scanner. Sin app necesaria.',
      guaranteesTitle: 'Garantías del Protocolo',
      guarantees: [
        'Subdominios ENS en Ethereum L1 — identidad permanente y verificable',
        'Tickets NFT en Ethereum — minteo económico, confirmación rápida',
        'Soulbound o transferible — configurable por evento, el promotor puede cambiarlo',
        '1% regalía del promotor en ventas secundarias — fija, va directamente al promotor',
        'Slugs de artistas reservados protegen a los grandes actos (Bad Bunny, Shakira, etc.)',
        'No se necesita app de scanner — usa los endpoints de la API con tus propias herramientas',
      ],
    },
    createEvent: {
      title: 'Crear Evento',
      connectWallet: 'Conecta tu wallet para crear un evento',
      ensSubdomain: 'Subdominio ENS',
      eventDetails: 'Detalles del Evento',
      artistSlug: 'Slug del Artista',
      eventSlug: 'Slug del Evento',
      eventName: 'Nombre del Evento',
      eventDate: 'Fecha del Evento',
      venueName: 'Nombre del Venue',
      promoterWallet: 'Wallet del Promotor',
      promoterRoyalty: 'Regalía Secundaria del Promotor (bps — ej. 250 = 2.5%)',
      platformNote: 'La regalía de plataforma es fija en 1.5% (150 bps). Total:',
      transferability: 'Transferibilidad del Ticket',
      soulboundDesc: 'Soulbound — los tickets están bloqueados a la wallet del comprador. No se pueden revender.',
      transferableDesc: 'Transferible — los tickets se pueden revender y comerciar en mercados secundarios.',
      soulboundNote: 'El modo soulbound se puede cambiar después del despliegue — puedes habilitar transferencias post-evento.',
      transferableNote: 'Los tickets transferibles generan regalías en ventas secundarias (plataforma 1.5% + tu regalía).',
      ipfsImage: 'URI de Imagen IPFS (opcional)',
      merkleRoot: 'Merkle Root (opcional — deja en blanco para venta abierta)',
      submit: 'Crear Evento y Obtener Factura',
      submitting: 'Creando...',
      invoiceTitle: 'Factura Creada',
      invoiceId: 'ID de Factura',
      ensName: 'Nombre ENS',
      platformRoyalty: 'Regalía de Plataforma',
      amountDue: 'Monto a Pagar',
      sendTo: 'Enviar USDC a',
      confirmPayment: 'Confirmar Pago',
      confirmDesc: 'Después de enviar USDC, pega el hash de tu transacción para activar el evento.',
      txHashPlaceholder: '0x hash de la transacción...',
      confirming: 'Confirmando...',
      confirm: 'Confirmar Pago',
      eventActive: '¡Evento Activo!',
      ticketContract: 'Contrato de Tickets',
      splitter: 'Contrato Splitter',
      ipfsManifest: 'IPFS',
      viewDashboard: 'Ver Panel del Evento',
    },
    event: {
      notFound: 'Evento no encontrado',
      totalSeats: 'Total Asientos',
      sold: 'Vendidos',
      available: 'Disponibles',
      soldPct: '% Vendido',
      sections: 'Secciones',
      contracts: 'Contratos',
      ticketNft: 'NFT Ticket',
      splitter: 'Splitter',
    },
    apiKeys: {
      title: 'Claves API',
      platformKey: 'Clave API de Plataforma',
      description: 'Tu clave API se almacena localmente en tu navegador y se envía como',
      keyLabel: 'Clave API',
      keyPlaceholder: 'Introduce tu clave API...',
      save: 'Guardar Clave',
      saved: '✓ Guardado',
      clear: 'Limpiar',
      apiReference: 'Referencia de la API',
    },
    contact: {
      title: 'Contáctenos',
      subtitle: '¿Preguntas sobre integrar boleto.eth? ¿Quieres listar tu evento? Escríbenos.',
      name: 'Nombre',
      namePlaceholder: 'Tu nombre',
      email: 'Correo',
      emailPlaceholder: 'tu@correo.com',
      subject: 'Asunto',
      subjectPlaceholder: 'Consulta de integración, alianza, etc.',
      message: 'Mensaje',
      messagePlaceholder: 'Cuéntanos sobre tu evento, proyecto o pregunta...',
      submit: 'Enviar Mensaje',
      sending: 'Enviando...',
      success: '¡Mensaje enviado! Te contactaremos pronto.',
      error: 'Algo salió mal. Por favor intenta de nuevo.',
    },
  },
} as const

type Translations = typeof translations.en
export type { Translations }

const I18nContext = createContext<{
  locale: Locale
  t: typeof translations[Locale]
  setLocale: (l: Locale) => void
}>({
  locale: 'en',
  t: translations.en,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('boleto_locale') as Locale | null
    if (stored === 'en' || stored === 'es') setLocaleState(stored)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('boleto_locale', l)
  }

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  return (
    <div className="flex items-center gap-1 bg-[#161616] border border-[#1f1f1f] rounded px-1 py-0.5">
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
          locale === 'en' ? 'bg-[#f97316] text-white' : 'text-[#666] hover:text-[#f0f0f0]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
          locale === 'es' ? 'bg-[#f97316] text-white' : 'text-[#666] hover:text-[#f0f0f0]'
        }`}
      >
        ES
      </button>
    </div>
  )
}
