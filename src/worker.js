const SESSION_COOKIE = "opjc_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 100000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/members/login") {
        return request.method === "POST"
          ? methodNotAllowed()
          : loginPage(request, env);
      }

      if (path === "/auth/login") {
        return request.method === "POST"
          ? handleLogin(request, env)
          : methodNotAllowed();
      }

      if (path === "/auth/logout") {
        return request.method === "POST"
          ? handleLogout(request, env)
          : methodNotAllowed();
      }

      if (path === "/members" || path === "/members/") {
        return membersPage(request, env);
      }

      if (path === "/admin" || path === "/admin/") {
        return adminPage(request, env);
      }

      if (path === "/setup" || path === "/setup/") {
        return request.method === "POST"
          ? handleSetup(request, env)
          : setupPage(request, env);
      }

      if (path === "/api/calendar") {
        return request.method === "GET"
          ? calendarApi(env)
          : methodNotAllowed();
      }

      if (path === "/admin/calendar/event") {
        return request.method === "POST"
          ? saveCalendarEvent(request, env)
          : methodNotAllowed();
      }

      if (path === "/admin/calendar/closure") {
        return request.method === "POST"
          ? saveCalendarClosure(request, env)
          : methodNotAllowed();
      }

      if (path === "/admin/calendar/delete") {
        return request.method === "POST"
          ? deleteCalendarItem(request, env)
          : methodNotAllowed();
      }

      if (path === "/admin/calendar/import") {
        return request.method === "POST"
          ? importExistingCalendar(request, env)
          : methodNotAllowed();
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("OPJC worker error", error);
      return htmlPage("Something went wrong", `
        <section class="page-content"><div class="container">
          <div class="page-card">
            <div class="eyebrow">OPJC</div>
            <h2>Something went wrong.</h2>
            <p>Please try again shortly.</p>
          </div>
        </div></section>`, 500);
    }
  }
};

async function loginPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (user) return redirect(user.role === "admin" ? "/admin" : "/members");

  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  return htmlPage("Member login", `
    <section class="page-hero">
      <div class="container">
        <div class="eyebrow">Members area</div>
        <h1>Sign in</h1>
        <p class="lead">Sign in to access member resources and club information.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container auth-wrap">
        <form class="page-card auth-card" method="post" action="/auth/login">
          <input type="hidden" name="next" value="${escapeHtml(next)}">
          <label>Email address
            <input type="email" name="email" autocomplete="username" required>
          </label>
          <label>Password
            <input type="password" name="password" autocomplete="current-password" required>
          </label>
          <button class="btn red" type="submit">Sign in</button>
        </form>
      </div>
    </section>`);
}

async function handleLogin(request, env) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const next = safeNext(String(form.get("next") || "/members"));

  const user = await env.AUTH_DB.prepare(
    "SELECT id, email, display_name, password_hash, role, active FROM users WHERE email = ? COLLATE NOCASE LIMIT 1"
  ).bind(email).first();

  if (!user || user.active !== 1 || !(await verifyPassword(password, user.password_hash))) {
    return htmlPage("Member login", `
      <section class="page-content"><div class="container auth-wrap">
        <div class="page-card auth-card">
          <div class="eyebrow">Members area</div>
          <h2>Sign in unsuccessful</h2>
          <p>The email address or password was not recognised.</p>
          <a class="btn red" href="/members/login?next=${encodeURIComponent(next)}">Try again</a>
        </div>
      </div></section>`, 401);
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();

  await env.AUTH_DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, user.id, tokenHash, expires, request.headers.get("user-agent") || "").run();

  return redirect(next, {
    "Set-Cookie": sessionCookie(token, SESSION_DAYS * 86400)
  });
}

async function handleLogout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.AUTH_DB.prepare(
      "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL"
    ).bind(tokenHash).run();
  }

  return redirect("/", {
    "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  });
}

async function membersPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/members");

  return htmlPage("Members", `
    <section class="page-hero">
      <div class="container">
        <div class="eyebrow">Members area</div>
        <h1>Welcome, ${escapeHtml(user.display_name)}</h1>
        <p class="lead">Member resources will live here.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container">
        <div class="placeholder-grid">
          <article class="page-card"><h3>Grading resources</h3><p>Syllabuses and grading material will be added here.</p></article>
          <article class="page-card"><h3>Club resources</h3><p>Member-only documents and useful downloads will appear here.</p></article>
          <article class="page-card"><h3>Your account</h3><p>${escapeHtml(user.email)} · ${escapeHtml(user.role)}</p></article>
        </div>
        <div class="member-actions">
          ${user.role === "admin" ? '<a class="btn ghost" href="/admin">Admin area</a>' : ""}
          <form method="post" action="/auth/logout"><button class="btn ghost" type="submit">Sign out</button></form>
        </div>
      </div>
    </section>`);
}

async function adminPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/admin");
  if (user.role !== "admin") {
    return htmlPage("Access denied", `
      <section class="page-content"><div class="container">
        <div class="page-card">
          <div class="eyebrow">Admin</div>
          <h2>Access denied</h2>
          <p>Your account does not have administrator access.</p>
          <a class="btn ghost" href="/members">Back to members</a>
        </div>
      </div></section>`, 403);
  }

  const events = await env.APP_DB.prepare(
    "SELECT id, event_date, title, location, description, featured FROM events ORDER BY event_date, id"
  ).all();
  const closures = await env.APP_DB.prepare(
    "SELECT id, closure_date, title, description FROM closures ORDER BY closure_date, id"
  ).all();

  const eventRows = (events.results || []).map(row => `
    <form class="admin-calendar-row" method="post" action="/admin/calendar/event">
      <input type="hidden" name="id" value="${escapeHtml(row.id)}">
      <label>Date<input type="date" name="date" value="${escapeHtml(row.event_date)}" required></label>
      <label>Title<input type="text" name="title" value="${escapeHtml(row.title)}" required></label>
      <label>Location<input type="text" name="location" value="${escapeHtml(row.location || "")}"></label>
      <label>Description<textarea name="description" rows="2">${escapeHtml(row.description || "")}</textarea></label>
      <label class="check-label"><input type="checkbox" name="featured" value="1" ${Number(row.featured) === 1 ? "checked" : ""}> Featured</label>
      <div class="admin-row-actions">
        <button class="btn ghost" type="submit">Save</button>
        <button class="btn danger" type="submit" formaction="/admin/calendar/delete" name="delete_ref" value="event:${escapeHtml(row.id)}">Delete</button>
      </div>
    </form>`).join("");

  const closureRows = (closures.results || []).map(row => `
    <form class="admin-calendar-row" method="post" action="/admin/calendar/closure">
      <input type="hidden" name="id" value="${escapeHtml(row.id)}">
      <label>Date<input type="date" name="date" value="${escapeHtml(row.closure_date)}" required></label>
      <label>Title<input type="text" name="title" value="${escapeHtml(row.title)}" required></label>
      <label class="wide-field">Description<textarea name="description" rows="2">${escapeHtml(row.description || "")}</textarea></label>
      <div class="admin-row-actions">
        <button class="btn ghost" type="submit">Save</button>
        <button class="btn danger" type="submit" formaction="/admin/calendar/delete" name="delete_ref" value="closure:${escapeHtml(row.id)}">Delete</button>
      </div>
    </form>`).join("");

  const isEmpty = !(events.results || []).length && !(closures.results || []).length;

  return htmlPage("Admin", `
    <section class="page-hero">
      <div class="container">
        <div class="eyebrow">Administration</div>
        <h1>Club admin</h1>
        <p class="lead">Authenticated as ${escapeHtml(user.display_name)}.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container">
        <div class="admin-heading">
          <div><div class="eyebrow">Calendar</div><h2>Events & closures</h2></div>
          <a class="btn ghost" href="/events.html">View public calendar</a>
        </div>

        ${isEmpty ? `
          <div class="page-card import-card">
            <h3>Import the existing calendar</h3>
            <p>The application database is empty. Import the current events and closure dates from the existing site data.</p>
            <form method="post" action="/admin/calendar/import">
              <button class="btn red" type="submit">Import existing calendar</button>
            </form>
          </div>` : ""}

        <section class="admin-calendar-section">
          <h3>Events</h3>
          <form class="admin-calendar-row new-row" method="post" action="/admin/calendar/event">
            <label>Date<input type="date" name="date" required></label>
            <label>Title<input type="text" name="title" required></label>
            <label>Location<input type="text" name="location"></label>
            <label>Description<textarea name="description" rows="2"></textarea></label>
            <label class="check-label"><input type="checkbox" name="featured" value="1"> Featured</label>
            <div class="admin-row-actions"><button class="btn red" type="submit">Add event</button></div>
          </form>
          <div class="admin-calendar-list">${eventRows || '<div class="empty-state">No events in the database yet.</div>'}</div>
        </section>

        <section class="admin-calendar-section">
          <h3>Closures</h3>
          <form class="admin-calendar-row new-row" method="post" action="/admin/calendar/closure">
            <label>Date<input type="date" name="date" required></label>
            <label>Title<input type="text" name="title" value="Club closed" required></label>
            <label class="wide-field">Description<textarea name="description" rows="2"></textarea></label>
            <div class="admin-row-actions"><button class="btn red" type="submit">Add closure</button></div>
          </form>
          <div class="admin-calendar-list">${closureRows || '<div class="empty-state">No closures in the database yet.</div>'}</div>
        </section>

        <div class="member-actions">
          <a class="btn ghost" href="/members">Members area</a>
          <form method="post" action="/auth/logout"><button class="btn ghost" type="submit">Sign out</button></form>
        </div>
      </div>
    </section>`);
}

async function setupPage(request, env) {
  const count = await env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  if (Number(count?.count || 0) > 0) return notFound();

  return htmlPage("Initial setup", `
    <section class="page-content"><div class="container auth-wrap">
      <form class="page-card auth-card" method="post" action="/setup">
        <div class="eyebrow">Initial setup</div>
        <h2>Create the first administrator</h2>
        <p>This page disables itself as soon as the first account exists.</p>
        <label>Setup key
          <input type="password" name="setup_key" autocomplete="off" required>
        </label>
        <label>Name
          <input type="text" name="display_name" autocomplete="name" required>
        </label>
        <label>Email address
          <input type="email" name="email" autocomplete="email" required>
        </label>
        <label>Password
          <input type="password" name="password" autocomplete="new-password" minlength="12" required>
        </label>
        <button class="btn red" type="submit">Create administrator</button>
      </form>
    </div></section>`);
}

async function handleSetup(request, env) {
  const count = await env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM users").first();
  if (Number(count?.count || 0) > 0) return notFound();

  const bootstrapToken = env.BOOTSTRAP_TOKEN?.get ? await env.BOOTSTRAP_TOKEN.get() : env.BOOTSTRAP_TOKEN;
  if (!bootstrapToken) {
    return htmlPage("Setup unavailable", `
      <section class="page-content"><div class="container">
        <div class="page-card"><h2>Setup is not enabled.</h2><p>The BOOTSTRAP_TOKEN secret has not been configured.</p></div>
      </div></section>`, 503);
  }

  const form = await request.formData();
  const setupKey = String(form.get("setup_key") || "");
  const displayName = String(form.get("display_name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!constantTimeEqual(setupKey, bootstrapToken)) return forbidden();
  if (!displayName || !email || password.length < 12) {
    return htmlPage("Invalid setup", `
      <section class="page-content"><div class="container">
        <div class="page-card"><h2>Check the details.</h2><p>A name, valid email and password of at least 12 characters are required.</p></div>
      </div></section>`, 400);
  }

  const passwordHash = await hashPassword(password);
  await env.AUTH_DB.prepare(
    "INSERT INTO users (email, display_name, password_hash, role, active) VALUES (?, ?, ?, 'admin', 1)"
  ).bind(email, displayName, passwordHash).run();

  return redirect("/members/login");
}

async function calendarApi(env) {
  const [events, closures] = await Promise.all([
    env.APP_DB.prepare(
      "SELECT event_date AS date, title, location, description, featured FROM events ORDER BY event_date, id"
    ).all(),
    env.APP_DB.prepare(
      "SELECT closure_date AS date, title, description FROM closures ORDER BY closure_date, id"
    ).all()
  ]);

  return new Response(JSON.stringify({
    events: events.results || [],
    closures: closures.results || []
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function requireAdmin(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== "admin") return null;
  if (!sameOrigin(request)) return null;
  return user;
}

async function saveCalendarEvent(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();
  const form = await request.formData();
  const id = positiveInt(form.get("id"));
  const date = String(form.get("date") || "");
  const title = String(form.get("title") || "").trim();
  const location = String(form.get("location") || "").trim();
  const description = String(form.get("description") || "").trim();
  const featured = form.get("featured") === "1" ? 1 : 0;
  if (!validDate(date) || !title) return badRequest("A valid date and title are required.");

  if (id) {
    await env.APP_DB.prepare(
      "UPDATE events SET event_date=?, title=?, location=?, description=?, featured=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(date, title, location || null, description || null, featured, id).run();
  } else {
    await env.APP_DB.prepare(
      "INSERT INTO events (event_date, title, location, description, featured) VALUES (?, ?, ?, ?, ?)"
    ).bind(date, title, location || null, description || null, featured).run();
  }
  return redirect("/admin");
}

async function saveCalendarClosure(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();
  const form = await request.formData();
  const id = positiveInt(form.get("id"));
  const date = String(form.get("date") || "");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  if (!validDate(date) || !title) return badRequest("A valid date and title are required.");

  if (id) {
    await env.APP_DB.prepare(
      "UPDATE closures SET closure_date=?, title=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(date, title, description || null, id).run();
  } else {
    await env.APP_DB.prepare(
      "INSERT INTO closures (closure_date, title, description) VALUES (?, ?, ?)"
    ).bind(date, title, description || null).run();
  }
  return redirect("/admin");
}

async function deleteCalendarItem(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();
  const form = await request.formData();
  const ref = String(form.get("delete_ref") || "");
  const [type, rawId] = ref.split(":");
  const id = positiveInt(rawId);
  if (!id || !["event", "closure"].includes(type)) return badRequest("Invalid calendar item.");

  if (type === "event") {
    await env.APP_DB.prepare("DELETE FROM events WHERE id=?").bind(id).run();
  } else {
    await env.APP_DB.prepare("DELETE FROM closures WHERE id=?").bind(id).run();
  }
  return redirect("/admin");
}

async function importExistingCalendar(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();

  const counts = await Promise.all([
    env.APP_DB.prepare("SELECT COUNT(*) AS count FROM events").first(),
    env.APP_DB.prepare("SELECT COUNT(*) AS count FROM closures").first()
  ]);
  if (Number(counts[0]?.count || 0) || Number(counts[1]?.count || 0)) {
    return badRequest("The calendar database is not empty.");
  }

  const sourceUrl = new URL("/assets/events.json", request.url);
  const response = await env.ASSETS.fetch(new Request(sourceUrl));
  if (!response.ok) return badRequest("Existing calendar data could not be loaded.");
  const data = await response.json();

  const statements = [];
  for (const item of data.events || []) {
    statements.push(env.APP_DB.prepare(
      "INSERT INTO events (event_date, title, location, description, featured) VALUES (?, ?, ?, ?, ?)"
    ).bind(item.date, item.title, item.location || null, item.description || null, 0));
  }
  for (const item of data.closures || []) {
    statements.push(env.APP_DB.prepare(
      "INSERT INTO closures (closure_date, title, description) VALUES (?, ?, ?)"
    ).bind(item.date, item.title || "Club closed", item.description || null));
  }
  if (statements.length) await env.APP_DB.batch(statements);
  return redirect("/admin");
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function positiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function badRequest(message) {
  return new Response(String(message), { status: 400 });
}

async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const row = await env.AUTH_DB.prepare(`
    SELECT u.id, u.email, u.display_name, u.role, u.active
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > ?
      AND u.active = 1
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();

  if (!row) return null;

  await env.AUTH_DB.prepare(
    "UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?"
  ).bind(tokenHash).run();

  return row;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;

  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await derivePassword(password, salt, iterations);
  return constantTimeBytes(actual, expected);
}

async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function sessionCookie(token, maxAge) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function randomToken(bytes) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return base64Url(data);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function base64Url(bytes) {
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function constantTimeBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function constantTimeEqual(a, b) {
  const aa = new TextEncoder().encode(String(a));
  const bb = new TextEncoder().encode(String(b));
  return constantTimeBytes(aa, bb);
}

function safeNext(value) {
  const v = String(value || "/members");
  if (!v.startsWith("/") || v.startsWith("//")) return "/members";
  if (v !== "/members" && v !== "/admin") return "/members";
  return v;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 303,
    headers: { Location: location, ...extraHeaders }
  });
}

function methodNotAllowed() {
  return new Response("Method Not Allowed", { status: 405 });
}

function forbidden() {
  return new Response("Forbidden", { status: 403 });
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

function htmlPage(title, content, status = 200) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} | Old Priory Judo Club York</title>
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>
  <nav class="nav">
    <div class="container nav-inner">
      <a class="brand" href="/"><span class="mark"><img src="/assets/old-priory-logo.webp" alt="Old Priory Judo Club logo"></span><span>Old Priory Judo Club<small>York · Est. 1947</small></span></a>
      <div class="links"><a class="nav-link" href="/">Home</a><a class="nav-link" href="/events.html">Events</a><a class="nav-link" href="/history.html">History</a><a class="nav-link" href="/instructors.html">Instructors</a></div>
    </div>
  </nav>
  <main>${content}</main>
  <footer><div class="container foot"><strong>Old Priory Judo Club · York</strong><small>Affiliated with Bushido ZaZen International</small></div></footer>
  <script src="/assets/site.js"></script>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
