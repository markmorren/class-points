export async function onRequest(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const publicPaths = [
    '/api/auth/magic-link/request',
    '/api/auth/magic-link/verify',
  ];
  if (publicPaths.some(p => url.pathname.startsWith(p))) {
    return next();
  }

  await env.DB.exec('PRAGMA foreign_keys = ON');

  const cookie = request.headers.get('Cookie') || '';
  const sessionId = cookie.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('sessionId='))
    ?.split('=')[1];

  if (!sessionId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const session = await env.DB.prepare(
    `SELECT s.id, s.teacher_id, s.expires_at, t.email, t.display_name
     FROM sessions s JOIN teachers t ON t.id = s.teacher_id
     WHERE s.id = ? AND s.expires_at > ?`
  ).bind(sessionId, now).first();

  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }

  data.teacher = { id: session.teacher_id, email: session.email, display_name: session.display_name };
  data.sessionId = sessionId;
  data.db = env.DB;

  return next();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
