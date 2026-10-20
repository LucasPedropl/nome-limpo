import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
  className?: string
}

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={cn(
        'group relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-raised text-cream-dim transition-all duration-200 hover:border-brand/40 hover:text-cream active:scale-95 shadow-sm',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  )
}
