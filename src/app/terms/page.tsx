import fs from "node:fs";
import path from "node:path";

export default function TermsPage() {
  const htmlPath = path.join(process.cwd(), "terms.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  return (
    <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
