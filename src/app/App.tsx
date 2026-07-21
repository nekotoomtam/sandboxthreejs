import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '../components/AppShell'
import { HomePage } from '../pages/HomePage'
import { LessonsPage } from '../pages/LessonsPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ConceptsPage } from '../pages/ConceptsPage'

const LessonPage = lazy(() =>
  import('../pages/LessonPage').then((module) => ({ default: module.LessonPage })),
)
const PlaygroundPage = lazy(() =>
  import('../pages/PlaygroundPage').then((module) => ({ default: module.PlaygroundPage })),
)
const ConceptDetailPage = lazy(() =>
  import('../pages/ConceptDetailPage').then((module) => ({ default: module.ConceptDetailPage })),
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

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="concepts" element={<ConceptsPage />} />
        <Route
          path="concepts/:conceptId"
          element={
            <Suspense fallback={<RouteLoader />}>
              <ConceptDetailPage />
            </Suspense>
          }
        />
        <Route
          path="lessons/:lessonId"
          element={
            <Suspense fallback={<RouteLoader />}>
              <LessonPage />
            </Suspense>
          }
        />
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
