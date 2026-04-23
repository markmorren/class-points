export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const appUrl = env.APP_URL || 'https://points.morren.uk';

  if (!token) return redirect(appUrl + '/?error=invalid_link');

  const now = Math.floor(Date.now() / 1000);
  const link = await env.DB.prepare(
    'SELECT * FROM magic_links WHERE token = ? AND expires_at > ? AND used_at IS NULL'
  ).bind(token, now).first();

  if (!link) return redirect(appUrl + '/?error=expired_link');

  await env.DB.prepare('UPDATE magic_links SET used_at = ? WHERE token = ?')
    .bind(now, token).run();

  const email = link.email;
  let teacher = await env.DB.prepare('SELECT * FROM teachers WHERE email = ?')
    .bind(email).first();

  if (!teacher) {
    const id = crypto.randomUUID();
    const display_name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || email;
    await env.DB.prepare(
      'INSERT INTO teachers (id, email, display_name, created_at) VALUES (?, ?, ?, ?)'
    ).bind(id, email, display_name, now).run();
    teacher = { id, email, display_name };
  }

  const sessionId = crypto.randomUUID();
  const expires_at = now + 30 * 24 * 60 * 60; // 30 days
  await env.DB.prepare(
    'INSERT INTO sessions (id, teacher_id, expires_at, created_at, last_active_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(sessionId, teacher.id, expires_at, now, now).run();

  const cookieValue = `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: appUrl + '/',
      'Set-Cookie': cookieValue,
    },
  });
}

function redirect(url) {
  return new Response(null, { status: 302, headers: { Location: url } });
}
