export async function onRequestPatch(context) {
  const { request, env, data, params } = context;
  const { classId, studentId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const body = await request.json();
  const updates = [];
  const bindings = [];

  if (body.display_name !== undefined) { updates.push('display_name = ?'); bindings.push(body.display_name.trim()); }
  if (body.position !== undefined) { updates.push('position = ?'); bindings.push(body.position); }
  if (body.avatar_seed !== undefined) { updates.push('avatar_seed = ?'); bindings.push(body.avatar_seed); }

  if (!updates.length) return json({ error: 'Nothing to update' }, 400);

  bindings.push(studentId, classId);
  await env.DB.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ? AND class_id = ?`)
    .bind(...bindings).run();

  const student = await env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(studentId).first();
  return json(student);
}

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const { classId, studentId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM point_events WHERE student_id = ? AND class_id = ?').bind(studentId, classId),
    env.DB.prepare('DELETE FROM students WHERE id = ? AND class_id = ?').bind(studentId, classId),
  ]);

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
