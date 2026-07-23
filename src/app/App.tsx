import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '../components/AppShell'
import { JourneyLoader } from '../components/JourneyLoader'
import { ConceptsPage } from '../pages/ConceptsPage'
import { LessonsPage } from '../pages/LessonsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

const ExperiencePage = lazy(() =>
  import('../pages/ExperiencePage').then((module) => ({ default: module.ExperiencePage })),
)
const LessonPage = lazy(() =>
  import('../pages/LessonPage').then((module) => ({ default: module.LessonPage })),
)
const PlaygroundPage = lazy(() =>
  import('../pages/PlaygroundPage').then((module) => ({ default: module.PlaygroundPage })),
)
const ConceptDetailPage = lazy(() =>
  import('../pages/ConceptDetailPage').then((module) => ({ default: module.ConceptDetailPage })),
)
const WorldMapPage = lazy(() =>
  import('../pages/WorldMapPage').then((module) => ({ default: module.WorldMapPage })),
)
const ChapterPage = lazy(() =>
  import('../pages/ChapterPage').then((module) => ({ default: module.ChapterPage })),
)

function RouteLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <p className="rounded-full bg-[#e4eee9] px-4 py-2 text-sm font-bold text-[#406a5f]">
        กำลังเตรียมฉาก 3D…
      </p>
    </div>
  )
}

function ExperienceRouteLoader() {
  return (
    <main className="experience-shell" data-experience-phase="loading">
      <section
        className="experience-loader-surface"
        data-testid="loader-surface"
        aria-live="polite"
      >
        <JourneyLoader mode="boot" progress={0} />
      </section>
    </main>
  )
}

function WorldRouteLoader() {
  return (
    <main className="world-journey">
      <JourneyLoader mode="travel" instant />
    </main>
  )
}

export function App() {
  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<ExperienceRouteLoader />}>
            <ExperiencePage />
          </Suspense>
        }
      />
      <Route
        path="worlds"
        element={
          <Suspense fallback={<RouteLoader />}>
            <WorldMapPage />
          </Suspense>
        }
      />
      <Route
        path="worlds/:worldId"
        element={
          <Suspense fallback={<WorldRouteLoader />}>
            <ChapterPage />
          </Suspense>
        }
      />
      <Route
        path="lessons/:lessonId"
        element={
          <Suspense fallback={<WorldRouteLoader />}>
            <LessonPage />
          </Suspense>
        }
      />
      <Route
        path="concepts/:conceptId"
        element={
          <Suspense fallback={<WorldRouteLoader />}>
            <ConceptDetailPage />
          </Suspense>
        }
      />
      <Route element={<AppShell />}>
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="concepts" element={<ConceptsPage />} />
        <Route
          path="playground"
          element={
            <Suspense fallback={<RouteLoader />}>
              <PlaygroundPage />
            </Suspense>
          }
        />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
