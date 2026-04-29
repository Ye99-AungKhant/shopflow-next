"use client";
import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow-sm',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80',
      outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 shadow-sm',
      ghost: 'hover:bg-zinc-100 hover:text-zinc-900',
      danger: 'bg-red-500 text-white hover:bg-red-500/90 shadow-sm',
    };
    
    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-8',
      icon: 'h-9 w-9 flex items-center justify-center rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 rounded-md text-sm",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
