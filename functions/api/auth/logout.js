export async function onRequestPost(context) {
  const { env, data } = context;

  if (data.sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(data.sessionId).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'sessionId=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0',
    },
  });
}
