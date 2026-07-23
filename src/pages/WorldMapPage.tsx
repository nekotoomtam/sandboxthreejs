import { Link } from 'react-router'
import { PlanetVisual } from '../components/worlds/PlanetVisual'
import { worldCatalog } from '../worlds/world.registry'

export function WorldMapPage() {
  return (
    <main className="world-map">
      <header className="world-map__header">
        <Link className="world-back-link" to="/">
          ← กลับไปหา Mona
        </Link>
        <p>THREELAB · COURSE WORLDS</p>
        <h1>สามโลกของการสร้าง Three.js</h1>
        <span>เลือกโลกที่อยากสำรวจ แล้วค่อยลงมือกับโค้ดและฉากจริง</span>
      </header>

      <section className="world-map__stage" aria-label="แผนที่บทเรียน">
        {worldCatalog.map((world) => (
          <Link
            key={world.id}
            className={`world-planet-link world-planet-link--${world.id}`}
            to={`/worlds/${world.id}`}
            aria-label={`เปิดบท ${world.title}`}
            style={{ '--world-accent': world.accent } as React.CSSProperties}
          >
            <PlanetVisual
              src={world.imageSrc}
              alt={`ดาวบท ${world.title}`}
              variant="map"
            />
            <span className="world-planet-link__label">
              <small>{String(world.order).padStart(2, '0')}</small>
              <strong>{world.title}</strong>
              <em>เปิดบท →</em>
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
