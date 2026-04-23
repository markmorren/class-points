export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const rows = await env.DB.prepare(`
    SELECT s.id, s.display_name, s.avatar_seed, s.position, s.created_at,
      COALESCE(SUM(pe.points), 0) as total_points
    FROM students s
    LEFT JOIN point_events pe ON pe.student_id = s.id
    WHERE s.class_id = ?
    GROUP BY s.id
    ORDER BY s.position ASC, s.created_at ASC
  `).bind(classId).all();

  return json(rows.results);
}

export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  let display_name;
  try {
    ({ display_name } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!display_name?.trim()) return json({ error: 'Name required' }, 400);

  const maxPos = await env.DB.prepare(
    'SELECT COALESCE(MAX(position), 0) as max_pos FROM students WHERE class_id = ?'
  ).bind(classId).first();

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO students (id, class_id, display_name, avatar_seed, position, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, classId, display_name.trim(), crypto.randomUUID(), (maxPos.max_pos + 1), now).run();

  const student = await env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(id).first();
  return json({ ...student, total_points: 0 }, 201);
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
