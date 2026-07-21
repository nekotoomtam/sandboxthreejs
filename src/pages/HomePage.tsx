import { Link } from 'react-router'
import { lessonCatalog } from '../lessons/lesson.registry'

export function HomePage() {
  return (
    <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 lg:py-10">
      <section className="soft-grid relative overflow-hidden rounded-[28px] bg-[#dcece5] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[#316555] shadow-sm">
            <span className="size-1.5 rounded-full bg-[#f3a83b]" />
            Three.js Learning Sandbox
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.15] tracking-[-0.035em] text-[#163b33] sm:text-5xl lg:text-[58px]">
            เห็นภาพ 3D ชัดขึ้น
            <br />
            เมื่อได้<span className="text-[#d98921]">ลองด้วยมือ</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#557069] sm:text-base">
            เรียนพื้นฐาน Three.js ทีละแนวคิด ปรับค่าแล้วเห็นผลทันที
            พร้อมโจทย์สั้น ๆ ที่ชวนให้คิดมากกว่าการคัดลอกโค้ด
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/lessons/hello-threejs"
              className="rounded-xl bg-[#173f37] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(23,63,55,.18)] transition hover:-translate-y-0.5 hover:bg-[#205346]"
            >
              เริ่มบทแรก <span className="ml-2">→</span>
            </Link>
            <Link
              to="/concepts"
              className="rounded-xl border border-[#99b8ad] bg-white/55 px-5 py-3 text-sm font-extrabold text-[#315f53] transition hover:bg-white"
            >
              เปิดคลังแนวคิด
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-20 -right-20 hidden size-[420px] rounded-full border-[60px] border-white/28 lg:block" />
        <div className="pointer-events-none absolute right-[10%] top-8 hidden rotate-12 lg:block">
          <div className="cube-mark">
            <span className="block size-24 rounded-[24px] border border-white/60 bg-gradient-to-br from-[#f9be61] to-[#dc8521] shadow-[20px_24px_45px_rgba(74,91,82,.18)]" />
          </div>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.15em] text-[#789088]">LEARNING PATH</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1e4038]">เส้นทางพื้นฐาน</h2>
          </div>
          <Link to="/lessons" className="text-sm font-bold text-[#2c7c66] hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {lessonCatalog.map((lesson) => {
            const available = lesson.status === 'available'
            const content = (
              <>
                <div className="flex items-start justify-between">
                  <span
                    className={`grid size-10 place-items-center rounded-xl text-sm font-black ${
                      available ? 'bg-[#173f37] text-white' : 'bg-[#e8ecea] text-[#87938f]'
                    }`}
                  >
                    {String(lesson.order).padStart(2, '0')}
                  </span>
                  <span className="rounded-full bg-[#f1f4f3] px-2.5 py-1 text-[10px] font-bold text-[#768580]">
                    {lesson.durationMinutes} นาที
                  </span>
                </div>
                <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#d98b27]">
                  {lesson.topic}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[#233f38]">{lesson.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6c7b77]">{lesson.summary}</p>
                <div className="mt-5 border-t border-[#e8edeb] pt-4 text-xs font-bold text-[#397561]">
                  {available ? 'เริ่มเรียน →' : 'เร็ว ๆ นี้'}
                </div>
              </>
            )

            return available ? (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className="rounded-2xl border border-[#dce5e1] bg-white p-5 shadow-[0_8px_25px_rgba(30,64,55,.05)] transition hover:-translate-y-1 hover:border-[#a9c7bd] hover:shadow-[0_14px_30px_rgba(30,64,55,.09)]"
              >
                {content}
              </Link>
            ) : (
              <article key={lesson.id} className="rounded-2xl border border-[#e2e7e5] bg-[#fafbfb] p-5 opacity-80">
                {content}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
