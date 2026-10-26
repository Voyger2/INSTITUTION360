import Link from "next/link";

export function NotFoundView({
  title = "We can't find that page",
  description = "The page you requested does not exist in this prototype. If you followed a link from a complaint or institution record, the reference number may be invalid — demonstration data only contains cases listed in the registers.",
  entityType,
}: {
  title?: string;
  description?: string;
  entityType?: "case" | "institution";
}) {
  const resolvedDescription =
    entityType === "case"
      ? "The complaint reference you requested is not present in this prototype's synthetic dataset. Demonstration data contains only the cases listed in the complaint register."
      : entityType === "institution"
        ? "The institution reference you requested is not present in this prototype's synthetic dataset. Demonstration data contains only the institutions listed in the institution register."
        : description;

  return (
    <div className="card p-6 max-w-xl w-full">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        HTTP 404 — Not found
      </p>
      <h1 className="page-title mt-2">{title}</h1>
      <p className="text-sm text-ink-muted mt-2 leading-relaxed">
        {resolvedDescription}
      </p>
      <p className="text-sm text-ink-muted mt-2">
        Demonstration environment: this prototype stores no backend records.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
        <Link href="/complaints" className="btn btn-secondary">
          Complaint register
        </Link>
        <Link href="/institutions" className="btn btn-secondary">
          Institution register
        </Link>
        <Link href="/help" className="btn btn-ghost">
          Help &amp; guide
        </Link>
      </div>
    </div>
  );
}
