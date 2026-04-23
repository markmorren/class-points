export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  let student_id, category_id;
  try {
    ({ student_id, category_id } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const category = await env.DB.prepare(
    'SELECT * FROM categories WHERE id = ? AND class_id = ?'
  ).bind(category_id, classId).first();
  if (!category) return json({ error: 'Category not found' }, 404);

  const student = await env.DB.prepare(
    'SELECT 1 FROM students WHERE id = ? AND class_id = ?'
  ).bind(student_id, classId).first();
  if (!student) return json({ error: 'Student not found' }, 404);

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO point_events (id, class_id, student_id, category_id, awarded_by_teacher_id, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, classId, student_id, category_id, data.teacher.id, category.points, now).run();

  return json({ id, student_id, category_id, points: category.points, created_at: now }, 201);
}

export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const rows = await env.DB.prepare(`
    SELECT pe.id, pe.student_id, pe.points, pe.created_at, pe.group_event_id,
      s.display_name as student_name,
      c.label as category_label, c.icon as category_icon
    FROM point_events pe
    JOIN students s ON s.id = pe.student_id
    JOIN categories c ON c.id = pe.category_id
    WHERE pe.class_id = ?
    ORDER BY pe.created_at DESC
    LIMIT 50
  `).bind(classId).all();

  return json(rows.results);
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
