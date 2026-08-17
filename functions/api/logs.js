const VALID_PEOPLE = new Set(["Jubayer", "Mahin", "Razim"]);
const VALID_ACTIONS = new Set(["cleaning", "trash"]);
const VALID_DETAILS = {
  cleaning: new Set(["bathroom", "kitchen"]),
  trash: new Set(["bio", "plastic", "paper"]),
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    "SELECT id, person, action_type, details, entry_date, created_at FROM logs ORDER BY entry_date DESC, created_at DESC LIMIT 200"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { person, action_type, details, entry_date } = body;

  if (!VALID_PEOPLE.has(person)) return jsonError("Invalid person", 400);
  if (!VALID_ACTIONS.has(action_type)) return jsonError("Invalid action_type", 400);
  if (!Array.isArray(details) || details.length === 0) return jsonError("details must be a non-empty array", 400);
  if (!details.every(d => VALID_DETAILS[action_type].has(d))) return jsonError("Invalid detail for this action_type", 400);
  if (typeof entry_date !== "string" || !DATE_RE.test(entry_date)) return jsonError("entry_date must be YYYY-MM-DD", 400);

  await env.DB.prepare(
    "INSERT INTO logs (person, action_type, details, entry_date) VALUES (?, ?, ?, ?)"
  ).bind(person, action_type, JSON.stringify(details), entry_date).run();

  return Response.json({ success: true }, { status: 201 });
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}
