export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const { classId, eventId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const event = await env.DB.prepare(
    'SELECT * FROM point_events WHERE id = ? AND class_id = ?'
  ).bind(eventId, classId).first();
  if (!event) return json({ error: 'Event not found' }, 404);

  if (event.awarded_by_teacher_id !== data.teacher.id) {
    return json({ error: 'You can only undo your own awards' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - event.created_at > 60) {
    return json({ error: 'Undo window has expired (60 seconds)' }, 409);
  }

  if (event.group_event_id) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM point_events WHERE group_event_id = ?').bind(event.group_event_id),
      env.DB.prepare('DELETE FROM group_events WHERE id = ?').bind(event.group_event_id),
    ]);
  } else {
    await env.DB.prepare('DELETE FROM point_events WHERE id = ?').bind(eventId).run();
  }

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
