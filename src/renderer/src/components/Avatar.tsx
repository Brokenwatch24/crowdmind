import { generateAvatarSpec } from '@shared/avatar'
import { cn } from '@renderer/lib/utils'

export function Avatar({ seed, name, size = 32, className }: { seed: string; name: string; size?: number; className?: string }) {
  const { initials, colorFrom, colorTo } = generateAvatarSpec(seed, name)
  return (
    <div
      className={cn('flex items-center justify-center rounded-full flex-none font-mono-label font-bold text-bg', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`
      }}
    >
      {initials}
    </div>
  )
}
