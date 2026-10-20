import logoLight from '@/assets/logo-light.png'
import logoDark from '@/assets/logo-dark.png'
import { cn } from '@/lib/cn'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  // Proporção horizontal ~3.5:1 da logo oficial da marca
  const sizeClasses = {
    sm: 'h-8 sm:h-9 w-auto',
    md: 'h-9 sm:h-10 xl:h-11 w-auto',
    lg: 'h-11 sm:h-13 w-auto',
  }[size]

  return (
    <div className={cn('inline-flex items-center select-none group shrink-0', className)}>
      {/* Versão Tema Claro (Logotipo oficial completo em imagem, sem texto HTML) */}
      <img
        src={logoLight}
        alt="Nome Limpo Express"
        width={388}
        height={110}
        className={cn(
          'logo-light-version object-contain shrink-0 transition-all duration-300 group-hover:scale-[1.02] drop-shadow-sm',
          sizeClasses
        )}
      />

      {/* Versão Tema Escuro (Logotipo oficial para alto contraste no tema escuro) */}
      <img
        src={logoDark}
        alt="Nome Limpo Express"
        width={388}
        height={110}
        className={cn(
          'logo-dark-version object-contain shrink-0 transition-all duration-300 group-hover:scale-[1.02] drop-shadow-[0_2px_12px_rgba(16,185,129,0.22)]',
          sizeClasses
        )}
      />
    </div>
  )
}
