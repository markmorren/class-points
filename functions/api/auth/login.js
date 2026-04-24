export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const teacher = await env.DB.prepare(
    'SELECT id, email, display_name, password_hash FROM teachers WHERE email = ?'
  ).bind(email).first();

  if (!teacher || !teacher.password_hash) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, teacher.password_hash);
  if (!valid) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const sessionId = crypto.randomUUID();
  const expires_at = now + 30 * 24 * 60 * 60;

  await env.DB.prepare(
    'INSERT INTO sessions (id, teacher_id, expires_at, created_at, last_active_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(sessionId, teacher.id, expires_at, now, now).run();

  const cookieValue = `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`;

  return new Response(JSON.stringify({ id: teacher.id, email: teacher.email, display_name: teacher.display_name }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieValue,
    },
  });
}

async function verifyPassword(password, stored) {
  const [saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
