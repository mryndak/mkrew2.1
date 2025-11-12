import type { Feature, Step, Testimonial, FooterSection } from '../types/landing';

export const features: Feature[] = [
  {
    id: 'feature-1',
    title: 'Aktualny stan zapasów krwi',
    description: 'Sprawdź w czasie rzeczywistym stan zapasów krwi we wszystkich RCKiK w Polsce',
    icon: 'blood-drop'
  },
  {
    id: 'feature-2',
    title: 'Dziennik donacji',
    description: 'Prowadź osobisty dziennik swoich donacji i eksportuj dane w dowolnym momencie',
    icon: 'calendar'
  },
  {
    id: 'feature-3',
    title: 'Powiadomienia',
    description: 'Otrzymuj alerty e-mail i w aplikacji, gdy Twoje ulubione RCKiK potrzebują krwi',
    icon: 'bell'
  },
  {
    id: 'feature-4',
    title: 'Historia i trendy',
    description: 'Zobacz historyczne dane i trendy zapasów krwi w poszczególnych centrach',
    icon: 'chart'
  }
];

export const steps: Step[] = [
  {
    number: 1,
    title: 'Zarejestruj się',
    description: 'Załóż darmowe konto i podaj swoją grupę krwi',
    icon: 'user-plus'
  },
  {
    number: 2,
    title: 'Wybierz RCKiK',
    description: 'Wybierz swoje ulubione centra krwiodawstwa',
    icon: 'map-pin'
  },
  {
    number: 3,
    title: 'Otrzymuj powiadomienia',
    description: 'Bądź na bieżąco z potrzebami wybranych centrów',
    icon: 'bell'
  },
  {
    number: 4,
    title: 'Oddaj krew',
    description: 'Udaj się do centrum i zapisz donację w swoim dzienniku',
    icon: 'heart'
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    author: 'Jan Kowalski',
    role: 'Dawca krwi od 3 lat',
    content: 'Dzięki mkrew zawsze wiem, kiedy moja krew jest najbardziej potrzebna. Aplikacja jest intuicyjna i bardzo pomocna.',
    avatar: '/avatars/user1.jpg'
  },
  {
    id: 'testimonial-2',
    author: 'Anna Nowak',
    role: 'Honorowy dawca krwi',
    content: 'Wreszcie mogę łatwo śledzić historię swoich donacji i otrzymywać powiadomienia. Polecam każdemu dawcy!',
    avatar: '/avatars/user2.jpg'
  }
];

export const footerSections: FooterSection[] = [
  {
    title: 'O projekcie',
    links: [
      { label: 'O nas', href: '/o-nas', external: false },
      { label: 'Jak to działa', href: '/#how-it-works', external: false },
      { label: 'Kontakt', href: '/kontakt', external: false }
    ]
  },
  {
    title: 'Prawne',
    links: [
      { label: 'Polityka prywatności', href: '/polityka-prywatnosci', external: false },
      { label: 'Regulamin', href: '/regulamin', external: false },
      { label: 'GDPR', href: '/gdpr', external: false }
    ]
  },
  {
    title: 'Linki',
    links: [
      { label: 'Lista RCKiK', href: '/rckik', external: false },
      { label: 'Blog', href: '/blog', external: false }
    ]
  }
];
