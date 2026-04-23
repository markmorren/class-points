export async function onRequestPost(context) {
  const { env, data, params } = context;
  const { classId } = params;

  const membership = await env.DB.prepare(
    'SELECT role FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(classId, data.teacher.id).first();
  if (!membership) return json({ error: 'Not found' }, 404);
  if (membership.role !== 'owner') return json({ error: 'Owner only' }, 403);

  // Expire any existing unused invites for this class
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'UPDATE invites SET expires_at = ? WHERE class_id = ? AND used_by_teacher_id IS NULL'
  ).bind(now, classId).run();

  const token = crypto.randomUUID();
  const expires_at = now + 7 * 24 * 60 * 60; // 7 days
  await env.DB.prepare(
    'INSERT INTO invites (token, class_id, role, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, classId, 'member', expires_at).run();

  const appUrl = env.APP_URL || 'https://points.morren.uk';
  return json({ token, url: `${appUrl}/invite/${token}` }, 201);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
