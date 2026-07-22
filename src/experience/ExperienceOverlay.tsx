import type { ExperienceState } from './experienceMachine'

type Props = {
  state: ExperienceState
  onStart: () => void
  onRetry: () => void
}

export function ExperienceOverlay({ state, onStart, onRetry }: Props) {
  const percent = Math.round(state.progress * 100)

  return (
    <div className={`experience-overlay experience-overlay--${state.phase}`}>
      <header className="experience-brand" aria-label="ThreeLab">
        <span className="experience-brand__mark">3D</span>
        <span>ThreeLab</span>
      </header>

      {state.phase === 'loading' && (
        <section className="experience-loading" aria-live="polite">
          <p className="experience-eyebrow">กำลังเตรียมโลก 3D</p>
          <h1>กำลังพา Mona เข้าสู่ฉาก</h1>
          <progress max="100" value={percent}>
            {percent}%
          </progress>
          <p>{percent}%</p>
        </section>
      )}

      {state.phase === 'error' && (
        <section className="experience-loading" role="alert">
          <p className="experience-eyebrow">เกิดปัญหาระหว่างเตรียมฉาก</p>
          <h1>โหลดฉากไม่สำเร็จ</h1>
          <p>{state.errorMessage}</p>
          <button type="button" onClick={onRetry}>
            ลองใหม่
          </button>
        </section>
      )}

      {state.phase === 'ready' && (
        <div className="experience-ready" aria-live="polite">
          <p>ฉากพร้อมแล้ว</p>
          <button className="experience-start" type="button" onClick={onStart}>
            เริ่ม
          </button>
        </div>
      )}

      <p className="experience-credit">Mona — Character by Puna</p>
    </div>
  )
}
