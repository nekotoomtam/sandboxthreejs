type Props = {
  mode: 'boot' | 'travel'
  progress?: number
  exiting?: boolean
  instant?: boolean
}

export function JourneyLoader({ mode, progress, exiting = false, instant = false }: Props) {
  const percent =
    progress === undefined ? undefined : Math.round(Math.min(Math.max(progress, 0), 1) * 100)
  const boot = mode === 'boot'

  return (
    <div
      className={`journey-loader journey-loader--${mode}${
        exiting ? ' journey-loader--exiting' : ''
      }${instant ? ' journey-loader--instant' : ''}`}
      aria-live="polite"
    >
      <div className="journey-loader__orb" aria-hidden="true">
        <span className="journey-loader__halo" />
        <span className="journey-loader__core" />
      </div>

      <div className="journey-loader__copy">
        <p>{boot ? 'กำลังเตรียมโลก Three.js' : 'กำลังเดินทางเข้าสู่ดาวบทเรียน'}</p>
        <strong>{boot ? 'กำลังพา Mona เข้าสู่ฉาก' : 'แสงของโลกใหม่กำลังเปิดขึ้น'}</strong>
        <progress
          className="journey-loader__progress"
          max="100"
          value={percent}
          aria-label={boot ? 'ความคืบหน้าการเตรียมฉาก' : 'ความคืบหน้าการเดินทาง'}
        >
          {percent === undefined ? 'กำลังโหลด' : `${percent}%`}
        </progress>
        <small>{percent === undefined ? 'กำลังเชื่อมต่อฉาก…' : `${percent}%`}</small>
      </div>
    </div>
  )
}
