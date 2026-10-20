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
      {/* Versão Tema Claro (Logotipo completo em imagem, sem texto HTML) */}
      <img
        src="/logo-light.png"
        alt="Nome Limpo Express"
        className={cn(
          'block dark:hidden object-contain shrink-0 transition-all duration-300 group-hover:scale-[1.02] drop-shadow-sm',
          sizeClasses
        )}
      />

      {/* Versão Tema Escuro (Logotipo adaptado para alto contraste em fundo escuro) */}
      <img
        src="/logo-dark.png"
        alt="Nome Limpo Express"
        className={cn(
          'hidden dark:block object-contain shrink-0 transition-all duration-300 group-hover:scale-[1.02] drop-shadow-[0_2px_12px_rgba(16,185,129,0.22)]',
          sizeClasses
        )}
      />
    </div>
  )
}
