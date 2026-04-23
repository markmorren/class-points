export async function onRequestGet(context) {
  const { data } = context;
  return json(data.teacher);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
