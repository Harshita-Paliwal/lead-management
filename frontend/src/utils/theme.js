// Shared color tokens keep UI colors consistent across all screens.
export const COLORS = {
  primary: '#0FA7B8',
  primaryDark: '#0A4E63',
  primaryLight: '#DDF8FB',
  accent: '#22D3EE',
  background: '#EAF7FA',
  white: '#FFFFFF',
  text: '#0B1F2A',
  textSecondary: '#4A6A78',
  gray: '#7B97A5',
  grayLight: '#F3F8FA',
  grayBorder: '#CDE2E8',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

// Status badge colors make lead stage easy to scan.
export const STATUS_COLORS = {
  'In Progress': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  Converted: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  Lost: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
};

// Type badge colors quickly distinguish lead categories.
export const TYPE_COLORS = {
  Product: { bg: '#DBEAFE', text: '#1D4ED8' },
  Development: { bg: '#EDE9FE', text: '#6D28D9' },
  Resources: { bg: '#CCFBF1', text: '#0F766E' },
  Other: { bg: '#E5E7EB', text: '#374151' },
};
