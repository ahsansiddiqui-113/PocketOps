// Integration checks against a RUNNING app + migrated Postgres.
// Usage: BASE=http://localhost:3055 WEBHOOK_SECRET=... CRON_SECRET=... DATABASE_URL=... node scripts/integration.mjs
import crypto from "node:crypto";
import postgres from "postgres";

const BASE = process.env.BASE ?? "http://localhost:3055";
const WH = process.env.WEBHOOK_SECRET ?? "whsec";
const CRON = process.env.CRON_SECRET ?? "testcron";
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + extra}`);
  if (!ok) failed++;
};

const email = `it-${Date.now()}@example.com`;
const signup = await fetch(`${BASE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: BASE },
  body: JSON.stringify({ email, password: "correct-horse-battery", name: "IT User" }),
});
check("sign-up succeeds", signup.ok, String(signup.status));
const cookie = signup.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const [user] = await sql`select id, plan from users where email = ${email}`;
check("user row has uuid id + free plan", Boolean(user) && user.plan === "free", JSON.stringify(user));

const get = (path, withCookie) => fetch(`${BASE}${path}`, { headers: withCookie ? { cookie } : {} }).then((r) => r.text());

// Free user: ads + paywall
let page = await get("/tools/take-home-pay", true);
check("free user gets AdSense script", page.includes("adsbygoogle.js"));
let post = await get("/blog/survive-rent-hikes", true);
check("free user: premium text after break absent", !post.includes("Trim in this order"));
check("free user: paywall shown", post.includes("for Pro members"));
const anonDash = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
check("anonymous /dashboard redirects to login", anonDash.status === 307 && (anonDash.headers.get("location") ?? "").includes("/login"), String(anonDash.status));
const dash = await fetch(`${BASE}/dashboard`, { headers: { cookie }, redirect: "manual" });
check("free user can open dashboard (no redirect)", dash.status === 200, String(dash.status));
check("dashboard has no ad script/slot", !(await dash.text()).includes("adsbygoogle"));

// Webhook
const sendWebhook = (event, attrs, headers = {}) => {
  const body = JSON.stringify({
    meta: { event_name: event, custom_data: { user_id: user.id } },
    data: { id: "sub_1", attributes: { status: "active", customer_id: 9, variant_id: 7, updated_at: "2026-11-19T00:00:00Z", renews_at: new Date(Date.now() + 30 * 864e5).toISOString(), ...attrs } },
  });
  const sig = crypto.createHmac("sha256", WH).update(body).digest("hex");
  return fetch(`${BASE}/api/webhooks/billing`, { method: "POST", headers: { "x-signature": sig, ...headers }, body });
};
const bad = await fetch(`${BASE}/api/webhooks/billing`, { method: "POST", headers: { "x-signature": "nope" }, body: "{}" });
check("webhook bad signature -> 401", bad.status === 401);

const w1 = await sendWebhook("subscription_created", {});
check("webhook subscription_created -> 200", w1.status === 200);
const [afterCreate] = await sql`select plan from users where id = ${user.id}`;
check("user upgraded to pro", afterCreate.plan === "pro", afterCreate.plan);

const w2 = await sendWebhook("subscription_created", {});
const j2 = await w2.json();
check("replayed webhook -> duplicate:true", w2.status === 200 && j2.duplicate === true, JSON.stringify(j2));
const [{ n }] = await sql`select count(*)::int n from subscriptions where user_id = ${user.id}`;
check("still exactly one subscription row", n === 1, String(n));

// Pro experience
page = await get("/tools/take-home-pay", true);
check("pro user: no AdSense script", !page.includes("adsbygoogle"));
post = await get("/blog/survive-rent-hikes", true);
check("pro user: full premium article", post.includes("Trim in this order"));
check("pro user: no paywall box", !post.includes("for Pro members"));

// Cancel keeps pro until period end; expire downgrades
await sendWebhook("subscription_cancelled", { status: "cancelled", cancelled: true, updated_at: "2026-11-19T01:00:00Z" });
const [afterCancel] = await sql`select plan from users where id = ${user.id}`;
check("cancelled sub keeps pro until period end", afterCancel.plan === "pro", afterCancel.plan);
await sendWebhook("subscription_expired", { status: "expired", updated_at: "2026-11-19T02:00:00Z" });
const [afterExpire] = await sql`select plan from users where id = ${user.id}`;
check("expired sub downgrades to free", afterExpire.plan === "free", afterExpire.plan);

// Cron
check("cron without token -> 401", (await fetch(`${BASE}/api/cron/bill-reminders`)).status === 401);
await sql`update users set plan = 'pro' where id = ${user.id}`;
const today = new Date().toISOString().slice(0, 10);
await sql`insert into recurring_bills (user_id, name, amount_cents, billing_cycle, next_due_date, remind_days_before)
          values (${user.id}, 'Soon', 5000, 'monthly', ${today}::date + 1, 2),
                 (${user.id}, 'Overdue', 7000, 'weekly', ${today}::date - 10, 2)`;
const cron = await fetch(`${BASE}/api/cron/bill-reminders`, { headers: { authorization: `Bearer ${CRON}` } });
check("cron with token -> 200", cron.status === 200, String(cron.status));
const bills = await sql`select name, next_due_date::text d, last_reminded_for_date::text r from recurring_bills where user_id = ${user.id}`;
const soon = bills.find((b) => b.name === "Soon");
const overdue = bills.find((b) => b.name === "Overdue");
check("upcoming bill marked reminded", soon?.r === soon?.d && soon?.r != null, JSON.stringify(soon));
check("overdue bill rolled forward", overdue && overdue.d > today || overdue?.d >= new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10), JSON.stringify(overdue));

await sql.end();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
