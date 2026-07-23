import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { getLessonById, getNextPublishedLesson } from '../lessons/lesson.registry'
import { useLearningProgress } from '../progress/progress.context'

type LessonPhase = 'arriving' | 'briefing' | 'entering' | 'hub' | 'opening' | 'section'

export function LessonPage() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const lesson = getLessonById(lessonId)
  const { completeExercise, isLessonCompleted } = useLearningProgress()
  const topicFromUrl = Number.parseInt(searchParams.get('topic') ?? '', 10)
  const hasTopicFromUrl = Number.isInteger(topicFromUrl) && topicFromUrl >= 0
  const [phase, setPhase] = useState<LessonPhase>(hasTopicFromUrl ? 'section' : 'arriving')
  const [activeTopicIndex, setActiveTopicIndex] = useState(hasTopicFromUrl ? topicFromUrl : 0)

  useEffect(() => {
    if (phase !== 'arriving' && phase !== 'entering' && phase !== 'opening') return

    const transitions: Record<'arriving' | 'entering' | 'opening', [number, LessonPhase]> = {
      arriving: [720, 'briefing'],
      entering: [820, 'hub'],
      opening: [760, 'section'],
    }
    const [delay, nextPhase] = transitions[phase]
    const timer = window.setTimeout(() => setPhase(nextPhase), delay)

    return () => window.clearTimeout(timer)
  }, [phase])

  if (!lesson) {
    return <Navigate to="/404" replace />
  }

  const lessonCompleted = isLessonCompleted(lesson.id)
  const nextLesson = getNextPublishedLesson(lesson.order)
  const requiredExerciseIds = lesson.exercises.map((exercise) => exercise.id)
  const topics = [
    ...lesson.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      summary: section.paragraphs[0],
      kind: 'knowledge' as const,
    })),
    {
      id: 'practice',
      heading: 'ห้องทดลอง',
      summary: 'นำสิ่งที่เรียนมาเขียนโค้ด หมุนกล่อง และตรวจผลลัพธ์ในฉากจริง',
      kind: 'practice' as const,
    },
  ]
  const safeTopicIndex = Math.min(activeTopicIndex, topics.length - 1)
  const activeTopic = topics[safeTopicIndex]
  const activeSection = lesson.sections[safeTopicIndex]
  const isPractice = activeTopic.kind === 'practice'
  const showInterior = ['entering', 'hub', 'opening', 'section'].includes(phase)
  const showHub = phase === 'entering' || phase === 'hub' || phase === 'opening'

  const openTopic = (index: number) => {
    setActiveTopicIndex(index)
    setPhase('opening')
  }

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
        <Link
          to={phase === 'section' ? '#' : '/worlds/foundations'}
          className="lesson-experience__back"
          onClick={(event) => {
            if (phase !== 'section') return
            event.preventDefault()
            setPhase('hub')
          }}
        >
          <span aria-hidden="true">←</span>
          {phase === 'section' ? 'กลับไปเลือกหัวข้อ' : 'กลับสู่ดาวพื้นฐาน'}
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
                <small>พร้อมสำรวจ</small>
                เข้าสู่บทเรียน
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

      {showInterior && (
        <section className="lesson-lab" aria-hidden={phase === 'entering'}>
          <div className="lesson-lab__header">
            <div>
              <p>WORLD 01 · FOUNDATIONS</p>
              <h1>{phase === 'section' ? activeTopic.heading : lesson.title}</h1>
            </div>
            <div className="lesson-lab__progress">
              <span>LESSON PROGRESS</span>
              <div>
                <i style={{ width: `${((safeTopicIndex + 1) / topics.length) * 100}%` }} />
              </div>
              <strong>
                {String(safeTopicIndex + 1).padStart(2, '0')} / {String(topics.length).padStart(2, '0')}
              </strong>
            </div>
          </div>

          {showHub && (
            <div className="lesson-topic-hub">
              <div className="lesson-topic-hub__intro">
                <p>เลือกประตูที่ต้องการเข้าไปเรียนรู้</p>
                <span>แต่ละหัวข้อจะพาคุณลึกเข้าไปอีกส่วนหนึ่งของโลก Three.js</span>
              </div>
              <div className="lesson-topic-hub__grid">
                {topics.map((topic, index) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={`lesson-topic-card${
                      phase === 'opening' && index === safeTopicIndex
                        ? ' lesson-topic-card--active'
                        : ''
                    }`}
                    onClick={() => openTopic(index)}
                    disabled={phase === 'opening'}
                    aria-label={`เปิดหัวข้อ ${topic.heading}`}
                  >
                    <span className="lesson-topic-card__number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="lesson-topic-card__type">
                      {topic.kind === 'practice' ? 'INTERACTIVE LAB' : 'KNOWLEDGE GATE'}
                    </span>
                    <strong>{topic.heading}</strong>
                    <small>{topic.summary}</small>
                    <i aria-hidden="true">↗</i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'section' && (
            <div className="lesson-section-view">
              {!isPractice && activeSection ? (
                <article className="lesson-section-view__article">
                  <div className="lesson-section-view__copy">
                    <p className="lesson-section-view__eyebrow">
                      KNOWLEDGE {String(safeTopicIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>{activeSection.heading}</h2>
                    <div className="lesson-section-view__paragraphs">
                      {activeSection.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>

                    {activeSection.note && (
                      <p className="lesson-section-view__note">{activeSection.note}</p>
                    )}

                    {activeSection.conceptIds && (
                      <div className="lesson-section-view__concepts">
                        <span>เปิด Field Note เพิ่มเติม</span>
                        <div>
                          {activeSection.conceptIds.map((conceptId) => (
                            <Link
                              key={conceptId}
                              to={`/concepts/${conceptId}?fromLesson=${lesson.id}&topic=${safeTopicIndex}`}
                            >
                              THREE.{conceptId} ↗
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className="lesson-section-view__code">
                    <div>
                      <span>MINIMUM CODE</span>
                      <b>JavaScript</b>
                    </div>
                    <pre>
                      <code>{activeSection.code}</code>
                    </pre>
                    <button
                      type="button"
                      onClick={() => openTopic(Math.min(safeTopicIndex + 1, topics.length - 1))}
                    >
                      ไปหัวข้อถัดไป <span>→</span>
                    </button>
                  </aside>
                </article>
              ) : (
                <div className="lesson-section-view__practice">
                  <div className="lesson-section-view__practice-intro">
                    <div>
                      <p>INTERACTIVE LAB · STEP 03</p>
                      <h2>ลองควบคุมฉากด้วยตัวเอง</h2>
                    </div>
                    <span>เขียนคำสั่งด้านซ้าย แล้วดูผลลัพธ์จริงด้านขวา</span>
                  </div>

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

                  {lessonCompleted && (
                    <section data-testid="lesson-complete" className="lesson-lab__complete">
                      <div>
                        <span>✓</span>
                        <div>
                          <p>LESSON COMPLETED</p>
                          <h2>ผ่านบทเรียนแล้ว</h2>
                          <small>
                            ความคืบหน้าถูกบันทึกไว้แล้ว
                            {nextLesson
                              ? ' พร้อมไปต่อยังบทถัดไปได้เลย'
                              : ' บทถัดไปกำลังเตรียมอยู่'}
                          </small>
                        </div>
                      </div>
                      <div>
                        {nextLesson ? (
                          <Link to={`/lessons/${nextLesson.id}`}>ไปบทถัดไป →</Link>
                        ) : (
                          <Link
                            to="/worlds/foundations"
                            className="lesson-lab__complete-primary"
                          >
                            กลับสู่ดาวพื้นฐาน →
                          </Link>
                        )}
                        <Link to="/playground">ฝึกต่อใน Playground</Link>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="lesson-experience__entry-mask" aria-hidden="true" />
    </main>
  )
}
