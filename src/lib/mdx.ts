import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
export const PAYWALL_MARKER = "{/* PAYWALL_BREAK */}";

export interface PostFrontmatter {
  title: string;
  excerpt: string;
  publishedAt: string;
  category: string;
  isPremium?: boolean;
  embeddedTool?: "budget-splitter" | "subscription-leak" | "take-home-pay";
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostBySlug(slug: string, userIsPro: boolean) {
  // Reject anything that is not a plain slug, then basename as a second guard.
  if (!SLUG_RE.test(slug)) return null;
  const safeSlug = path.basename(slug);
  const fullPath = path.join(POSTS_DIR, `${safeSlug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const rawFile = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(rawFile);
  const frontmatter = data as PostFrontmatter;

  const isPremium = Boolean(frontmatter.isPremium);
  const hasPaywallMarker = content.includes(PAYWALL_MARKER);

  let bodyToRender = content;
  let isTruncatedByPaywall = false;

  if (isPremium && !userIsPro) {
    // Fail closed: a premium post with no marker shows nothing but the excerpt.
    bodyToRender = hasPaywallMarker ? (content.split(PAYWALL_MARKER)[0] ?? "") : "";
    isTruncatedByPaywall = true;
  }

  const wordCount = content.trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  return {
    slug: safeSlug,
    frontmatter,
    bodyToRender,
    isTruncatedByPaywall,
    readingTimeMinutes,
  };
}

export function getAllPostsMeta() {
  return getAllPostSlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), "utf8");
      const { data } = matter(raw);
      return { slug, ...(data as PostFrontmatter) };
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
