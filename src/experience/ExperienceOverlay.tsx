import type { TransitionEvent } from 'react'
import { JourneyLoader } from '../components/JourneyLoader'
import type { ExperienceState } from './experienceMachine'

type Props = {
  state: ExperienceState
  onStart: () => void
  onRetry: () => void
  onExplore: () => void
  enteringWorld: boolean
  onRevealFinished: () => void
  onContentRevealFinished: () => void
}

export function ExperienceOverlay({
  state,
  onStart,
  onRetry,
  onExplore,
  enteringWorld,
  onRevealFinished,
  onContentRevealFinished,
}: Props) {
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
    <div
      className={`experience-overlay experience-overlay--${state.phase}${
        enteringWorld ? ' experience-overlay--entering-world' : ''
      }`}
    >
      {showsLoader && (
        <section
          className="experience-loader-surface"
          data-testid="loader-surface"
          aria-live="polite"
          onTransitionEnd={handleLoaderTransition}
        >
          <JourneyLoader mode="boot" progress={state.progress} />
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
          <button
            type="button"
            onClick={onExplore}
            disabled={enteringWorld}
            tabIndex={showsContent ? 0 : -1}
          >
            สำรวจเส้นทางเรียน
          </button>
        </section>
      )}

      {enteringWorld && <JourneyLoader mode="travel" />}

      {!showsLoader && state.phase !== 'error' && (
        <p className="experience-credit">Mona — Character by Puna</p>
      )}
    </div>
  )
}
