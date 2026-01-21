import Link from "next/link";
export default async function Footer() {
  const bmcUrl = process.env.NEXT_PUBLIC_BMC_URL;

  return (
    <footer className="border-t border-slate-200/70 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>ATND</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-slate-700">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            Privacy
          </Link>
          {bmcUrl ? (
            <a
              href={bmcUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-700"
            >
              Buy me a coffee
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
