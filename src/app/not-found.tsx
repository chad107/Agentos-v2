import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink-900">We couldn&apos;t find that record</h1>
      <p className="text-sm text-ink-500">
        It may have been resolved, or the link may be out of date.
      </p>
      <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
        ← Back to Home
      </Link>
    </div>
  );
}
