import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'signal' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  className?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none text-center cursor-pointer disabled:pointer-events-none disabled:opacity-50'

  const sizeClasses = {
    sm: 'rounded-lg px-3.5 py-1.5 text-xs',
    md: 'rounded-xl px-5 py-2.5 text-sm',
    lg: 'rounded-xl px-7 py-3.5 text-base shadow-lg',
  }[size]

  const variantClasses = {
    primary:
      'bg-brand text-white font-bold hover:bg-brand-dark dark:hover:bg-brand-light shadow-[0_12px_28px_-10px_hsl(var(--brand)/0.5)] active:scale-[0.98]',
    secondary:
      'bg-ink-raised text-cream hover:bg-ink-sunken border border-line active:scale-[0.98]',
    ghost:
      'text-cream-dim hover:text-cream hover:bg-ink-raised active:scale-[0.98]',
    signal:
      'bg-signal text-white font-bold hover:brightness-110 shadow-[0_12px_28px_-10px_hsl(var(--signal)/0.5)] active:scale-[0.98]',
    outline:
      'border-2 border-brand text-brand-light hover:bg-brand/10 active:scale-[0.98]',
    danger:
      'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-[0.98]',
  }[variant]

  return (
    <button
      className={cn(baseClasses, sizeClasses, variantClasses, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
