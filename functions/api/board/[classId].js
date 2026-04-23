// Board view endpoint — requires teacher session (same auth as all other API routes)
export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;

  const isMember = await env.DB.prepare(
    'SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(classId, data.teacher.id).first();
  if (!isMember) return json({ error: 'Not found' }, 404);

  const cls = await env.DB.prepare('SELECT id, name FROM classes WHERE id = ?').bind(classId).first();

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
  return json({ class_name: cls.name, leaderboard: ranked });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
