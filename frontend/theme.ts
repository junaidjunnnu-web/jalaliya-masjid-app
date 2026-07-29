export const theme = {
  colors: {
    primary: '#A8927E',      // Warm tan — base color, headers
    addButtonColor: '#8C3B4A',  // Deep rose red — Add/Create buttons
    membersAccent: '#A8927E',   // Warm tan — unified across all sections
    committeeAccent: '#A8927E',  // Warm tan — unified across all sections
    eventsAccent: '#A8927E',     // Warm tan — unified across all sections
    announcementsAccent: '#A8927E',  // Warm tan — unified across all sections
    galleryAccent: '#A8927E',    // Warm tan — unified across all sections
    feesAccent: '#A8927E',       // Warm tan — unified across all sections
    background: '#FAF6EE',   // Soft Ivory
    textPrimary: '#2B2B2B',  // Charcoal Ink
    success: '#6B9080',      // Sage — paid/approved badges
    alert: '#C15C3D',        // Terracotta — unpaid/pending badges
    whatsapp: '#25D366',     // WhatsApp brand green
    white: '#FFFFFF',
    gray: {
      100: '#E8E0D8',
      200: '#D4C8BC',
      300: '#C0B0A0',
      400: '#A8927E',
      500: '#A8927E',
      600: '#8B7355',
    },
  },
  typography: {
    display: 'Lora',         // section headers — dignified, warm serif
    body: 'Manrope',         // everything else — clean, legible
    numerals: 'tabular-nums', // for fee amounts, countdown timer
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    button: 14,
    card: 16,
    pill: 20,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

export type Theme = typeof theme;
