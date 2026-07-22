import { Link } from 'react-router'
import { lessonCatalog } from '../lessons/lesson.registry'
import { useLearningProgress } from '../progress/progress.context'

export function LessonsPage() {
  const { isLessonCompleted } = useLearningProgress()

  return (
    <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-black tracking-[0.16em] text-[#d98b27]">COURSE MAP</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#173b33]">บทเรียนทั้งหมด</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#667a74]">
          ทุกบทจะอธิบายแนวคิดสั้น ๆ แล้วเปิดพื้นที่ให้คุณทดลองกับฉากจริง
          บทต่อไปจะต่อยอดจาก state และ runtime เดียวกันโดยไม่ต้องสร้างระบบใหม่
        </p>
      </div>

      <div className="mt-9 space-y-4">
        {lessonCatalog.map((lesson) => {
          const available = lesson.status === 'available'
          const completed = isLessonCompleted(lesson.id)
          return (
            <article
              key={lesson.id}
              className={`grid gap-5 rounded-2xl border p-5 sm:grid-cols-[70px_1fr_auto] sm:items-center sm:p-6 ${
                available
                  ? 'border-[#d7e3df] bg-white shadow-[0_8px_24px_rgba(31,65,55,.05)]'
                  : 'border-[#e2e6e4] bg-[#f8f9f9]'
              }`}
            >
              <span
                className={`grid size-14 place-items-center rounded-2xl font-black ${
                  available ? 'bg-[#173f37] text-[#ffd08b]' : 'bg-[#e7ebe9] text-[#899590]'
                }`}
              >
                {String(lesson.order).padStart(2, '0')}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-[#25453d]">{lesson.title}</h2>
                  <span className="rounded-full bg-[#edf3f0] px-2.5 py-1 text-[10px] font-bold text-[#5c796f]">
                    {lesson.topic}
                  </span>
                  {completed && (
                    <span className="rounded-full bg-[#dff1e8] px-2.5 py-1 text-[10px] font-bold text-[#286b56]">
                      ✓ ผ่านแล้ว
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#6c7d78]">{lesson.summary}</p>
              </div>
              {available ? (
                <Link
                  to={`/lessons/${lesson.id}`}
                  className="rounded-xl bg-[#e6f1ec] px-4 py-2.5 text-center text-xs font-extrabold text-[#296d59] transition hover:bg-[#d5eae1]"
                >
                  {completed ? 'ทบทวนบทเรียน ↻' : 'เปิดบทเรียน →'}
                </Link>
              ) : (
                <span className="text-xs font-bold text-[#99a39f]">{lesson.durationMinutes} นาที · เร็ว ๆ นี้</span>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
