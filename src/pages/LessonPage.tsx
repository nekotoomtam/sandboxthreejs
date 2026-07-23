import { Link, Navigate, useParams } from 'react-router'
import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { getLessonById, getNextPublishedLesson } from '../lessons/lesson.registry'
import { useLearningProgress } from '../progress/progress.context'

export function LessonPage() {
  const { lessonId } = useParams()
  const lesson = getLessonById(lessonId)
  const { completeExercise, isLessonCompleted } = useLearningProgress()

  if (!lesson) {
    return <Navigate to="/404" replace />
  }

  const lessonCompleted = isLessonCompleted(lesson.id)
  const nextLesson = getNextPublishedLesson(lesson.order)
  const requiredExerciseIds = lesson.exercises.map((exercise) => exercise.id)

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/lessons" className="text-xs font-bold text-[#548074] hover:text-[#236c58]">
            ← กลับไปบทเรียนทั้งหมด
          </Link>
          <p className="mt-5 text-xs font-black tracking-[0.16em] text-[#d98b27]">{lesson.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#183c34] sm:text-4xl">{lesson.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#667a74]">{lesson.summary}</p>
        </div>
        <div className="flex gap-2 text-xs font-bold text-[#58736b]">
          {lessonCompleted && (
            <span className="rounded-full bg-[#dff1e8] px-3 py-2 text-[#21684f]">✓ ผ่านแล้ว</span>
          )}
          <span className="rounded-full border border-[#d9e2df] bg-white px-3 py-2">◷ {lesson.durationMinutes} นาที</span>
          <span className="rounded-full border border-[#d9e2df] bg-white px-3 py-2">{lesson.difficulty}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-[94px] xl:self-start">
          <div className="rounded-2xl border border-[#dce5e1] bg-white p-5">
            <p className="text-xs font-black tracking-[0.13em] text-[#789087]">LEARNING GOALS</p>
            <h2 className="mt-1 font-extrabold text-[#24483f]">จบบทนี้แล้วคุณจะ…</h2>
            <ul className="mt-4 space-y-3">
              {lesson.objectives.map((objective) => (
                <li key={objective} className="flex gap-2.5 text-sm leading-6 text-[#60736d]">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[#dff0e8] text-[9px] font-black text-[#2f7a65]">✓</span>
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <nav className="rounded-2xl border border-[#dce5e1] bg-white p-5" aria-label="สารบัญบทเรียน">
            <p className="text-xs font-black tracking-[0.13em] text-[#789087]">IN THIS LESSON</p>
            <ol className="mt-3 space-y-2">
              {lesson.sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex gap-3 rounded-lg px-2 py-2 text-sm text-[#60736d] hover:bg-[#f0f5f3] hover:text-[#2b6e5b]">
                    <span className="font-mono text-xs text-[#a2ada9]">0{index + 1}</span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <article className="lesson-copy rounded-2xl border border-[#dce5e1] bg-white px-6 py-7 sm:px-8">
            {lesson.sections.map((section, index) => (
              <section key={section.id} id={section.id} className={index > 0 ? 'mt-9 border-t border-[#e8edeb] pt-8' : ''}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#173f37] text-[11px] font-black text-[#ffd08b]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black tracking-tight text-[#23453d]">{section.heading}</h2>
                    <div className="mt-3 space-y-3">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.conceptIds && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black tracking-[0.12em] text-[#899892]">เปิดคำอธิบาย:</span>
                        {section.conceptIds.map((conceptId) => (
                          <Link
                            key={conceptId}
                            to={`/concepts/${conceptId}`}
                            className="rounded-lg bg-[#eaf2ef] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#39705f] hover:bg-[#dcebe5]"
                          >
                            {conceptId} ↗
                          </Link>
                        ))}
                      </div>
                    )}
                    {section.code && (
                      <pre className="mt-4 overflow-x-auto rounded-xl border border-[#d5e1dc] bg-[#142f2a] p-4 text-[12px] leading-6 text-[#d9f0e7] shadow-inner">
                        <code>{section.code}</code>
                      </pre>
                    )}
                    {section.note && (
                      <p className="mt-4 rounded-xl border-l-4 border-[#f3a83b] bg-[#fff7e9] px-4 py-3 text-sm font-semibold text-[#70542c]">
                        {section.note}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </article>

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
            <section
              data-testid="lesson-complete"
              className="overflow-hidden rounded-2xl border border-[#b9dccd] bg-[#e5f4ed] shadow-[0_12px_34px_rgba(31,103,79,.09)]"
            >
              <div className="grid gap-5 px-6 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-[#26785e] text-sm font-black text-white">✓</span>
                    <p className="text-[10px] font-black tracking-[0.14em] text-[#3b7a66]">LESSON COMPLETED</p>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-[#174c3c]">ผ่านบทเรียนแล้ว</h2>
                  <p className="mt-1 text-sm leading-6 text-[#527469]">
                    ความคืบหน้าถูกบันทึกไว้บนเครื่องนี้แล้ว
                    {nextLesson
                      ? ' พร้อมไปต่อยังบทถัดไปได้เลย'
                      : ' ตอนนี้บทถัดไปยังอยู่ระหว่างเตรียมเนื้อหา'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {nextLesson ? (
                    <Link
                      to={`/lessons/${nextLesson.id}`}
                      className="rounded-xl bg-[#173f37] px-5 py-3 text-sm font-black text-white transition hover:bg-[#225448]"
                    >
                      ไปบทถัดไป →
                    </Link>
                  ) : (
                    <Link
                      to="/lessons"
                      className="rounded-xl bg-[#173f37] px-5 py-3 text-sm font-black text-white transition hover:bg-[#225448]"
                    >
                      กลับเส้นทางเรียน →
                    </Link>
                  )}
                  <Link
                    to="/playground"
                    className="rounded-xl border border-[#9ec9b8] bg-white/60 px-4 py-3 text-sm font-bold text-[#2e6b57] hover:bg-white"
                  >
                    ฝึกต่อใน Playground
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
