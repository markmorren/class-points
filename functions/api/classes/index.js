const DEFAULT_CATEGORIES = [
  { label: 'Great Work', points: 1, icon: '🌟' },
  { label: 'Kindness', points: 1, icon: '💛' },
  { label: 'Creativity', points: 1, icon: '🎨' },
  { label: 'Leadership', points: 1, icon: '🏅' },
  { label: 'Teamwork', points: 1, icon: '🤝' },
  { label: 'Homework Done', points: 1, icon: '📚' },
];

export async function onRequestGet(context) {
  const { env, data } = context;
  const teacherId = data.teacher.id;

  const rows = await env.DB.prepare(`
    SELECT c.*, ct.role,
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count,
      (SELECT COALESCE(SUM(pe.points), 0) FROM point_events pe
       WHERE pe.class_id = c.id
       AND pe.created_at >= strftime('%s', 'now', 'start of day')) as today_points
    FROM classes c
    JOIN class_teachers ct ON ct.class_id = c.id AND ct.teacher_id = ?
    WHERE c.archived_at IS NULL
    ORDER BY c.created_at DESC
  `).bind(teacherId).all();

  return json(rows.results);
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const teacherId = data.teacher.id;

  let name;
  try {
    ({ name } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!name?.trim()) return json({ error: 'Name required' }, 400);

  const id = crypto.randomUUID();
  const class_code = genCode();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    'INSERT INTO classes (id, owner_teacher_id, name, class_code, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, teacherId, name.trim(), class_code, now).run();

  await env.DB.prepare(
    'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES (?, ?, ?)'
  ).bind(id, teacherId, 'owner').run();

  const catStmts = DEFAULT_CATEGORIES.map((c, i) =>
    env.DB.prepare(
      'INSERT INTO categories (id, class_id, label, points, icon, is_positive) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(crypto.randomUUID(), id, c.label, c.points, c.icon)
  );
  await env.DB.batch(catStmts);

  const newClass = await env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(id).first();
  return json({ ...newClass, role: 'owner', student_count: 0, today_points: 0 }, 201);
}

function genCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
