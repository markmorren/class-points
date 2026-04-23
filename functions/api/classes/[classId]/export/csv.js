export async function onRequestGet(context) {
  const { env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) {
    return new Response('Not found', { status: 404 });
  }

  const cls = await env.DB.prepare('SELECT name FROM classes WHERE id = ?').bind(classId).first();
  const rows = await env.DB.prepare(`
    SELECT
      datetime(pe.created_at, 'unixepoch') as date,
      s.display_name as student,
      c.label as category,
      pe.points
    FROM point_events pe
    JOIN students s ON s.id = pe.student_id
    JOIN categories c ON c.id = pe.category_id
    WHERE pe.class_id = ?
    ORDER BY pe.created_at ASC
  `).bind(classId).all();

  const header = 'Date,Student,Category,Points\n';
  const body = rows.results.map(r =>
    `"${r.date}","${r.student}","${r.category}",${r.points}`
  ).join('\n');

  const filename = `class-points-${cls?.name?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || classId}.csv`;

  return new Response(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

async function isMember(env, classId, teacherId) {
  const row = await env.DB.prepare(
    'SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?'
  ).bind(classId, teacherId).first();
  return !!row;
}
