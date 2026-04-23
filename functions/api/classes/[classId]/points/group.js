export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  let student_ids, category_id;
  try {
    ({ student_ids, category_id } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return json({ error: 'student_ids must be a non-empty array' }, 400);
  }

  const category = await env.DB.prepare(
    'SELECT * FROM categories WHERE id = ? AND class_id = ?'
  ).bind(category_id, classId).first();
  if (!category) return json({ error: 'Category not found' }, 404);

  const now = Math.floor(Date.now() / 1000);
  const groupEventId = crypto.randomUUID();

  const insertGroup = env.DB.prepare(
    'INSERT INTO group_events (id, class_id, category_id, awarded_by_teacher_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(groupEventId, classId, category_id, data.teacher.id, now);

  const insertPoints = student_ids.map(sid =>
    env.DB.prepare(
      'INSERT INTO point_events (id, class_id, student_id, category_id, awarded_by_teacher_id, points, created_at, group_event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), classId, sid, category_id, data.teacher.id, category.points, now, groupEventId)
  );

  await env.DB.batch([insertGroup, ...insertPoints]);

  return json({ group_event_id: groupEventId, count: student_ids.length, points: category.points }, 201);
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
