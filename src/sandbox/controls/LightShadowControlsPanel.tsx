import type { SandboxSnapshot, Vector3Tuple } from '../sandbox.types'

type LightShadowControlsPanelProps = {
  snapshot: SandboxSnapshot
  lightId: string
  casterObjectId: string
  receiverObjectId: string
  onChange: (snapshot: SandboxSnapshot) => void
}

type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const axes = ['X', 'Y', 'Z'] as const

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#dfe7e4] bg-white px-3 py-2.5 text-xs font-bold text-[#31564c]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="size-4 accent-[#f3a83b]"
      />
    </label>
  )
}

export function LightShadowControlsPanel({
  snapshot,
  lightId,
  casterObjectId,
  receiverObjectId,
  onChange,
}: LightShadowControlsPanelProps) {
  const light = snapshot.lights[lightId]
  const caster = snapshot.objects[casterObjectId]
  const receiver = snapshot.objects[receiverObjectId]

  if (!light || !caster || !receiver) {
    return <div className="p-5 text-sm text-[#6c7d78]">กำลังเตรียมแสงและเงา…</div>
  }

  const updateLightPosition = (axisIndex: number, value: number) => {
    const position = [...light.position] as [number, number, number]
    position[axisIndex] = value
    onChange({
      ...snapshot,
      lights: {
        ...snapshot.lights,
        [lightId]: { ...light, position: position as Vector3Tuple },
      },
    })
  }

  return (
    <div className="space-y-5 p-5">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-extrabold text-[#23463e]">
          เปิดสายการทำงานของเงา
        </legend>
        <Toggle
          label="เปิด Shadow Map"
          checked={snapshot.renderer.shadowMapEnabled}
          onChange={(shadowMapEnabled) =>
            onChange({
              ...snapshot,
              renderer: { shadowMapEnabled },
            })
          }
        />
        <Toggle
          label="ให้กล่องทอดเงา"
          checked={caster.castShadow}
          onChange={(castShadow) =>
            onChange({
              ...snapshot,
              objects: {
                ...snapshot.objects,
                [casterObjectId]: { ...caster, castShadow },
              },
            })
          }
        />
        <Toggle
          label="ให้พื้นรับเงา"
          checked={receiver.receiveShadow}
          onChange={(receiveShadow) =>
            onChange({
              ...snapshot,
              objects: {
                ...snapshot.objects,
                [receiverObjectId]: { ...receiver, receiveShadow },
              },
            })
          }
        />
        <Toggle
          label="ให้ไฟสร้างเงา"
          checked={light.castShadow}
          onChange={(castShadow) =>
            onChange({
              ...snapshot,
              lights: {
                ...snapshot.lights,
                [lightId]: { ...light, castShadow },
              },
            })
          }
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-extrabold text-[#23463e]">
          ตำแหน่ง Directional Light
        </legend>
        {axes.map((axis, axisIndex) => (
          <label
            key={axis}
            className="grid grid-cols-[18px_1fr_76px] items-center gap-2"
          >
            <span className={`axis-label axis-${axis.toLowerCase()}`}>{axis}</span>
            <input
              type="range"
              min="-8"
              max="8"
              step="0.1"
              value={light.position[axisIndex]}
              onChange={(event) =>
                updateLightPosition(axisIndex, Number(event.target.value))
              }
              aria-label={`ตำแหน่งไฟแกน ${axis}`}
            />
            <input
              type="number"
              min="-8"
              max="8"
              step="0.1"
              value={Number(light.position[axisIndex].toFixed(2))}
              onChange={(event) =>
                updateLightPosition(axisIndex, Number(event.target.value))
              }
              aria-label={`ค่าตำแหน่งไฟแกน ${axis}`}
              className="w-full rounded-lg border border-[#dbe3e0] bg-white px-2 py-1.5 text-right font-mono text-xs text-[#2e4a43]"
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-extrabold text-[#23463e]">ความสว่าง</legend>
        <label className="grid grid-cols-[1fr_76px] items-center gap-2">
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={light.intensity}
            onChange={(event) =>
              onChange({
                ...snapshot,
                lights: {
                  ...snapshot.lights,
                  [lightId]: {
                    ...light,
                    intensity: Number(event.target.value),
                  },
                },
              })
            }
            aria-label="ความสว่างของไฟ"
          />
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={Number(light.intensity.toFixed(2))}
            onChange={(event) =>
              onChange({
                ...snapshot,
                lights: {
                  ...snapshot.lights,
                  [lightId]: {
                    ...light,
                    intensity: Number(event.target.value),
                  },
                },
              })
            }
            aria-label="ค่าความสว่างของไฟ"
            className="w-full rounded-lg border border-[#dbe3e0] bg-white px-2 py-1.5 text-right font-mono text-xs text-[#2e4a43]"
          />
        </label>
      </fieldset>
    </div>
  )
}
