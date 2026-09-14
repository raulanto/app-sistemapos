import { cva, type VariantProps } from 'class-variance-authority';

import { mergeClasses } from '@/shared/utils/merge-classes';

export const buttonVariants = cva(
  mergeClasses(
    "group/button cursor-pointer inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-200 active:scale-95 outline-none select-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      zType: {
        default:
          'bg-gradient-to-b from-neutral-800 to-neutral-950 text-neutral-50 shadow-[0px_0px_10px_0px_rgba(255,255,255,0.1)_inset] ring ring-white/10 ring-inset ring-offset-2 ring-offset-neutral-950 hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.2)_inset] hover:ring-white/20 dark:bg-gradient-to-b dark:from-neutral-50 dark:to-neutral-200 dark:text-neutral-900 dark:shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)_inset] dark:ring-black/5 dark:ring-inset dark:ring-offset-2 dark:ring-offset-neutral-50 dark:hover:shadow-[0px_0px_20px_0px_rgba(0,0,0,0.1)_inset] dark:hover:ring-black/10',
        secondary:
          'bg-gradient-to-b from-neutral-50 to-neutral-200 text-neutral-900 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)_inset] ring ring-black/5 ring-inset ring-offset-2 ring-offset-neutral-50 hover:shadow-[0px_0px_20px_0px_rgba(0,0,0,0.1)_inset] hover:ring-black/10 dark:bg-gradient-to-b dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-50 dark:shadow-[0px_0px_10px_0px_rgba(255,255,255,0.1)_inset] dark:ring-white/10 dark:ring-inset dark:ring-offset-2 dark:ring-offset-neutral-950 dark:hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.2)_inset] dark:hover:ring-white/20',
        outline:
          'bg-gradient-to-b from-transparent to-neutral-100 text-neutral-900 shadow-[0px_0px_6px_0px_rgba(0,0,0,0.03)_inset] hover:shadow-[0px_0px_12px_0px_rgba(0,0,0,0.06)_inset] ring ring-neutral-300 ring-inset ring-offset-2 ring-offset-neutral-50 hover:ring-neutral-400 dark:bg-gradient-to-b dark:from-transparent dark:to-neutral-900 dark:text-neutral-100 dark:shadow-[0px_0px_6px_0px_rgba(255,255,255,0.05)_inset] dark:hover:shadow-[0px_0px_12px_0px_rgba(255,255,255,0.1)_inset] dark:ring-neutral-800 dark:ring-inset dark:ring-offset-2 dark:ring-offset-neutral-950 dark:hover:ring-neutral-700',
        ghost:
          'bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-gradient-to-b hover:from-neutral-50 hover:to-neutral-200 hover:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.04)_inset] hover:ring hover:ring-black/5 hover:ring-inset hover:ring-offset-2 hover:ring-offset-neutral-50 dark:bg-transparent dark:text-neutral-400 dark:hover:text-neutral-50 dark:hover:bg-gradient-to-b dark:hover:from-neutral-800 dark:hover:to-neutral-900 dark:hover:shadow-[0px_0px_8px_0px_rgba(255,255,255,0.08)_inset] dark:hover:ring dark:hover:ring-white/10 dark:hover:ring-inset dark:hover:ring-offset-2 dark:hover:ring-offset-neutral-950',
        destructive:
          'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0px_0px_10px_0px_rgba(255,255,255,0.15)_inset] ring ring-red-700/20 ring-inset ring-offset-2 ring-offset-red-500 hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.25)_inset] hover:ring-red-700/30 dark:bg-gradient-to-b dark:from-red-600 dark:to-red-800 dark:text-red-50 dark:shadow-[0px_0px_10px_0px_rgba(255,255,255,0.1)_inset] dark:ring-red-500/20 dark:ring-inset dark:ring-offset-2 dark:ring-offset-red-950 dark:hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.2)_inset] dark:hover:ring-red-500/30',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      zSize: {
        default: 'h-10 gap-1.5 px-5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-4 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 gap-1.5 px-6 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xl: 'h-16 gap-2 px-12 text-xl !rounded-2xl',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
      zShape: {
        default: 'rounded-xl',
        circle: 'rounded-full',
        square: 'rounded-none',
      },
      zLoading: {
        true: 'pointer-events-none opacity-50',
      },
      zDisabled: {
        true: 'pointer-events-none opacity-50',
      },
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
      zShape: 'default',
    },
  },
);
export type ZardButtonShapeVariants = NonNullable<VariantProps<typeof buttonVariants>['zShape']>;
export type ZardButtonSizeVariants = NonNullable<VariantProps<typeof buttonVariants>['zSize']>;
export type ZardButtonTypeVariants = NonNullable<VariantProps<typeof buttonVariants>['zType']>;
