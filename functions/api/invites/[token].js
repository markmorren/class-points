export async function onRequestGet(context) {
  const { env, params } = context;
  const { token } = params;
  const now = Math.floor(Date.now() / 1000);

  const invite = await env.DB.prepare(`
    SELECT i.*, c.name as class_name FROM invites i
    JOIN classes c ON c.id = i.class_id
    WHERE i.token = ? AND i.expires_at > ? AND i.used_by_teacher_id IS NULL
  `).bind(token, now).first();

  if (!invite) return json({ error: 'Invite not found or expired' }, 404);
  return json({ class_name: invite.class_name, role: invite.role });
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const { token } = params;
  const now = Math.floor(Date.now() / 1000);

  const invite = await env.DB.prepare(
    'SELECT * FROM invites WHERE token = ? AND expires_at > ? AND used_by_teacher_id IS NULL'
  ).bind(token, now).first();
  if (!invite) return json({ error: 'Invite not found or expired' }, 404);

  // Teacher must already be signed in (session cookie checked by middleware)
  // data.teacher is set by _middleware.js
  const teacherId = context.data?.teacher?.id;
  if (!teacherId) return json({ error: 'Sign in first' }, 401);

  const alreadyMember = await env.DB.prepare(
    'SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(invite.class_id, teacherId).first();

  if (!alreadyMember) {
    await env.DB.prepare(
      'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES (?, ?, ?)'
    ).bind(invite.class_id, teacherId, invite.role).run();
  }

  await env.DB.prepare('UPDATE invites SET used_by_teacher_id = ? WHERE token = ?')
    .bind(teacherId, token).run();

  return json({ ok: true, class_id: invite.class_id });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
