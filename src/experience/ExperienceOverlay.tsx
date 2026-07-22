import type { TransitionEvent } from 'react'
import type { ExperienceState } from './experienceMachine'

type Props = {
  state: ExperienceState
  onStart: () => void
  onRetry: () => void
  onRevealFinished: () => void
  onContentRevealFinished: () => void
}

export function ExperienceOverlay({
  state,
  onStart,
  onRetry,
  onRevealFinished,
  onContentRevealFinished,
}: Props) {
  const percent = Math.round(state.progress * 100)
  const showsLoader = state.phase === 'loading' || state.phase === 'revealing'
  const showsRail = state.phase === 'ready' || state.phase === 'approaching'
  const showsContent = state.phase === 'revealing-content' || state.phase === 'entered'
  const mountsContent = state.phase === 'approaching' || showsContent

  const handleLoaderTransition = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || state.phase !== 'revealing') return
    onRevealFinished()
  }

  const handleContentTransition = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || state.phase !== 'revealing-content') return
    onContentRevealFinished()
  }

  return (
    <div className={`experience-overlay experience-overlay--${state.phase}`}>
      {showsLoader && (
        <section
          className="experience-loader-surface"
          data-testid="loader-surface"
          aria-live="polite"
          onTransitionEnd={handleLoaderTransition}
        >
          <header className="experience-brand" aria-label="ThreeLab">
            <span className="experience-brand__mark">3D</span>
            <span>ThreeLab</span>
          </header>

          <div className="experience-loader-shapes" aria-hidden="true">
            <span className="experience-loader-shape experience-loader-shape--circle" />
            <span className="experience-loader-shape experience-loader-shape--square" />
            <span className="experience-loader-shape experience-loader-shape--triangle" />
          </div>

          <div className="experience-loading-copy">
            <p className="experience-eyebrow">กำลังเตรียมโลก 3D</p>
            <h1>กำลังพา Mona เข้าสู่ฉาก</h1>
          </div>

          <div className="experience-progress">
            <div className="experience-progress__label">
              <span>กำลังเตรียมโมเดลและฉาก</span>
              <strong>{percent}%</strong>
            </div>
            <progress max="100" value={percent}>
              {percent}%
            </progress>
          </div>
        </section>
      )}

      {state.phase === 'error' && (
        <section className="experience-error" role="alert">
          <p className="experience-eyebrow">เกิดปัญหาระหว่างเตรียมฉาก</p>
          <h1>โหลดฉากไม่สำเร็จ</h1>
          <p>{state.errorMessage}</p>
          <button type="button" onClick={onRetry}>
            ลองใหม่
          </button>
        </section>
      )}

      {showsRail && (
        <button
          className="experience-start-rail"
          type="button"
          onClick={onStart}
          aria-label="เริ่มประสบการณ์กับ Mona"
          disabled={state.phase !== 'ready'}
        >
          <span>ฉากพร้อมแล้ว</span>
          <strong>เริ่ม</strong>
          <small>กดที่ใดก็ได้บนแถบนี้</small>
        </button>
      )}

      {mountsContent && (
        <section
          className={`experience-content${showsContent ? ' experience-content--visible' : ''}`}
          data-testid="experience-content"
          aria-hidden={!showsContent}
          onTransitionEnd={handleContentTransition}
        >
          <p className="experience-eyebrow">THREELAB INTERACTIVE</p>
          <h1>เรียนรู้ Three.js ผ่านโลกที่โต้ตอบได้</h1>
          <p>ทดลอง สังเกต และสร้างด้วยตัวคุณเอง</p>
          <a href="/lessons" tabIndex={showsContent ? 0 : -1}>เริ่มเรียนรู้</a>
        </section>
      )}

      {!showsLoader && state.phase !== 'error' && (
        <p className="experience-credit">Mona — Character by Puna</p>
      )}
    </div>
  )
}
