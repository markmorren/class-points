export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  const rows = await env.DB.prepare(`
    SELECT s.id, s.display_name, s.avatar_seed,
      COALESCE(SUM(pe.points), 0) as total
    FROM students s
    LEFT JOIN point_events pe ON pe.student_id = s.id
    WHERE s.class_id = ?
    GROUP BY s.id
    ORDER BY total DESC, s.display_name ASC
  `).bind(classId).all();

  const ranked = rows.results.map((r, i) => ({ ...r, rank: i + 1 }));
  return json(ranked);
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
