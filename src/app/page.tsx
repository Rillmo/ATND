import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-white/80 p-10 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
            Attendance, finally organized
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            조직 출석 체크를 가장 간결하게
          </h1>
          <p className="text-lg text-slate-600">
            매니저는 일정 기반으로 출석을 관리하고, 회원은 웹에서 바로 체크인합니다.
            필요 없는 기능은 빼고, 필요한 흐름만 남겼습니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-teal-700"
            >
              지금 시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              기존 계정 로그인
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="space-y-6">
            <div className="text-sm uppercase tracking-[0.2em] text-teal-200">
              오늘의 일정
            </div>
            <div className="rounded-xl bg-slate-800/70 p-4">
              <p className="text-lg font-semibold">스튜디오 스터디</p>
              <p className="text-sm text-slate-300">2025-01-15 19:00 - 20:00</p>
              <p className="mt-2 text-xs text-teal-200">출석 가능</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-4">
              <p className="text-lg font-semibold">운영진 회의</p>
              <p className="text-sm text-slate-300">2025-01-20 09:00 - 10:30</p>
              <p className="mt-2 text-xs text-slate-400">예정</p>
            </div>
            <div className="rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
              출석 체크 버튼은 시간과 위치 조건을 충족할 때만 활성화됩니다.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "역할 중심 관리",
            desc: "매니저 1명, 회원 다수 구조로 권한을 단순화했습니다.",
          },
          {
            title: "시간·위치 검증",
            desc: "출석 가능 시간과 반경을 기준으로 자동 검증합니다.",
          },
          {
            title: "경량한 운영",
            desc: "지각, 통계, 반복 일정 없이 핵심 흐름만 제공합니다.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70"
          >
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
