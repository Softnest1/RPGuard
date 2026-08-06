// Conteneur de page universel — adaptatif de 320px (mobile) à 4K (3840px)
// Utilisation : <PageContainer> ... </PageContainer>

import type { ReactNode } from 'react';

type ContainerWidth = 'content' | 'wide' | 'xl' | 'full' | 'fluid';

interface PageContainerProps {
  children: ReactNode;
  width?: ContainerWidth;
  className?: string;
  /** Padding vertical de la section (défaut: py-12 md:py-20 3xl:py-28) */
  padded?: boolean;
}

const WIDTH_MAP: Record<ContainerWidth, string> = {
  content: 'max-w-content 3xl:max-w-content-lg',         // 900px → 1152px
  wide:    'max-w-content-lg 2xl:max-w-content-xl 4xl:max-w-content-2xl',      // 1152px → 1400px → 1680px
  xl:      'max-w-content-xl 2xl:max-w-content-2xl 4xl:max-w-content-3xl',     // 1400px → 1680px → 2000px
  full:    'max-w-content-3xl 4xl:max-w-screen-4xl',     // 2000px → 2560px
  fluid:   'w-full',                                     // 100%
};

export default function PageContainer({
  children,
  width = 'wide',
  className = '',
  padded = false,
}: PageContainerProps) {
  return (
    <div
      className={[
        WIDTH_MAP[width],
        'mx-auto',
        'w-full',
        'px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 4xl:px-24',
        padded ? 'py-12 md:py-20 2xl:py-28 4xl:py-36' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

// ── Section wrapper — pour les grandes sections de page ──────────────────
interface SectionProps {
  children: ReactNode;
  className?: string;
  /** Padding vertical automatique selon la résolution */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SECTION_PAD: Record<NonNullable<SectionProps['size']>, string> = {
  sm: 'py-8 md:py-12 2xl:py-16 4xl:py-20',
  md: 'py-12 md:py-20 2xl:py-28 4xl:py-36',
  lg: 'py-16 md:py-28 2xl:py-36 4xl:py-48',
  xl: 'py-20 md:py-32 2xl:py-44 4xl:py-56',
};

export function Section({ children, className = '', size = 'md' }: SectionProps) {
  return (
    <section className={[SECTION_PAD[size], className].filter(Boolean).join(' ')}>
      {children}
    </section>
  );
}
