import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      zType: {
        // --- Estándar Zard UI ---
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/20',
        outline: 'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',

        // --- Semánticos (Soft / Subtle / Ghost) ---
        success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 [a&]:hover:bg-emerald-500/25',
        warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 [a&]:hover:bg-amber-500/25',
        info: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20 [a&]:hover:bg-sky-500/25',
        danger: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20 [a&]:hover:bg-red-500/25',

        // --- Sólidos por color ---
        'emerald-solid': 'bg-emerald-600 text-white [a&]:hover:bg-emerald-700',
        'amber-solid': 'bg-amber-600 text-white [a&]:hover:bg-amber-700',
        'sky-solid': 'bg-sky-600 text-white [a&]:hover:bg-sky-700',
        'indigo-solid': 'bg-indigo-600 text-white [a&]:hover:bg-indigo-700',
        'violet-solid': 'bg-violet-600 text-white [a&]:hover:bg-violet-700',
        'purple-solid': 'bg-purple-600 text-white [a&]:hover:bg-purple-700',
        'rose-solid': 'bg-rose-600 text-white [a&]:hover:bg-rose-700',
        'slate-solid': 'bg-slate-700 text-white dark:bg-slate-800 [a&]:hover:bg-slate-800',

        // --- Soft / Ghost por color (Fondo traslúcido suave) ---
        'emerald-ghost': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 [a&]:hover:bg-emerald-500/20',
        'amber-ghost': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 [a&]:hover:bg-amber-500/20',
        'sky-ghost': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 [a&]:hover:bg-sky-500/20',
        'indigo-ghost': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 [a&]:hover:bg-indigo-500/20',
        'violet-ghost': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 [a&]:hover:bg-violet-500/20',
        'purple-ghost': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 [a&]:hover:bg-purple-500/20',
        'rose-ghost': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 [a&]:hover:bg-rose-500/20',
        'slate-ghost': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 [a&]:hover:bg-slate-500/20',

        // --- Outline con color (Borde sutil + texto de color) ---
        'emerald-outline': 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 [a&]:hover:bg-emerald-500/15',
        'amber-outline': 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 [a&]:hover:bg-amber-500/15',
        'sky-outline': 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5 [a&]:hover:bg-sky-500/15',
        'indigo-outline': 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 [a&]:hover:bg-indigo-500/15',
        'violet-outline': 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5 [a&]:hover:bg-violet-500/15',
        'rose-outline': 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 [a&]:hover:bg-rose-500/15',
      },
    },
    defaultVariants: {
      zType: 'default',
    },
  },
);

export type ZardBadgeTypeVariants = NonNullable<VariantProps<typeof badgeVariants>['zType']>;

