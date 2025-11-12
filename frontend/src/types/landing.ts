/**
 * Reprezentuje pojedynczą funkcjonalność aplikacji
 */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: string; // nazwa ikony lub ścieżka do SVG/obrazu
}

/**
 * Reprezentuje krok w sekcji "Jak to działa"
 */
export interface Step {
  number: number;
  title: string;
  description: string;
  icon?: string;
}

/**
 * Reprezentuje opinię/testimonial użytkownika
 */
export interface Testimonial {
  id: string;
  author: string;
  role?: string; // np. "Dawca krwi od 5 lat"
  content: string;
  avatar?: string; // ścieżka do obrazu avatara
}

/**
 * Reprezentuje pojedynczy link w footerze
 */
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean; // czy link prowadzi poza aplikację
  ariaLabel?: string;
}

/**
 * Reprezentuje sekcję (kolumnę) w footerze
 */
export interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Warianty stylistyczne przycisku
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline';

/**
 * Rozmiary przycisku
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props komponentu Button
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  class?: string;
}
