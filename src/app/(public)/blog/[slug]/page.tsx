import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { AdSlot } from "@/components/ads/AdSlot";
import { BudgetSplitter } from "@/components/calculators/BudgetSplitter";
import { SubscriptionLeak } from "@/components/calculators/SubscriptionLeak";
import { TakeHomePay } from "@/components/calculators/TakeHomePay";
import { ArticlePaywall } from "@/components/paywall/ArticlePaywall";
import { getAllPostSlugs, getPostBySlug } from "@/lib/mdx";
import { getViewer } from "@/lib/viewer";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Metadata only needs frontmatter, so always resolve as non-pro (never leaks body).
  const post = getPostBySlug(slug, false);
  if (!post) return {};
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: "article", title: post.frontmatter.title, description: post.frontmatter.excerpt },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  const isPro = viewer?.isPro ?? false;
  const post = getPostBySlug(slug, isPro);
  if (!post) notFound();

  const { frontmatter } = post;
  const tool = frontmatter.embeddedTool;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.excerpt,
    datePublished: frontmatter.publishedAt,
    isAccessibleForFree: !frontmatter.isPremium,
  };

  return (
    <article className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="text-xs text-muted-foreground">{frontmatter.category} · {frontmatter.publishedAt} · {post.readingTimeMinutes} min read</p>
      <h1 className="mt-1 text-3xl font-bold">{frontmatter.title}</h1>

      <div className="prose-lite mt-4">
        {post.bodyToRender ? <MDXRemote source={post.bodyToRender} /> : <p>{frontmatter.excerpt}</p>}
      </div>

      {post.isTruncatedByPaywall ? (
        <ArticlePaywall isAuthed={Boolean(viewer)} />
      ) : (
        <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_IN_ARTICLE ?? ""} isPro={isPro} />
      )}

      {tool && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Try it yourself</h2>
          {tool === "budget-splitter" && (
            <BudgetSplitter isAuthed={Boolean(viewer)} initial={{ income: 0, need: 0, want: 0, saving: 0, debt: 0 }} currencyCode={viewer?.currencyCode} />
          )}
          {tool === "subscription-leak" && <SubscriptionLeak currencyCode={viewer?.currencyCode} />}
          {tool === "take-home-pay" && <TakeHomePay initial={{ gross: 0, deductions: 0, profile: "US-2026-SINGLE" }} currencyCode={viewer?.currencyCode} />}
        </section>
      )}
    </article>
  );
}
