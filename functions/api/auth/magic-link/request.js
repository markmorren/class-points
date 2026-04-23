export async function onRequestPost(context) {
  const { request, env } = context;

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  if (!email || !email.includes('@')) {
    return json({ error: 'Valid email required' }, 400);
  }

  email = email.toLowerCase().trim();
  const token = crypto.randomUUID();
  const expires_at = Math.floor(Date.now() / 1000) + 900; // 15 minutes

  await env.DB.prepare(
    'INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)'
  ).bind(token, email, expires_at).run();

  const appUrl = env.APP_URL || 'https://points.morren.uk';
  const link = `${appUrl}/api/auth/magic-link/verify?token=${token}`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Class Points', email: 'noreply@points.morren.uk' },
      to: [{ email }],
      subject: 'Your Class Points sign-in link',
      htmlContent: `<p>Click the link below to sign in to Class Points. It expires in 15 minutes.</p><p><a href="${link}" style="font-size:18px;font-weight:bold">Sign in to Class Points</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    }),
  });

  // Always return 200 — don't leak whether the email exists
  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
