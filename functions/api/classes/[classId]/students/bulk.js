export async function onRequestPost(context) {
  const { request, env, data, params } = context;
  const { classId } = params;
  if (!await isMember(env, classId, data.teacher.id)) return json({ error: 'Not found' }, 404);

  let names;
  try {
    ({ names } = await request.json());
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!Array.isArray(names)) return json({ error: 'names must be an array' }, 400);

  const unique = [...new Set(names.map(n => String(n).trim()).filter(Boolean))];
  if (unique.length === 0) return json({ error: 'No names provided' }, 400);
  if (unique.length > 100) return json({ error: 'Maximum 100 pupils per import' }, 400);

  const existing = await env.DB.prepare(
    'SELECT display_name FROM students WHERE class_id = ?'
  ).bind(classId).all();
  const existingNames = new Set(existing.results.map(r => r.display_name.toLowerCase()));

  const maxPos = await env.DB.prepare(
    'SELECT COALESCE(MAX(position), 0) as max_pos FROM students WHERE class_id = ?'
  ).bind(classId).first();

  const now = Math.floor(Date.now() / 1000);
  let pos = maxPos.max_pos;
  const created = [];
  const skipped = [];
  const stmts = [];

  for (const name of unique) {
    if (existingNames.has(name.toLowerCase())) {
      skipped.push(name);
      continue;
    }
    pos++;
    stmts.push(
      env.DB.prepare(
        'INSERT INTO students (id, class_id, display_name, avatar_seed, position, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), classId, name, crypto.randomUUID(), pos, now)
    );
    created.push(name);
  }

  if (stmts.length > 0) await env.DB.batch(stmts);

  return json({ created, skipped }, 201);
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
