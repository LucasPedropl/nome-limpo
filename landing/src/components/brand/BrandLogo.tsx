import logoMark from '@/assets/logo-mark.png'
import { cn } from '@/lib/cn'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  // Escudo da logo oficial (igual nos dois temas) + nome em texto, que acompanha as cores do tema
  const sizes = {
    sm: { mark: 'h-7 sm:h-8 md:h-9', top: 'text-[8px] sm:text-[9px]', name: 'text-[15px] sm:text-[17px] md:text-lg' },
    // No lg o menu inteiro divide a linha com a logo: ela fica mais estreita até o xl
    md: { mark: 'h-7 sm:h-10 lg:h-8 xl:h-11', top: 'text-[7px] sm:text-[10px] lg:text-[8px] xl:text-[10px]', name: 'text-xs sm:text-xl lg:text-base xl:text-[22px]' },
    lg: { mark: 'h-10 sm:h-12 xl:h-13', top: 'text-[10px] sm:text-xs', name: 'text-xl sm:text-2xl xl:text-[28px]' },
  }[size]

  return (
    <div className={cn('inline-flex items-center gap-1.5 sm:gap-2 select-none group shrink-0 min-w-0', className)}>
      <img
        src={logoMark}
        alt=""
        width={160}
        height={160}
        className={cn(
          'w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-[1.03] drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(16,185,129,0.22)]',
          sizes.mark
        )}
      />
      <span className="flex flex-col leading-none whitespace-nowrap">
        <span className={cn('font-bold uppercase tracking-[0.34em] text-brand-light', sizes.top)}>Seu</span>
        <span className={cn('mt-0.5 font-black uppercase tracking-tight text-cream', sizes.name)}>Nome Limpo</span>
      </span>
    </div>
  )
}
