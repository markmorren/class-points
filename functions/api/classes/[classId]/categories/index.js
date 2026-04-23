export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const rows = await env.DB.prepare(
    'SELECT * FROM categories WHERE class_id = ? ORDER BY rowid ASC'
  ).bind(classId).all();
  return json(rows.results);
}

export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  let label, points, icon;
  try {
    ({ label, points, icon } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!label?.trim()) return json({ error: 'Label required' }, 400);

  const pts = Math.min(5, Math.max(1, parseInt(points) || 1));
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO categories (id, class_id, label, points, icon, is_positive) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(id, classId, label.trim(), pts, icon || null).run();

  const cat = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
  return json(cat, 201);
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
