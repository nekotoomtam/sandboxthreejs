import { Link, Navigate, useParams } from 'react-router'
import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { getConceptById, getRelatedConcepts } from '../concepts/concept.registry'

export function ConceptDetailPage() {
  const { conceptId } = useParams()
  const concept = getConceptById(conceptId)

  if (!concept) {
    return <Navigate to="/404" replace />
  }

  const relatedConcepts = getRelatedConcepts(concept)

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 lg:py-9">
      <Link to="/concepts" className="text-xs font-bold text-[#548074] hover:text-[#236c58]">
        ← กลับไปคลังแนวคิด
      </Link>

      <header className="mt-5 rounded-[26px] border border-[#d8e4df] bg-white px-6 py-7 sm:px-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#173f37] px-2.5 py-1.5 font-mono text-xs font-black text-[#ffd08b]">
                {String(concept.order).padStart(2, '0')}
              </span>
              <span className="text-xs font-black tracking-[0.12em] text-[#c97a1c]">{concept.category}</span>
            </div>
            <code className="mt-5 block text-sm font-bold text-[#4c776b]">THREE.{concept.apiName}</code>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#173b33] sm:text-4xl">{concept.title}</h1>
            <p className="mt-3 text-[15px] leading-7 text-[#647872]">{concept.summary}</p>
          </div>
          <a
            href={concept.officialDocs}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-[#d4dfdb] bg-[#f8faf9] px-4 py-2.5 text-xs font-bold text-[#41675d] transition hover:bg-[#eaf2ef]"
          >
            เอกสาร Three.js ทางการ ↗
          </a>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <section className="rounded-2xl border border-[#dce5e1] bg-white p-6 sm:p-7">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#7e918a]">PURPOSE</p>
            <h2 className="mt-1 text-xl font-black text-[#24473e]">ใช้ทำอะไร</h2>
            <p className="mt-3 text-sm leading-7 text-[#61746e]">{concept.purpose}</p>
          </section>

          <section className="rounded-2xl border border-[#ead9bd] bg-[#fff8eb] p-6 sm:p-7">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#b97727]">MENTAL MODEL</p>
            <h2 className="mt-1 text-xl font-black text-[#5c4425]">นึกภาพแบบนี้</h2>
            <p className="mt-3 text-sm leading-7 text-[#725d40]">{concept.mentalModel}</p>
          </section>

          <section className="rounded-2xl border border-[#dce5e1] bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#7e918a]">MINIMUM CODE</p>
                <h2 className="mt-1 text-xl font-black text-[#24473e]">โค้ดขั้นต่ำ</h2>
              </div>
              <span className="rounded-full bg-[#e8f1ed] px-3 py-1 text-[10px] font-bold text-[#3e705f]">JavaScript</span>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[#102f2b] p-5 text-[12px] leading-7 text-[#e3f2ec] shadow-inner">
              <code>{concept.minimalCode}</code>
            </pre>
          </section>

          {concept.demo && (
            <section>
              <div className="mb-3">
                <p className="text-[10px] font-black tracking-[0.14em] text-[#c77a1d]">TRY IT</p>
                <h2 className="mt-1 text-xl font-black text-[#24473e]">ทดลองกับฉากจริง</h2>
                <p className="mt-1 text-sm text-[#6a7b76]">ลากฉากเพื่อดูค่ากล้อง หรือใช้แผงด้านขวาเพื่อเปลี่ยนตัววัตถุ</p>
              </div>
              <SandboxWorkspace
                definition={concept.demo.scene}
                activeObjectId={concept.demo.activeObjectId}
                compact
              />
            </section>
          )}
        </main>

        <aside className="space-y-5 lg:sticky lg:top-[94px] lg:self-start">
          <section className="rounded-2xl border border-[#dce5e1] bg-white p-5">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#7e918a]">REMEMBER</p>
            <h2 className="mt-1 font-black text-[#24473e]">ประเด็นสำคัญ</h2>
            <ul className="mt-4 space-y-3">
              {concept.keyPoints.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-6 text-[#60736d]">
                  <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[#dff0e8] text-[9px] font-black text-[#2f7a65]">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#eaded8] bg-[#fffaf8] p-5">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#a76b55]">COMMON MISTAKES</p>
            <h2 className="mt-1 font-black text-[#5d443b]">จุดที่มักสับสน</h2>
            <ul className="mt-4 space-y-3">
              {concept.commonMistakes.map((mistake) => (
                <li key={mistake} className="flex gap-2.5 text-sm leading-6 text-[#785f56]">
                  <span className="mt-1 text-[#d0785b]">!</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#dce5e1] bg-white p-5">
            <p className="text-[10px] font-black tracking-[0.14em] text-[#7e918a]">RELATED</p>
            <h2 className="mt-1 font-black text-[#24473e]">เรียนเรื่องนี้ต่อ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedConcepts.map((related) => (
                <Link
                  key={related.id}
                  to={`/concepts/${related.id}`}
                  className="rounded-lg bg-[#eef3f1] px-3 py-2 text-xs font-bold text-[#43685e] hover:bg-[#dfece7]"
                >
                  {related.apiName} →
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
