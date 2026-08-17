const VALID_PEOPLE = new Set(["Jubayer", "Mahin", "Razim"]);
const VALID_ACTIONS = new Set(["cleaning", "trash"]);
const VALID_DETAILS = {
  cleaning: new Set(["bathroom", "kitchen"]),
  trash: new Set(["bio", "plastic", "paper"]),
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
let schemaReadyPromise = null;

function checkAdmin(request, env) {
  const adminSecret = env.ADMIN_PASSWORD || "wgputzamt2026";
  return request.headers.get("x-admin-key") === adminSecret;
}

async function ensureSchema(env) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const { results } = await env.DB.prepare("PRAGMA table_info(logs)").all();
      const hasTaskText = results.some(col => col.name === "task_text");
      if (!hasTaskText) {
        await env.DB.prepare("ALTER TABLE logs ADD COLUMN task_text TEXT").run();
      }
    })();
  }
  return schemaReadyPromise;
}

export async function onRequestGet(context) {
  const { env } = context;
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT id, person, action_type, details, entry_date, task_text, created_at FROM logs ORDER BY entry_date DESC, created_at DESC LIMIT 200"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  await ensureSchema(env);

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

  const uniqueDetails = [...new Set(details)];
  for (const detail of uniqueDetails) {
    await env.DB.prepare(
      "INSERT INTO logs (person, action_type, details, entry_date, task_text) VALUES (?, ?, ?, ?, ?)"
    ).bind(person, action_type, JSON.stringify([detail]), entry_date, null).run();
  }

  return Response.json({ success: true, created: uniqueDetails.length }, { status: 201 });
}

export async function onRequestPut(context) {
  const { request, env } = context;
  await ensureSchema(env);
  if (!checkAdmin(request, env)) return jsonError("Unauthorized", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const id = Number(body.id);
  const person = body.person || body.name;
  const entryDate = body.entry_date || body.date;
  const taskText = (body.task_text ?? body.task ?? body.message ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) return jsonError("Invalid id", 400);
  if (!VALID_PEOPLE.has(person)) return jsonError("Invalid person", 400);
  if (typeof entryDate !== "string" || !DATE_RE.test(entryDate)) return jsonError("entry_date must be YYYY-MM-DD", 400);

  await env.DB.prepare(
    "UPDATE logs SET person = ?, entry_date = ?, task_text = ? WHERE id = ?"
  ).bind(person, entryDate, taskText || null, id).run();

  return Response.json({ success: true });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAdmin(request, env)) return jsonError("Unauthorized", 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return jsonError("Invalid id", 400);

  await env.DB.prepare("DELETE FROM logs WHERE id = ?").bind(id).run();
  return Response.json({ success: true });
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}
