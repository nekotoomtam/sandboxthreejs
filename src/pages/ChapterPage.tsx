import { Link, Navigate, useParams } from 'react-router'
import { PlanetVisual } from '../components/worlds/PlanetVisual'
import { getWorldById } from '../worlds/world.registry'

export function ChapterPage() {
  const { worldId } = useParams()
  const world = getWorldById(worldId)

  if (!world) return <Navigate to="/worlds" replace />

  return (
    <main
      className={`chapter-overview chapter-overview--${world.id}`}
      style={{ '--world-accent': world.accent } as React.CSSProperties}
    >
      <section className="chapter-overview__content">
        <Link className="world-back-link" to="/worlds">
          ← กลับไปแผนที่
        </Link>
        <p className="chapter-overview__eyebrow">{world.eyebrow}</p>
        <h1>{world.title}</h1>
        <p className="chapter-overview__description">{world.description}</p>

        <div className="chapter-lesson-list">
          {world.lessons.map((lesson, index) =>
            lesson.status === 'available' && lesson.lessonId ? (
              <Link
                key={lesson.id}
                className="chapter-lesson chapter-lesson--available"
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
                className="chapter-lesson chapter-lesson--locked"
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

      <PlanetVisual
        className="chapter-overview__planet"
        src={world.imageSrc}
        alt={`ดาวบท ${world.title}`}
        variant="chapter"
      />
    </main>
  )
}
