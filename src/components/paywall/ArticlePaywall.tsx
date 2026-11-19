import Link from "next/link";

export function ArticlePaywall({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="card relative mt-2 text-center" aria-label="Premium content">
      <h2 className="text-xl font-semibold">The rest of this guide is for Pro members</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Get the full step-by-step guide, unlimited saved budgets, bill reminders and an ad-free experience.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link href="/pricing" className="btn btn-primary">See Pro plans</Link>
        {!isAuthed && <Link href="/login?next=/pricing" className="btn">Log in</Link>}
      </div>
    </section>
  );
}
