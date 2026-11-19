import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsMeta } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Money Guides",
  description: "Practical, plain-English guides on budgeting, subscriptions and take-home pay.",
};

export default function BlogIndex() {
  const posts = getAllPostsMeta();
  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold">Money Guides</h1>
      <ul className="space-y-5">
        {posts.map((p) => (
          <li key={p.slug} className="card">
            <p className="text-xs text-muted-foreground">{p.category} · {p.publishedAt}</p>
            <Link href={`/blog/${p.slug}`} className="text-xl font-semibold underline">{p.title}</Link>
            {p.isPremium && <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">Pro</span>}
            <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
