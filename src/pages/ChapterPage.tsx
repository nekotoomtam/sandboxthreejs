import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { JourneyLoader } from '../components/JourneyLoader'
import { WorldJourneyCanvas } from '../worlds/WorldJourneyCanvas'
import { getWorldById, worldCatalog } from '../worlds/world.registry'

export function ChapterPage() {
  const { worldId } = useParams()
  const navigate = useNavigate()
  const [sceneReady, setSceneReady] = useState(false)
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [loaderExiting, setLoaderExiting] = useState(false)
  const world = getWorldById(worldId)

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), 950)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!sceneReady || !minimumElapsed) return
    setLoaderExiting(true)
    const timer = window.setTimeout(() => setLoaderVisible(false), 680)
    return () => window.clearTimeout(timer)
  }, [minimumElapsed, sceneReady])

  if (!world) return <Navigate to="/worlds/foundations" replace />

  const worldIndex = worldCatalog.findIndex((candidate) => candidate.id === world.id)
  const previousWorld = worldCatalog[worldIndex - 1]
  const nextWorld = worldCatalog[worldIndex + 1]

  const travel = (nextId: string) => {
    navigate(`/worlds/${nextId}`)
  }

  return (
    <main
      className="world-journey"
      data-world-id={world.id}
      style={{ '--world-accent': world.accent } as React.CSSProperties}
    >
      <WorldJourneyCanvas worldId={world.id} onReady={() => setSceneReady(true)} />

      <section className="world-journey__content" key={world.id}>
        <Link className="world-journey__home" to="/">
          ← กลับไปหา Mona
        </Link>
        <p className="world-journey__eyebrow">{world.eyebrow}</p>
        <h1>{world.title}</h1>
        <p className="world-journey__description">{world.description}</p>

        <div className="world-journey__lessons">
          {world.lessons.map((lesson, index) =>
            lesson.status === 'available' && lesson.lessonId ? (
              <Link
                key={lesson.id}
                className="world-journey-lesson world-journey-lesson--available"
                to={`/lessons/${lesson.lessonId}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.summary}</small>
                </span>
                <em>เริ่มเรียน →</em>
              </Link>
            ) : (
              <div
                key={lesson.id}
                className="world-journey-lesson world-journey-lesson--locked"
                aria-disabled="true"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.summary}</small>
                </span>
                <em>เร็ว ๆ นี้</em>
              </div>
            ),
          )}
        </div>
      </section>

      <nav className="world-journey__switcher" aria-label="เปลี่ยนดาวบทเรียน">
        {previousWorld && (
          <button type="button" onClick={() => travel(previousWorld.id)}>
            <span>← ดาวก่อนหน้า</span>
            <strong>{String(previousWorld.order).padStart(2, '0')}</strong>
          </button>
        )}
        {nextWorld && (
          <button type="button" onClick={() => travel(nextWorld.id)}>
            <span>ดาวถัดไป →</span>
            <strong>{String(nextWorld.order).padStart(2, '0')}</strong>
          </button>
        )}
      </nav>

      {loaderVisible && (
        <JourneyLoader mode="travel" exiting={loaderExiting} instant />
      )}
    </main>
  )
}
