import { NavLink, Outlet } from 'react-router'

const navItems = [
  { to: '/', label: 'ภาพรวม', icon: '⌂', end: true },
  { to: '/lessons', label: 'บทเรียน', icon: '◫' },
  { to: '/concepts', label: 'คลังแนวคิด', icon: '◎' },
  { to: '/playground', label: 'สนามทดลอง', icon: '◇' },
]

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f3f5f4] text-[#142823]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-white/10 bg-[#102f2b] text-white lg:flex">
        <div className="flex h-[78px] items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-[#f3a83b] text-lg font-black text-[#16342e] shadow-[0_8px_24px_rgba(243,168,59,.24)]">
            3D
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">ThreeLab</p>
            <p className="text-[11px] text-emerald-100/60">LEARN · BUILD · PLAY</p>
          </div>
        </div>

        <nav className="mt-5 space-y-2 px-4" aria-label="เมนูหลัก">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#173f37] shadow-sm'
                    : 'text-emerald-50/70 hover:bg-white/7 hover:text-white'
                }`
              }
            >
              <span className="grid size-7 place-items-center rounded-lg bg-current/8 text-base">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-emerald-50/65">เส้นทางพื้นฐาน</span>
              <span className="font-bold text-[#ffc66e]">1/4</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
              <div className="h-full w-1/4 rounded-full bg-[#f3a83b]" />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-emerald-50/45">
              เริ่มจากกล่องหนึ่งใบ แล้วค่อยสร้างโลก 3D ของคุณ
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#dfe5e2] bg-[#f8faf9]/90 px-5 backdrop-blur-md sm:px-8">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-[#f3a83b] text-xs">3D</span>
            ThreeLab
          </NavLink>
          <p className="hidden text-sm text-[#667a74] lg:block">
            เรียน Three.js ผ่านการลงมือทดลองจริง
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#e4eee9] px-3 py-1.5 text-xs font-semibold text-[#315d52] sm:inline">
              เส้นทางเริ่มต้น
            </span>
            <div className="grid size-9 place-items-center rounded-full bg-[#d8eee5] text-sm font-extrabold text-[#1c5748]">
              T
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-70px)] pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/15 bg-[#102f2b]/95 p-2 text-white shadow-[0_14px_40px_rgba(10,31,27,.3)] backdrop-blur-md lg:hidden"
        aria-label="เมนูหลักสำหรับมือถือ"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-bold transition ${
                isActive ? 'bg-white text-[#173f37]' : 'text-white/65'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
