import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { conceptCategories, concepts } from '../concepts/concept.registry'
import type { ConceptCategory } from '../concepts/concept.types'

const categoryStyles: Record<ConceptCategory, string> = {
  'พื้นฐานโลก 3D': 'bg-[#dfeee8] text-[#286551]',
  'การสร้างวัตถุ': 'bg-[#fff0d9] text-[#a66218]',
  'การจัดวาง': 'bg-[#e6eaf6] text-[#536aa0]',
  'การแสดงผล': 'bg-[#eee6f4] text-[#76578e]',
}

export function ConceptsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ConceptCategory | 'ทั้งหมด'>('ทั้งหมด')
  const filteredConcepts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return concepts.filter((concept) => {
      const matchesCategory = category === 'ทั้งหมด' || concept.category === category
      const matchesQuery =
        !normalizedQuery ||
        `${concept.title} ${concept.apiName} ${concept.summary}`
          .toLowerCase()
          .includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 lg:py-10">
      <section className="soft-grid overflow-hidden rounded-[28px] border border-[#d7e5df] bg-[#e4f0eb] px-6 py-8 sm:px-9 lg:grid lg:grid-cols-[1fr_430px] lg:items-center lg:gap-10 lg:px-12 lg:py-11">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-[#c8781b]">THREE.JS CONCEPT LIBRARY</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#173c33] sm:text-4xl">
            รู้ว่าอะไรทำหน้าที่อะไร
            <br />ก่อนเริ่มเขียน
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5e756e]">
            คลังแนวคิดฉบับทดลองได้สำหรับมือใหม่ แต่ละหัวข้อมีภาพจำ โค้ดขั้นต่ำ
            จุดที่มักสับสน และฉากให้ลองปรับด้วยตัวเอง
          </p>
        </div>
        <div className="mt-7 rounded-2xl border border-white/70 bg-white/65 p-5 shadow-sm lg:mt-0">
          <p className="text-[10px] font-black tracking-[0.14em] text-[#789087]">HOW THINGS CONNECT</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-[#315d52]">
            <span className="concept-node">Geometry</span>
            <span>+</span>
            <span className="concept-node">Material</span>
            <span>→</span>
            <span className="concept-node accent">Mesh</span>
            <span>→</span>
            <span className="concept-node dark">Scene</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-[#315d52]">
            <span className="concept-node">Camera</span>
            <span>+</span>
            <span className="concept-node dark">Scene</span>
            <span>→</span>
            <span className="concept-node accent">Renderer</span>
            <span>→ Canvas</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="กรองตามหมวดหมู่">
            {(['ทั้งหมด', ...conceptCategories] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  category === item
                    ? 'bg-[#173f37] text-white shadow-sm'
                    : 'border border-[#d8e1de] bg-white text-[#637771] hover:border-[#a9c4bb]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="relative block min-w-[280px]">
            <span className="pointer-events-none absolute left-3 top-2.5 text-[#83928d]">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหา Scene, Mesh, Rotation…"
              className="w-full rounded-xl border border-[#d7e1dd] bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#3d8c75] focus:ring-2 focus:ring-[#3d8c75]/10"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-extrabold text-[#345c51]">{filteredConcepts.length} แนวคิด</p>
          <p className="text-xs text-[#89958f]">เรียงจากพื้นฐานไปสู่การลงมือทำ</p>
        </div>

        {filteredConcepts.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredConcepts.map((concept) => (
              <Link
                key={concept.id}
                to={`/concepts/${concept.id}`}
                className="group flex min-h-[230px] flex-col rounded-2xl border border-[#dce4e1] bg-white p-5 shadow-[0_7px_24px_rgba(31,65,55,.045)] transition hover:-translate-y-1 hover:border-[#a9c7bd] hover:shadow-[0_13px_30px_rgba(31,65,55,.09)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#173f37] font-mono text-xs font-black text-[#ffd08b]">
                    {String(concept.order).padStart(2, '0')}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${categoryStyles[concept.category]}`}>
                    {concept.category}
                  </span>
                </div>
                <code className="mt-5 text-[11px] font-bold text-[#d18120]">THREE.{concept.apiName}</code>
                <h2 className="mt-1 text-lg font-black text-[#213f38]">{concept.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6a7b76]">{concept.summary}</p>
                <p className="mt-auto border-t border-[#e8edeb] pt-4 text-xs font-black text-[#34745f]">
                  อ่านและทดลอง <span className="inline-block transition group-hover:translate-x-1">→</span>
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cfdad6] bg-white/50 px-6 py-14 text-center">
            <p className="font-extrabold text-[#49675f]">ยังไม่พบแนวคิดที่ค้นหา</p>
            <button type="button" onClick={() => { setQuery(''); setCategory('ทั้งหมด') }} className="mt-2 text-sm font-bold text-[#bd721c] hover:underline">
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
