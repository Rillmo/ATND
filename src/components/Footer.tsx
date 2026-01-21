import Link from "next/link";
export default async function Footer() {
  const bmcUrl = process.env.NEXT_PUBLIC_BMC_URL;
  const supportEmail = process.env.SUPPORT_EMAIL;

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
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-700"
              aria-label="Support email"
              title="Support email"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </a>
          ) : null}
          {bmcUrl ? (
            <a
              href={bmcUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center"
              aria-label="Buy me a coffee"
              title="Buy me a coffee"
            >
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=junkim2&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                alt="Buy me a coffee"
                className="h-7 w-auto"
              />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
