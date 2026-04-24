export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { email, display_name, password } = body || {};

  if (!email || !display_name || !password) {
    return json({ error: 'Email, display name, and password are required' }, 400);
  }
  if (!email.includes('@')) {
    return json({ error: 'Invalid email address' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM teachers WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    return json({ error: 'An account with that email already exists' }, 409);
  }

  const password_hash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO teachers (id, email, display_name, created_at, password_hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, email, display_name, now, password_hash).run();

  const sessionId = crypto.randomUUID();
  const expires_at = now + 30 * 24 * 60 * 60;

  await env.DB.prepare(
    'INSERT INTO sessions (id, teacher_id, expires_at, created_at, last_active_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(sessionId, id, expires_at, now, now).run();

  const cookieValue = `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`;

  return new Response(JSON.stringify({ id, email, display_name }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieValue,
    },
  });
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return btoa(String.fromCharCode(...salt)) + ':' + btoa(String.fromCharCode(...new Uint8Array(bits)));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
