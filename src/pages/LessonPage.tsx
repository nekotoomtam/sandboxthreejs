import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { getLessonById, getNextPublishedLesson } from '../lessons/lesson.registry'
import { useLearningProgress } from '../progress/progress.context'

type LessonPhase = 'arriving' | 'briefing' | 'entering' | 'learning'

export function LessonPage() {
  const { lessonId } = useParams()
  const lesson = getLessonById(lessonId)
  const { completeExercise, isLessonCompleted } = useLearningProgress()
  const [phase, setPhase] = useState<LessonPhase>('arriving')

  useEffect(() => {
    if (phase !== 'arriving' && phase !== 'entering') return

    const delay = phase === 'arriving' ? 720 : 820
    const nextPhase = phase === 'arriving' ? 'briefing' : 'learning'
    const timer = window.setTimeout(() => setPhase(nextPhase), delay)

    return () => window.clearTimeout(timer)
  }, [phase])

  if (!lesson) {
    return <Navigate to="/404" replace />
  }

  const lessonCompleted = isLessonCompleted(lesson.id)
  const nextLesson = getNextPublishedLesson(lesson.order)
  const requiredExerciseIds = lesson.exercises.map((exercise) => exercise.id)
  const showWorkspace = phase === 'entering' || phase === 'learning'

  return (
    <main
      className={`lesson-experience lesson-experience--foundations lesson-experience--${phase}`}
      data-lesson-phase={phase}
    >
      <div className="lesson-experience__backdrop" aria-hidden="true">
        <div className="lesson-experience__planet" />
        <div className="lesson-experience__stars" />
      </div>

      <header className="lesson-experience__topbar">
        <Link to="/worlds/foundations" className="lesson-experience__back">
          <span aria-hidden="true">←</span>
          กลับสู่ดาวพื้นฐาน
        </Link>
        <div className="lesson-experience__route">
          <span>WORLD 01</span>
          <i />
          <strong>LESSON {String(lesson.order).padStart(2, '0')}</strong>
        </div>
      </header>

      <section className="lesson-briefing" aria-hidden={phase !== 'briefing'}>
        <article className="lesson-briefing__card">
          <div className="lesson-briefing__number">01</div>
          <div className="lesson-briefing__copy">
            <p className="lesson-briefing__eyebrow">MISSION BRIEFING · {lesson.eyebrow}</p>
            <h1>{lesson.title}</h1>
            <p className="lesson-briefing__summary">{lesson.summary}</p>

            <div className="lesson-briefing__meta">
              <span>◷ {lesson.durationMinutes} นาที</span>
              <span>{lesson.difficulty}</span>
              {lessonCompleted && <span className="lesson-briefing__completed">✓ ผ่านแล้ว</span>}
            </div>

            <div className="lesson-briefing__mission">
              <p>สิ่งที่เราจะสร้าง</p>
              <strong>ฉาก Three.js แรกที่หมุน ดู และแก้ไขได้จริง</strong>
            </div>

            <ul className="lesson-briefing__goals">
              {lesson.objectives.map((objective) => (
                <li key={objective}>
                  <span>✓</span>
                  {objective}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="lesson-briefing__enter"
              onClick={() => setPhase('entering')}
            >
              <span>
                <small>พร้อมทดลอง</small>
                เข้า Code Lab
              </span>
              <b aria-hidden="true">→</b>
            </button>
          </div>

          <aside className="lesson-briefing__preview" aria-label="ตัวอย่างคำสั่งในบทเรียน">
            <div className="lesson-briefing__orbit">
              <span>SCENE</span>
              <span>CAMERA</span>
              <span>RENDERER</span>
              <i />
            </div>
            <pre>
              <code>{`const world = new THREE.Scene()\n\nworld.add(cube)\nrenderer.render(world, camera)`}</code>
            </pre>
            <p>ทุกอย่างเริ่มจากฉากว่างหนึ่งฉาก</p>
          </aside>
        </article>
      </section>

      {showWorkspace && (
        <section className="lesson-lab" aria-hidden={phase !== 'learning'}>
          <div className="lesson-lab__header">
            <div>
              <p>WORLD 01 · FOUNDATIONS</p>
              <h1>{lesson.title}</h1>
            </div>
            <div className="lesson-lab__progress">
              <span>LESSON PROGRESS</span>
              <div><i /></div>
              <strong>01 / 03</strong>
            </div>
          </div>

          <div className="lesson-lab__guide">
            {lesson.sections.map((section, index) => (
              <article key={section.id}>
                <span>0{index + 1}</span>
                <div>
                  <h2>{section.heading}</h2>
                  <p>{section.paragraphs[0]}</p>
                  {section.conceptIds && (
                    <div className="lesson-lab__concepts">
                      {section.conceptIds.map((conceptId) => (
                        <Link key={conceptId} to={`/concepts/${conceptId}`}>
                          {conceptId} ↗
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="lesson-lab__workspace">
            <SandboxWorkspace
              practical
              definition={lesson.sandbox.scene}
              activeObjectId={lesson.sandbox.activeObjectId}
              exercise={lesson.exercises[0]}
              codeLab={lesson.sandbox.codeLab}
              onExercisePassed={(exerciseId) =>
                completeExercise(lesson.id, exerciseId, requiredExerciseIds)
              }
            />
          </div>

          {lessonCompleted && (
            <section data-testid="lesson-complete" className="lesson-lab__complete">
              <div>
                <span>✓</span>
                <div>
                  <p>LESSON COMPLETED</p>
                  <h2>ผ่านบทเรียนแล้ว</h2>
                  <small>
                    ความคืบหน้าถูกบันทึกไว้แล้ว
                    {nextLesson ? ' พร้อมไปต่อยังบทถัดไปได้เลย' : ' บทถัดไปกำลังเตรียมอยู่'}
                  </small>
                </div>
              </div>
              <div>
                {nextLesson ? (
                  <Link to={`/lessons/${nextLesson.id}`}>ไปบทถัดไป →</Link>
                ) : (
                  <>
                    <Link
                      to="/worlds/foundations"
                      className="lesson-lab__complete-primary"
                    >
                      กลับสู่ดาวพื้นฐาน →
                    </Link>
                  </>
                )}
                <Link to="/playground">ฝึกต่อใน Playground</Link>
              </div>
            </section>
          )}
        </section>
      )}

      <div className="lesson-experience__entry-mask" aria-hidden="true" />
    </main>
  )
}
