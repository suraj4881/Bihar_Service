/**
 * Shared SewaBihar visual tokens — keep in sync with home hero (teal) and ThemeContext primary.
 */

export const SEWA = {
  teal: '#004D40',
  tealMid: '#00695C',
  accent: '#26A69A',
  tealLight: '#00897B',
} as const;

/** Full-page background behind auth / marketing split cards */
export const sewaPageBg = (mode: 'light' | 'dark'): string =>
  mode === 'dark'
    ? 'linear-gradient(165deg, #001f1a 0%, #0d1514 45%, #0a1211 100%)'
    : 'linear-gradient(165deg, #004D40 0%, #00695C 48%, #00897B 100%)';

/** Decorative overlay dots (optional) */
export const sewaPageBgOverlay = (mode: 'light' | 'dark'): string =>
  mode === 'dark'
    ? `radial-gradient(circle at 20% 30%, rgba(38, 166, 154, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 80% 70%, rgba(0, 105, 92, 0.1) 0%, transparent 50%)`
    : `radial-gradient(circle at 15% 40%, rgba(255,255,255,0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)`;

/** Left branding column on login (glass on teal) */
export const sewaAuthBrandPanel = (mode: 'light' | 'dark'): string =>
  mode === 'dark'
    ? 'linear-gradient(180deg, rgba(0, 77, 64, 0.45) 0%, rgba(0, 105, 92, 0.35) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)';

export const sewaPrimaryButtonGradient =
  'linear-gradient(135deg, #00897B 0%, #00695C 55%, #004D40 100%)';

export const sewaPrimaryButtonHover =
  'linear-gradient(135deg, #26A69A 0%, #00897B 55%, #00695C 100%)';

/** Public page hero strip (About, Contact) */
export const sewaHeroBarGradient =
  'linear-gradient(165deg, #004D40 0%, #00695C 40%, #00897B 100%)';

/** Stats / emphasis panels */
export const sewaAccentPanelGradient =
  'linear-gradient(135deg, #00695C 0%, #004D40 100%)';
