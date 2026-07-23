import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router'
import { SandboxWorkspace } from '../components/SandboxWorkspace'
import { getConceptById, getRelatedConcepts } from '../concepts/concept.registry'

export function ConceptDetailPage() {
  const { conceptId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const concept = getConceptById(conceptId)

  if (!concept) {
    return <Navigate to="/404" replace />
  }

  const relatedConcepts = getRelatedConcepts(concept)
  const fromLesson = searchParams.get('fromLesson')
  const topic = searchParams.get('topic')
  const returnTo =
    fromLesson && topic
      ? `/lessons/${fromLesson}?topic=${topic}`
      : '/concepts'
  const returnLabel = fromLesson ? 'กลับไปยังหัวข้อเดิม' : 'กลับไปคลังแนวคิด'

  return (
    <main className="concept-field-note">
      <div className="concept-field-note__atmosphere" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <header className="concept-field-note__topbar">
        <Link to={returnTo}>← {returnLabel}</Link>
        <div>
          <span>THREELAB · FIELD NOTE</span>
          <strong>{String(concept.order).padStart(2, '0')}</strong>
        </div>
      </header>

      <div className="concept-field-note__shell">
        <header className="concept-field-note__hero">
          <div className="concept-field-note__index">
            {String(concept.order).padStart(2, '0')}
          </div>
          <div>
            <p>{concept.category}</p>
            <code>THREE.{concept.apiName}</code>
            <h1>{concept.title}</h1>
            <span>{concept.summary}</span>
          </div>
          <a href={concept.officialDocs} target="_blank" rel="noreferrer">
            <small>REFERENCE</small>
            เอกสาร Three.js ทางการ ↗
          </a>
        </header>

        <div className="concept-field-note__body">
          <div className="concept-field-note__main">
            <section className="concept-field-note__purpose">
              <span>PURPOSE · ใช้ทำอะไร</span>
              <h2>{concept.purpose}</h2>
            </section>

            <section className="concept-field-note__model">
              <div>
                <span>MENTAL MODEL</span>
                <h2>นึกภาพแบบนี้</h2>
              </div>
              <p>{concept.mentalModel}</p>
            </section>

            <section className="concept-field-note__code">
              <div>
                <span>MINIMUM CODE</span>
                <b>JavaScript</b>
              </div>
              <pre>
                <code>{concept.minimalCode}</code>
              </pre>
            </section>
          </div>

          <aside className="concept-field-note__aside">
            <section>
              <span>REMEMBER</span>
              <h2>ประเด็นสำคัญ</h2>
              <ul>
                {concept.keyPoints.map((point) => (
                  <li key={point}>
                    <i>✓</i>
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section className="concept-field-note__mistakes">
              <span>COMMON MISTAKES</span>
              <h2>จุดที่มักสับสน</h2>
              <ul>
                {concept.commonMistakes.map((mistake) => (
                  <li key={mistake}>
                    <i>!</i>
                    {mistake}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <span>RELATED NOTES</span>
              <h2>เปิดอ่านเรื่องที่เกี่ยวข้อง</h2>
              <div className="concept-field-note__related">
                {relatedConcepts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/concepts/${related.id}${location.search}`}
                  >
                    THREE.{related.apiName} →
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {concept.demo && (
          <section className="concept-field-note__demo">
            <div>
              <p>LIVE OBSERVATION</p>
              <h2>ทดลองกับฉากจริง</h2>
              <span>หมุนกล้องหรือปรับค่าของวัตถุ เพื่อสังเกตหน้าที่ของคำสั่งนี้</span>
            </div>
            <SandboxWorkspace
              definition={concept.demo.scene}
              activeObjectId={concept.demo.activeObjectId}
              compact
            />
          </section>
        )}
      </div>
    </main>
  )
}
