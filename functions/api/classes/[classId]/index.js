export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;

  const membership = await checkMembership(env, classId, data.teacher.id);
  if (!membership) return json({ error: 'Not found' }, 404);

  const cls = await env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(classId).first();
  const teachers = await env.DB.prepare(`
    SELECT t.id, t.email, t.display_name, ct.role
    FROM class_teachers ct JOIN teachers t ON t.id = ct.teacher_id
    WHERE ct.class_id = ?
  `).bind(classId).all();

  return json({ ...cls, teachers: teachers.results, role: membership.role });
}

export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const { classId } = params;

  const membership = await checkMembership(env, classId, data.teacher.id);
  if (!membership) return json({ error: 'Not found' }, 404);
  if (membership.role !== 'owner') return json({ error: 'Owner only' }, 403);

  const body = await request.json();
  const updates = [];
  const bindings = [];

  if (body.name !== undefined) { updates.push('name = ?'); bindings.push(body.name.trim()); }
  if (body.archived_at !== undefined) { updates.push('archived_at = ?'); bindings.push(body.archived_at); }

  if (!updates.length) return json({ error: 'Nothing to update' }, 400);

  bindings.push(classId);
  await env.DB.prepare(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...bindings).run();

  const cls = await env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(classId).first();
  return json(cls);
}

async function checkMembership(env, classId, teacherId) {
  return env.DB.prepare(
    'SELECT role FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(classId, teacherId).first();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
