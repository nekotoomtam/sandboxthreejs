import type { ObjectTransform, TransformPatch, TransformProperty } from '../sandbox.types'

const controlGroups: Array<{
  property: TransformProperty
  label: string
  icon: string
  min: number
  max: number
  step: number
  unit?: string
}> = [
  { property: 'position', label: 'ตำแหน่ง', icon: '↗', min: -3, max: 3, step: 0.1 },
  { property: 'rotation', label: 'การหมุน', icon: '↻', min: -180, max: 180, step: 1, unit: '°' },
  { property: 'scale', label: 'ขนาด', icon: '↔', min: 0.25, max: 2.5, step: 0.05 },
]

const axes = ['x', 'y', 'z'] as const

type TransformControlsPanelProps = {
  transform?: ObjectTransform
  onChange: (patch: TransformPatch) => void
}

export function TransformControlsPanel({ transform, onChange }: TransformControlsPanelProps) {
  if (!transform) {
    return <div className="p-5 text-sm text-[#6c7d78]">กำลังเตรียมฉากทดลอง…</div>
  }

  return (
    <div className="space-y-5 p-5">
      {controlGroups.map((group) => (
        <fieldset key={group.property} className="space-y-3">
          <legend className="mb-1 flex w-full items-center gap-2 text-sm font-extrabold text-[#23463e]">
            <span className="grid size-6 place-items-center rounded-md bg-[#e8efec] text-xs">
              {group.icon}
            </span>
            {group.label}
          </legend>

          {axes.map((axis, axisIndex) => {
            const value = transform[group.property][axisIndex]
            return (
              <label key={axis} className="grid grid-cols-[18px_1fr_76px] items-center gap-2">
                <span className={`axis-label axis-${axis}`}>{axis.toUpperCase()}</span>
                <input
                  type="range"
                  min={group.min}
                  max={group.max}
                  step={group.step}
                  value={value}
                  onChange={(event) =>
                    onChange({ [group.property]: { [axis]: Number(event.target.value) } })
                  }
                  aria-label={`${group.label}แกน ${axis.toUpperCase()}`}
                />
                <span className="relative">
                  <input
                    className="w-full rounded-lg border border-[#dbe3e0] bg-white px-2 py-1.5 pr-5 text-right font-mono text-xs text-[#2e4a43] outline-none transition focus:border-[#3b8b74] focus:ring-2 focus:ring-[#3b8b74]/10"
                    type="number"
                    min={group.min}
                    max={group.max}
                    step={group.step}
                    value={Number(value.toFixed(2))}
                    onChange={(event) =>
                      onChange({ [group.property]: { [axis]: Number(event.target.value) } })
                    }
                    aria-label={`ค่าตัวเลข${group.label}แกน ${axis.toUpperCase()}`}
                  />
                  {group.unit && (
                    <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-[#82918c]">
                      {group.unit}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </fieldset>
      ))}
    </div>
  )
}
