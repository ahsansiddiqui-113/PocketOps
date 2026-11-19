export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, skipped: true as const };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "alerts@clearledger.app",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    }),
  });
  return { ok: res.ok, skipped: false as const };
}
