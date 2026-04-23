export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const { classId, catId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const body = await request.json();
  const updates = [];
  const bindings = [];

  if (body.label !== undefined) { updates.push('label = ?'); bindings.push(body.label.trim()); }
  if (body.points !== undefined) { updates.push('points = ?'); bindings.push(Math.min(5, Math.max(1, parseInt(body.points) || 1))); }
  if (body.icon !== undefined) { updates.push('icon = ?'); bindings.push(body.icon); }

  if (!updates.length) return json({ error: 'Nothing to update' }, 400);

  bindings.push(catId, classId);
  await env.DB.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND class_id = ?`)
    .bind(...bindings).run();

  const cat = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(catId).first();
  return json(cat);
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const { classId, catId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const inUse = await env.DB.prepare(
    'SELECT 1 FROM point_events WHERE category_id = ? LIMIT 1'
  ).bind(catId).first();
  if (inUse) return json({ error: 'Category has existing awards — cannot delete' }, 409);

  await env.DB.prepare('DELETE FROM categories WHERE id = ? AND class_id = ?').bind(catId, classId).run();
  return json({ ok: true });
}

async function isMember(env, classId, teacherId) {
  const row = await env.DB.prepare(
    'SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(classId, teacherId).first();
  return !!row;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
