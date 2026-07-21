import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { DEFAULT_SANDBOX_SCENE } from '../sandbox/defaultScene'
import type { CodeLabDefinition } from '../sandbox/sandbox.types'

const playgroundCodeLab: CodeLabDefinition = {
  title: 'ทดลองเขียนได้อย่างอิสระ',
  description: 'ใช้ตัวแปรที่เตรียมไว้เพื่อย้าย หมุน หรือย่อขยายกล่อง แล้วกด Run เพื่อดูผลบนฉาก',
  starterCode: `// ลองเปลี่ยนตัวเลขแล้วกด Run\ncube.position.x = 1\ncube.rotation.y = THREE.MathUtils.degToRad(30)\ncube.scale.set(1, 1.5, 1)`,
  availableBindings: ['THREE', 'scene', 'camera', 'cube', 'console'],
}

export function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-[1420px] px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-[#d98b27]">FREE PLAY</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#173b33]">สนามทดลองอิสระ</h1>
          <p className="mt-2 text-sm text-[#667a74]">ลองย้าย หมุน และย่อขยายกล่องได้ตามใจ ไม่มีคำตอบผิด</p>
        </div>
        <p className="rounded-xl bg-[#e3eee9] px-4 py-2 text-xs font-bold text-[#3d6e60]">ค่า Rotation แสดงเป็นองศาเพื่อให้อ่านง่าย</p>
      </div>
      <SandboxWorkspace
        definition={DEFAULT_SANDBOX_SCENE}
        activeObjectId="learning-cube"
        codeLab={playgroundCodeLab}
        compact
      />
    </div>
  )
}
