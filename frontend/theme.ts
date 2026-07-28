export const theme = {
  colors: {
    primary: '#0F3D3E',      // Deep green — Members/Families section
    committeeAccent: '#E8B923',  // Yellow — Committee section
    eventsAccent: '#E0722E',     // Orange — Events section
    announcementsAccent: '#C4304E',  // Rose red — Announcements section
    galleryAccent: '#6E6E68',    // Gray — Gallery section
    feesAccent: '#E02E2E',       // Bright red — Fees/Collections/Expenses section
    background: '#FAF6EE',   // Soft Ivory
    textPrimary: '#2B2B2B',  // Charcoal Ink
    success: '#6B9080',      // Sage — paid/approved badges
    alert: '#C15C3D',        // Terracotta — unpaid/pending badges
    whatsapp: '#25D366',     // WhatsApp brand green
    white: '#FFFFFF',
    gray: {
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
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
