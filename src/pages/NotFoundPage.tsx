import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[calc(100vh-70px)] place-items-center px-5 text-center">
      <div>
        <p className="text-7xl font-black text-[#d9e4df]">404</p>
        <h1 className="mt-2 text-2xl font-black text-[#21453c]">ยังไม่มีฉากนี้ในโลกของเรา</h1>
        <p className="mt-2 text-sm text-[#71817c]">ลิงก์อาจไม่ถูกต้อง หรือบทเรียนนี้ยังไม่เปิดให้ใช้งาน</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-[#173f37] px-5 py-3 text-sm font-bold text-white">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
