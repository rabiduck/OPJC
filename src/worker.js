const SESSION_COOKIE = "opjc_session";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 100000;
const INVITE_DAYS = 7;
const RESET_MINUTES = 60;

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

      if (path === "/join") {
        return request.method === "POST" ? handleJoin(request, env) : joinPage(request, env);
      }

      if (path === "/reset-password") {
        return request.method === "POST" ? handlePasswordReset(request, env) : passwordResetPage(request, env);
      }

      if (path === "/members/account") {
        return request.method === "POST" ? handleChangePassword(request, env) : accountPage(request, env);
      }

      if (path === "/members" || path === "/members/") {
        return membersPage(request, env);
      }

      const resourceDownloadMatch = path.match(/^\/members\/resource\/(\d+)\/download$/);
      if (resourceDownloadMatch) {
        return request.method === "GET"
          ? downloadMemberResource(request, env, Number(resourceDownloadMatch[1]))
          : methodNotAllowed();
      }

      if (path === "/admin" || path === "/admin/") {
        return adminPage(request, env);
      }

      if (path === "/setup" || path === "/setup/") {
        return request.method === "POST"
          ? handleSetup(request, env)
          : setupPage(request, env);
      }

      if (path === "/contact") {
        if (request.method === "POST") return handleContactPrototype(request);
        if (request.method === "GET") return contactPage();
        return methodNotAllowed();
      }

      if (path === "/api/calendar") {
        return request.method === "GET"
          ? calendarApi(env)
          : methodNotAllowed();
      }

      if (path === "/admin/calendar") {
        return request.method === "GET" ? adminCalendarPage(request, env) : methodNotAllowed();
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

      if (path === "/admin/members") {
        return request.method === "GET" ? adminMembersPage(request, env) : methodNotAllowed();
      }
      if (path === "/admin/members/invite") {
        return request.method === "POST" ? createMemberInvite(request, env) : methodNotAllowed();
      }
      if (path === "/admin/members/reset") {
        return request.method === "POST" ? createPasswordReset(request, env) : methodNotAllowed();
      }
      if (path === "/admin/members/status") {
        return request.method === "POST" ? changeMemberStatus(request, env) : methodNotAllowed();
      }
      if (path === "/admin/members/revoke") {
        return request.method === "POST" ? revokeMemberSessions(request, env) : methodNotAllowed();
      }

      if (path === "/admin/resources") {
        return request.method === "GET" ? adminResourcesPage(request, env) : methodNotAllowed();
      }
      if (path === "/admin/resources/save") {
        return request.method === "POST" ? saveResource(request, env) : methodNotAllowed();
      }
      if (path === "/admin/resources/delete") {
        return request.method === "POST" ? deleteResource(request, env) : methodNotAllowed();
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

function contactPage() {
  return htmlPage("Contact", `
    <section class="page-hero">
      <div class="container">
        <div class="eyebrow">Get in touch</div>
        <h1>Contact</h1>
        <p class="lead">Questions about starting judo, class times or the club? Send us a message or give us a call.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container contact-layout">
        <div class="contact-details">
          <div class="eyebrow">Old Priory Judo Club</div>
          <h2>We'd be happy to hear from you.</h2>
          <p class="lead">New starters are welcome from age 5, and the club offers three free trial sessions.</p>
          <div class="contact-card-stack">
            <article class="page-card contact-info-card">
              <span class="contact-icon">☎</span>
              <div><small>Telephone</small><strong><a href="tel:07730365056">07730 365056</a></strong></div>
            </article>
            <article class="page-card contact-info-card">
              <span class="contact-icon">🥋</span>
              <div><small>Training</small><strong>Friday & Saturday</strong><span>See the current class times on the home page.</span></div>
            </article>
            <article class="page-card contact-info-card">
              <span class="contact-icon">📍</span>
              <div><small>Location</small><strong>25 Mattison Way, Acomb, York YO24 4PD</strong><span>Old Priory Judo Club dojo.</span></div>
            </article>
            <article class="page-card contact-info-card">
              <span class="contact-icon">f</span>
              <div><small>Facebook</small><strong><a href="https://www.facebook.com/OldPrioryJudoClub" target="_blank" rel="noopener noreferrer">Old Priory Judo Club</a></strong><span>Follow the club for news, photos and updates.</span></div>
            </article>
            <div class="contact-map map-consent">
              <div class="map-placeholder">
                <strong>Google Map</strong>
                <span>The map is loaded only if you choose to view it. Loading it connects your browser to Google.</span>
                <button class="btn ghost load-map" type="button" data-map-src="https://www.google.com/maps?q=25+Mattison+Way,+Acomb,+York+YO24+4PD&output=embed">View map</button>
              </div>
            </div>
          </div>
        </div>
        <form class="page-card contact-form" method="post" action="/contact">
          <div class="eyebrow">Send an enquiry</div>
          <h2>Contact the club</h2>
          <p>This prototype demonstrates the enquiry form. Messages are not yet delivered to a mailbox.</p>
          <div class="form-pair">
            <label>Your name<input type="text" name="name" autocomplete="name" maxlength="100" required></label>
            <label>Email address<input type="email" name="email" autocomplete="email" maxlength="200" required></label>
          </div>
          <label>Telephone <span class="optional">(optional)</span><input type="tel" name="phone" autocomplete="tel" maxlength="40"></label>
          <label>What can we help with?
            <select name="subject" required>
              <option value="">Choose an option</option>
              <option>Free trial / new starter</option>
              <option>Class information</option>
              <option>Competition or grading</option>
              <option>Existing member enquiry</option>
              <option>General enquiry</option>
            </select>
          </label>
          <label>Message<textarea name="message" rows="7" maxlength="3000" required></textarea></label>
          <div class="contact-honeypot" aria-hidden="true">
            <label>Leave this field empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <div class="anti-spam-note"><strong>Spam protection</strong><span>Cloudflare Turnstile will be enabled before the form goes live.</span></div>
          <button class="btn red" type="submit">Send enquiry</button>
          <small class="form-footnote">Prototype only — submitting this form does not send an email.</small>
        </form>
      </div>
    </section>`);
}

async function handleContactPrototype(request) {
  if (!sameOrigin(request)) return forbidden();
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("subject") || "").trim();
  const message = String(form.get("message") || "").trim();
  const website = String(form.get("website") || "").trim();

  if (website) return redirect("/contact.html");
  if (!name || !isEmail(email) || !subject || !message || name.length > 100 || email.length > 200 || message.length > 3000) {
    return htmlPage("Contact form", `
      <section class="page-content"><div class="container auth-wrap">
        <div class="page-card auth-card">
          <div class="eyebrow">Contact</div>
          <h2>Check the form</h2>
          <p>Please provide your name, a valid email address, an enquiry type and a message.</p>
          <a class="btn ghost" href="/contact">Back to contact form</a>
        </div>
      </div></section>`, 400);
  }

  return htmlPage("Enquiry received", `
    <section class="page-content"><div class="container auth-wrap">
      <div class="page-card auth-card">
        <div class="eyebrow">Prototype contact form</div>
        <h2>Thanks, ${escapeHtml(name)}.</h2>
        <p>The form has been accepted successfully. During the prototype phase no email is sent and the enquiry is not stored.</p>
        <p>Once outbound mail is configured, this same form will deliver enquiries to the club mailbox after spam verification.</p>
        <a class="btn red" href="/">Back to home</a>
        <a class="btn ghost" href="/contact">Back to contact</a>
      </div>
    </div></section>`);
}

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
          <p class="auth-note">Forgotten your password? Contact a club administrator for a reset link.</p>
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

function memberToolbar(user, active) {
  return `
    <div class="member-toolbar" aria-label="Members area navigation">
      <div class="member-toolbar-links">
        <a class="${active === "home" ? "active" : ""}" href="/members">Member home</a>
        <a class="${active === "account" ? "active" : ""}" href="/members/account">Account settings</a>
        ${user.role === "admin" ? '<a href="/admin">Admin area</a>' : ""}
      </div>
      <form method="post" action="/auth/logout"><button type="submit">Sign out</button></form>
    </div>`;
}

async function membersPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/members");

  const resources = await env.APP_DB.prepare(
    "SELECT id,title,category,description,resource_type,url,file_name FROM resources WHERE active=1 ORDER BY category COLLATE NOCASE, sort_order, title COLLATE NOCASE"
  ).all();

  const rows = resources.results || [];
  const categories = new Map();
  for (const row of rows) {
    const category = String(row.category || "Other");
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(row);
  }

  const categoryCards = categories.size ? [...categories.entries()].map(([category, items]) => `
    <article class="page-card member-category-card">
      <div class="member-card-heading">
        <div><div class="eyebrow">Resources</div><h3>${escapeHtml(category)}</h3></div>
        <span class="member-count-badge">${items.length}</span>
      </div>
      <div class="member-card-items">
        ${items.map(item => {
          const description = item.description ? `<span>${escapeHtml(item.description)}</span>` : "";
          if (item.resource_type === "link" && item.url) {
            return `<a class="member-card-item" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
              <strong>${escapeHtml(item.title)}</strong>
              ${description}
              <small>External link →</small>
            </a>`;
          }
          return `<a class="member-card-item" href="/members/resource/${escapeHtml(item.id)}/download">
            <strong>${escapeHtml(item.title)}</strong>
            ${description}
            <small>Download${item.file_name ? " · " + escapeHtml(item.file_name) : ""} →</small>
          </a>`;
        }).join("")}
      </div>
    </article>`
  ).join("") : `
    <article class="page-card member-category-card member-empty-card">
      <div class="eyebrow">Resources</div>
      <h3>Club resources</h3>
      <p>No member resources have been published yet.</p>
    </article>`;

  return htmlPage("Members", `
    <section class="page-hero member-hero">
      <div class="container">
        <div class="eyebrow">Members area</div>
        <h1>Welcome, ${escapeHtml(user.display_name)}</h1>
        <p class="lead">Club resources, grading material and useful links.</p>
      </div>
    </section>
    <section class="page-content member-page-content">
      <div class="container">
        ${memberToolbar(user, "home")}
        <div class="member-section-heading">
          <div><div class="eyebrow">Member library</div><h2>Resources</h2></div>
          <p>${rows.length} published resource${rows.length === 1 ? "" : "s"} across ${categories.size} categor${categories.size === 1 ? "y" : "ies"}.</p>
        </div>
        <div class="member-resource-grid">
          ${categoryCards}
          <article class="page-card member-category-card member-account-card">
            <div class="eyebrow">Your account</div>
            <h3>${escapeHtml(user.display_name)}</h3>
            <p>${escapeHtml(user.email)}</p>
            <span class="status-badge">${escapeHtml(user.role)}</span>
            <a class="btn ghost" href="/members/account">Account settings</a>
          </article>
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

  const now = new Date().toISOString().slice(0, 10);
  const [eventCount, closureCount, memberCount, inviteCount, resourceCount] = await Promise.all([
    env.APP_DB.prepare("SELECT COUNT(*) AS count FROM events WHERE event_date >= ?").bind(now).first(),
    env.APP_DB.prepare("SELECT COUNT(*) AS count FROM closures WHERE closure_date >= ?").bind(now).first(),
    env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM users WHERE active=1").first(),
    env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM account_tokens WHERE type='invite' AND used_at IS NULL AND expires_at > ?").bind(new Date().toISOString()).first(),
    env.APP_DB.prepare("SELECT COUNT(*) AS count FROM resources WHERE active=1").first()
  ]);

  return htmlPage("Admin", `
    <section class="page-hero admin-hero">
      <div class="container">
        <div class="eyebrow">Administration</div>
        <h1>Club admin</h1>
        <p class="lead">Welcome back, ${escapeHtml(user.display_name)}.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container">
        <div class="admin-dashboard-grid">
          <a class="admin-dashboard-card" href="/admin/calendar">
            <div class="admin-card-icon">📅</div>
            <div class="eyebrow">Calendar</div>
            <h2>Events & closures</h2>
            <p>Manage competitions, gradings, club activities and dates when training is not running.</p>
            <div class="admin-card-stats"><strong>${Number(eventCount?.count || 0)}</strong> upcoming events · <strong>${Number(closureCount?.count || 0)}</strong> closures</div>
            <span class="admin-card-link">Manage calendar →</span>
          </a>

          <a class="admin-dashboard-card" href="/admin/members">
            <div class="admin-card-icon">👥</div>
            <div class="eyebrow">Access</div>
            <h2>Members</h2>
            <p>Invite members, manage account access, revoke sessions and issue password reset links.</p>
            <div class="admin-card-stats"><strong>${Number(memberCount?.count || 0)}</strong> active accounts · <strong>${Number(inviteCount?.count || 0)}</strong> pending invites</div>
            <span class="admin-card-link">Manage members →</span>
          </a>

          <a class="admin-dashboard-card" href="/admin/resources">
            <div class="admin-card-icon">📚</div>
            <div class="eyebrow">Members area</div>
            <h2>Resources</h2>
            <p>Manage member-only syllabuses, club documents, useful links and future downloads.</p>
            <div class="admin-card-stats"><strong>${Number(resourceCount?.count || 0)}</strong> published resources</div>
            <span class="admin-card-link">Manage resources →</span>
          </a>
        </div>

        <div class="member-actions admin-dashboard-actions">
          <a class="btn ghost" href="/members">Members area</a>
          <a class="btn ghost" href="/events.html">View public calendar</a>
          <form method="post" action="/auth/logout"><button class="btn ghost" type="submit">Sign out</button></form>
        </div>
      </div>
    </section>`);
}

async function adminCalendarPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/admin");
  if (user.role !== "admin") return forbidden();

  const events = await env.APP_DB.prepare(
    "SELECT id, event_date, title, location, description, featured FROM events ORDER BY event_date, id"
  ).all();
  const closures = await env.APP_DB.prepare(
    "SELECT id, closure_date, title, description FROM closures ORDER BY closure_date, id"
  ).all();

  const eventRows = (events.results || []).map(row => `
    <details class="admin-list-item">
      <summary>
        <div class="admin-list-date">${escapeHtml(formatShortDate(row.event_date))}</div>
        <div class="admin-list-main"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.location || "No location")}</span></div>
        ${Number(row.featured) === 1 ? '<span class="status-badge pending">Featured</span>' : ""}
        <span class="admin-edit-label">Edit</span>
      </summary>
      <form class="admin-edit-form" method="post" action="/admin/calendar/event">
        <input type="hidden" name="id" value="${escapeHtml(row.id)}">
        <label>Date<input type="date" name="date" value="${escapeHtml(row.event_date)}" required></label>
        <label>Title<input type="text" name="title" value="${escapeHtml(row.title)}" required></label>
        <label>Location<input type="text" name="location" value="${escapeHtml(row.location || "")}"></label>
        <label class="admin-form-wide">Description<textarea name="description" rows="3">${escapeHtml(row.description || "")}</textarea></label>
        <label class="check-label"><input type="checkbox" name="featured" value="1" ${Number(row.featured) === 1 ? "checked" : ""}> Featured</label>
        <div class="admin-row-actions">
          <button class="btn red" type="submit">Save changes</button>
          <button class="btn danger" type="submit" formaction="/admin/calendar/delete" name="delete_ref" value="event:${escapeHtml(row.id)}">Delete</button>
        </div>
      </form>
    </details>`).join("");

  const closureRows = (closures.results || []).map(row => `
    <details class="admin-list-item closure-item">
      <summary>
        <div class="admin-list-date">${escapeHtml(formatShortDate(row.closure_date))}</div>
        <div class="admin-list-main"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.description || "No regular training")}</span></div>
        <span class="admin-edit-label">Edit</span>
      </summary>
      <form class="admin-edit-form" method="post" action="/admin/calendar/closure">
        <input type="hidden" name="id" value="${escapeHtml(row.id)}">
        <label>Date<input type="date" name="date" value="${escapeHtml(row.closure_date)}" required></label>
        <label>Title<input type="text" name="title" value="${escapeHtml(row.title)}" required></label>
        <label class="admin-form-wide">Description<textarea name="description" rows="3">${escapeHtml(row.description || "")}</textarea></label>
        <div class="admin-row-actions">
          <button class="btn red" type="submit">Save changes</button>
          <button class="btn danger" type="submit" formaction="/admin/calendar/delete" name="delete_ref" value="closure:${escapeHtml(row.id)}">Delete</button>
        </div>
      </form>
    </details>`).join("");

  const isEmpty = !(events.results || []).length && !(closures.results || []).length;

  return htmlPage("Calendar management", `
    <section class="page-hero admin-hero">
      <div class="container">
        <div class="eyebrow">Administration · Calendar</div>
        <h1>Events & closures</h1>
        <p class="lead">Manage the dates shown on the public club calendar.</p>
      </div>
    </section>
    <section class="page-content">
      <div class="container">
        <div class="admin-heading">
          <div><div class="eyebrow">Calendar</div><h2>Manage dates</h2></div>
          <div class="admin-heading-actions">
            <a class="btn ghost" href="/admin">Admin home</a>
            <a class="btn ghost" href="/events.html">View public calendar</a>
          </div>
        </div>

        ${isEmpty ? `
          <div class="page-card import-card">
            <h3>Import the existing calendar</h3>
            <p>The application database is empty. Import the current events and closure dates from the existing site data.</p>
            <form method="post" action="/admin/calendar/import"><button class="btn red" type="submit">Import existing calendar</button></form>
          </div>` : ""}

        <section class="admin-management-section">
          <div class="admin-section-title"><div><div class="eyebrow">Upcoming</div><h2>Events</h2></div></div>
          <details class="admin-add-panel">
            <summary class="btn red">Add event</summary>
            <form class="admin-edit-form add-form" method="post" action="/admin/calendar/event">
              <label>Date<input type="date" name="date" required></label>
              <label>Title<input type="text" name="title" required></label>
              <label>Location<input type="text" name="location"></label>
              <label class="admin-form-wide">Description<textarea name="description" rows="3"></textarea></label>
              <label class="check-label"><input type="checkbox" name="featured" value="1"> Featured</label>
              <div class="admin-row-actions"><button class="btn red" type="submit">Create event</button></div>
            </form>
          </details>
          <div class="admin-simple-list">${eventRows || '<div class="empty-state">No events in the database yet.</div>'}</div>
        </section>

        <section class="admin-management-section">
          <div class="admin-section-title"><div><div class="eyebrow">No training</div><h2>Closures</h2></div></div>
          <details class="admin-add-panel">
            <summary class="btn red">Add closure</summary>
            <form class="admin-edit-form add-form" method="post" action="/admin/calendar/closure">
              <label>Date<input type="date" name="date" required></label>
              <label>Title<input type="text" name="title" value="Club closed" required></label>
              <label class="admin-form-wide">Description<textarea name="description" rows="3"></textarea></label>
              <div class="admin-row-actions"><button class="btn red" type="submit">Create closure</button></div>
            </form>
          </details>
          <div class="admin-simple-list">${closureRows || '<div class="empty-state">No closures in the database yet.</div>'}</div>
        </section>
      </div>
    </section>`);
}


async function accountPage(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/members/account");

  return htmlPage("Account settings", `
    <section class="page-hero member-hero">
      <div class="container">
        <div class="eyebrow">Members area</div>
        <h1>Account settings</h1>
        <p class="lead">Manage your member sign-in details.</p>
      </div>
    </section>
    <section class="page-content member-page-content">
      <div class="container">
        ${memberToolbar(user, "account")}
        <div class="member-account-layout">
          <aside class="page-card account-summary-card">
            <div class="eyebrow">Signed in as</div>
            <h2>${escapeHtml(user.display_name)}</h2>
            <p>${escapeHtml(user.email)}</p>
            <span class="status-badge">${escapeHtml(user.role)}</span>
            <small>Changing your password signs you out of all active sessions.</small>
          </aside>
          <form class="page-card auth-card member-password-card" method="post" action="/members/account">
            <div class="eyebrow">Security</div>
            <h2>Change password</h2>
            <label>Current password<input type="password" name="current_password" autocomplete="current-password" required></label>
            <label>New password<input type="password" name="new_password" autocomplete="new-password" minlength="12" required></label>
            <label>Confirm new password<input type="password" name="confirm_password" autocomplete="new-password" minlength="12" required></label>
            <small class="auth-note">Use at least 12 characters.</small>
            <button class="btn red" type="submit">Change password</button>
          </form>
        </div>
      </div>
    </section>`);
}
async function handleChangePassword(request, env) {
  if (!sameOrigin(request)) return forbidden();
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=/members");
  const form = await request.formData();
  const currentPassword = String(form.get("current_password") || "");
  const newPassword = String(form.get("new_password") || "");
  const confirmPassword = String(form.get("confirm_password") || "");
  const row = await env.AUTH_DB.prepare("SELECT password_hash FROM users WHERE id=? AND active=1").bind(user.id).first();
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) return accountMessage("Password not changed", "The current password was not recognised.", 400);
  if (newPassword.length < 12 || newPassword !== confirmPassword) return accountMessage("Password not changed", "The new passwords must match and be at least 12 characters.", 400);
  const hash = await hashPassword(newPassword);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare("UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(hash, user.id),
    env.AUTH_DB.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(user.id)
  ]);
  return redirect("/members/login", {"Set-Cookie": SESSION_COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"});
}

function accountMessage(title, message, status) {
  return htmlPage(title, '<section class="page-content"><div class="container auth-wrap"><div class="page-card auth-card"><div class="eyebrow">Account</div><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(message) + '</p><a class="btn ghost" href="/members/account">Back to account settings</a></div></div></section>', status || 200);
}

async function adminResourcesPage(request, env) {
  const admin = await getCurrentUser(request, env);
  if (!admin) return redirect("/members/login?next=/admin");
  if (admin.role !== "admin") return forbidden();

  const [result, storage] = await Promise.all([
    env.APP_DB.prepare(
      "SELECT id,title,category,description,resource_type,url,file_key,file_name,mime_type,file_size,active,sort_order FROM resources ORDER BY category COLLATE NOCASE, sort_order, title COLLATE NOCASE"
    ).all(),
    env.APP_DB.prepare("SELECT COALESCE(SUM(file_size),0) AS bytes FROM resources WHERE resource_type='file'").first()
  ]);

  const usedBytes = Number(storage?.bytes || 0);
  const storageLimit = Number(env.RESOURCE_STORAGE_LIMIT_BYTES || 0);
  const fileLimit = Number(env.RESOURCE_FILE_LIMIT_BYTES || 0);

  const rows = (result.results || []).map(row => {
    const existingFile = row.resource_type === "file" && row.file_key
      ? `<div class="resource-current-file"><strong>Current file</strong><span>${escapeHtml(row.file_name || "Resource file")} · ${formatBytes(row.file_size || 0)}</span></div>`
      : "";
    return `
    <details class="admin-list-item">
      <summary>
        <div class="admin-list-main"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.category)} · ${escapeHtml(row.resource_type)}${row.resource_type === "file" && row.file_size ? " · " + escapeHtml(formatBytes(row.file_size)) : ""}</span></div>
        <span class="status-badge ${Number(row.active) === 1 ? "active" : "inactive"}">${Number(row.active) === 1 ? "Published" : "Hidden"}</span>
        <span class="admin-edit-label">Edit</span>
      </summary>
      <form class="admin-edit-form resource-edit-form" method="post" action="/admin/resources/save" enctype="multipart/form-data">
        <input type="hidden" name="id" value="${escapeHtml(row.id)}">
        <label>Title<input type="text" name="title" maxlength="200" value="${escapeHtml(row.title)}" required></label>
        <label>Category<input type="text" name="category" maxlength="100" value="${escapeHtml(row.category)}" required></label>
        <label>Type<select name="resource_type"><option value="link" ${row.resource_type === "link" ? "selected" : ""}>External link</option><option value="file" ${row.resource_type === "file" ? "selected" : ""}>File</option></select></label>
        <label class="admin-form-wide">Description<textarea name="description" rows="3" maxlength="1000">${escapeHtml(row.description || "")}</textarea></label>
        <label class="admin-form-wide">URL<input type="url" name="url" value="${escapeHtml(row.url || "")}" placeholder="https://..."></label>
        <label class="admin-form-wide">File${existingFile}<input type="file" name="resource_file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"><small>Leave empty to keep the current file. Maximum ${formatBytes(fileLimit)}.</small></label>
        <label>Sort order<input type="number" name="sort_order" value="${escapeHtml(row.sort_order || 0)}"></label>
        <label class="check-label"><input type="checkbox" name="active" value="1" ${Number(row.active) === 1 ? "checked" : ""}> Published</label>
        <div class="admin-row-actions">
          <button class="btn red" type="submit">Save</button>
          <button class="btn danger" type="submit" formaction="/admin/resources/delete" name="id" value="${escapeHtml(row.id)}" onclick="return confirm('Delete this resource?')">Delete</button>
        </div>
      </form>
    </details>`;
  }).join("");

  return htmlPage("Resources", `
    <section class="page-hero"><div class="container"><div class="eyebrow">Administration</div><h1>Resources</h1><p class="lead">Publish member-only links and protected club files.</p></div></section>
    <section class="page-content"><div class="container">
      <div class="admin-heading"><div><div class="eyebrow">Member resources</div><h2>Manage resources</h2></div><a class="btn ghost" href="/admin">Back to admin</a></div>
      <div class="page-card resource-storage-summary">
        <div><strong>Resources storage: ${formatBytes(usedBytes)} of ${formatBytes(storageLimit)}</strong><span>${formatBytes(fileLimit)} maximum per file</span></div>
        <div class="resource-storage-track" aria-hidden="true"><span style="width:${storageLimit > 0 ? Math.min(100, (usedBytes / storageLimit) * 100) : 0}%"></span></div>
      </div>
      <details class="admin-add-panel">
        <summary class="btn red">Add resource</summary>
        <form class="admin-edit-form add-form resource-edit-form" method="post" action="/admin/resources/save" enctype="multipart/form-data">
          <label>Title<input type="text" name="title" maxlength="200" required></label>
          <label>Category<input type="text" name="category" maxlength="100" placeholder="e.g. Grading" required></label>
          <label>Type<select name="resource_type"><option value="link" selected>External link</option><option value="file">File</option></select></label>
          <label class="admin-form-wide">Description<textarea name="description" rows="3" maxlength="1000"></textarea></label>
          <label class="admin-form-wide">URL<input type="url" name="url" placeholder="https://..."></label>
          <label class="admin-form-wide">File<input type="file" name="resource_file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"><small>Required when creating a file resource. Maximum ${formatBytes(fileLimit)}.</small></label>
          <label>Sort order<input type="number" name="sort_order" value="0"></label>
          <label class="check-label"><input type="checkbox" name="active" value="1" checked> Published</label>
          <div class="admin-row-actions"><button class="btn red" type="submit">Add resource</button></div>
        </form>
      </details>
      <div class="admin-simple-list">${rows || '<div class="empty-state">No resources yet.</div>'}</div>
    </div></section>`);
}

async function saveResource(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();
  const form = await request.formData();
  const id = positiveInt(form.get("id"));
  const title = String(form.get("title") || "").trim();
  const category = String(form.get("category") || "").trim();
  const description = String(form.get("description") || "").trim();
  const resourceType = String(form.get("resource_type") || "link");
  const url = String(form.get("url") || "").trim();
  const active = form.get("active") === "1" ? 1 : 0;
  const sortOrderRaw = Number(form.get("sort_order") || 0);
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.trunc(sortOrderRaw) : 0;
  const upload = form.get("resource_file");
  const hasUpload = upload && typeof upload === "object" && typeof upload.arrayBuffer === "function" && Number(upload.size || 0) > 0;

  if (!title || !category || !["link","file"].includes(resourceType)) {
    return badRequest("Title, category and a valid resource type are required.");
  }
  if (resourceType === "link" && !/^https?:\/\//i.test(url)) {
    return badRequest("External links must use an http or https URL.");
  }

  const existing = id
    ? await env.APP_DB.prepare("SELECT id,resource_type,file_key,file_name,mime_type,file_size FROM resources WHERE id=? LIMIT 1").bind(id).first()
    : null;
  if (id && !existing) return badRequest("Resource not found.");

  let newKey = existing?.file_key || null;
  let newFileName = existing?.file_name || null;
  let newMimeType = existing?.mime_type || null;
  let newFileSize = Number(existing?.file_size || 0);
  let uploadedNewObject = false;

  if (resourceType === "file") {
    if (!hasUpload && !existing?.file_key) return badRequest("Choose a file to upload.");

    if (hasUpload) {
      const fileLimit = Number(env.RESOURCE_FILE_LIMIT_BYTES || 0);
      const storageLimit = Number(env.RESOURCE_STORAGE_LIMIT_BYTES || 0);
      const fileSize = Number(upload.size || 0);
      if (!fileSize || fileSize > fileLimit) return badRequest("The selected file exceeds the permitted file size.");

      const safeName = safeResourceFileName(upload.name);
      const mimeType = String(upload.type || "").toLowerCase() || "application/octet-stream";
      if (!allowedResourceFile(safeName, mimeType)) return badRequest("That file type is not permitted.");

      const storage = await env.APP_DB.prepare(
        "SELECT COALESCE(SUM(file_size),0) AS bytes FROM resources WHERE resource_type='file'"
      ).first();
      const currentTotal = Number(storage?.bytes || 0);
      const replacingSize = existing?.resource_type === "file" ? Number(existing?.file_size || 0) : 0;
      const projectedTotal = currentTotal - replacingSize + fileSize;
      if (storageLimit > 0 && projectedTotal > storageLimit) {
        return badRequest("Uploading this file would exceed the Resources storage quota.");
      }

      newKey = "resources/" + crypto.randomUUID() + resourceFileExtension(safeName);
      newFileName = safeName;
      newMimeType = mimeType;
      newFileSize = fileSize;

      await env.Resources.put(newKey, upload.stream(), {
        httpMetadata: { contentType: mimeType },
        customMetadata: { originalName: safeName }
      });
      uploadedNewObject = true;
    }
  } else {
    newKey = null;
    newFileName = null;
    newMimeType = null;
    newFileSize = 0;
  }

  try {
    if (id) {
      await env.APP_DB.prepare(
        "UPDATE resources SET title=?,category=?,description=?,resource_type=?,url=?,file_key=?,file_name=?,mime_type=?,file_size=?,active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(title, category, description || null, resourceType, resourceType === "link" ? url : null, newKey, newFileName, newMimeType, newFileSize, active, sortOrder, id).run();
    } else {
      await env.APP_DB.prepare(
        "INSERT INTO resources (title,category,description,resource_type,url,file_key,file_name,mime_type,file_size,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(title, category, description || null, resourceType, resourceType === "link" ? url : null, newKey, newFileName, newMimeType, newFileSize, active, sortOrder).run();
    }
  } catch (error) {
    if (uploadedNewObject && newKey) {
      try { await env.Resources.delete(newKey); } catch (_) {}
    }
    throw error;
  }

  if (existing?.file_key && existing.file_key !== newKey) {
    try { await env.Resources.delete(existing.file_key); } catch (error) { console.error("Failed to delete replaced resource object", error); }
  }

  return redirect("/admin/resources");
}

async function deleteResource(request, env) {
  if (!(await requireAdmin(request, env))) return forbidden();
  const form = await request.formData();
  const id = positiveInt(form.get("id"));
  if (!id) return badRequest("Invalid resource.");

  const existing = await env.APP_DB.prepare("SELECT file_key FROM resources WHERE id=? LIMIT 1").bind(id).first();
  await env.APP_DB.prepare("DELETE FROM resources WHERE id=?").bind(id).run();

  if (existing?.file_key) {
    try { await env.Resources.delete(existing.file_key); } catch (error) { console.error("Failed to delete resource object", error); }
  }
  return redirect("/admin/resources");
}

async function downloadMemberResource(request, env, id) {
  const user = await getCurrentUser(request, env);
  if (!user) return redirect("/members/login?next=" + encodeURIComponent("/members/resource/" + id + "/download"));

  const resource = await env.APP_DB.prepare(
    "SELECT file_key,file_name,mime_type FROM resources WHERE id=? AND active=1 AND resource_type='file' LIMIT 1"
  ).bind(id).first();
  if (!resource?.file_key) return new Response("Resource not found.", { status: 404 });

  const object = await env.Resources.get(resource.file_key);
  if (!object) return new Response("Resource file not found.", { status: 404 });

  const fileName = safeResourceFileName(resource.file_name || "resource");
  const headers = new Headers();
  headers.set("Content-Type", resource.mime_type || object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Disposition", "attachment; filename*=UTF-8''" + encodeURIComponent(fileName));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.size != null) headers.set("Content-Length", String(object.size));
  return new Response(object.body, { headers });
}

function safeResourceFileName(name) {
  const cleaned = String(name || "resource")
    .replace(/[\\/\0\r\n]/g, "_")
    .replace(/[<>:"|?*]/g, "_")
    .trim();
  return (cleaned || "resource").slice(0, 180);
}

function resourceFileExtension(name) {
  const match = String(name || "").toLowerCase().match(/(\.[a-z0-9]{1,8})$/);
  return match ? match[1] : "";
}

function allowedResourceFile(name, mimeType) {
  const ext = resourceFileExtension(name);
  const allowedExtensions = new Set([
    ".pdf",".doc",".docx",".xls",".xlsx",".ppt",".pptx",".txt",".csv",
    ".jpg",".jpeg",".png",".webp",".zip"
  ]);
  if (!allowedExtensions.has(ext)) return false;

  const blockedMime = new Set([
    "text/html","application/javascript","text/javascript",
    "application/x-msdownload","application/x-msdos-program"
  ]);
  return !blockedMime.has(String(mimeType || "").toLowerCase());
}

async function adminMembersPage(request, env) {
  const admin = await getCurrentUser(request, env);
  if (!admin) return redirect("/members/login?next=/admin");
  if (admin.role !== "admin") return forbidden();
  const users = await env.AUTH_DB.prepare("SELECT id,email,display_name,role,active,created_at FROM users ORDER BY display_name COLLATE NOCASE,email").all();
  const invites = await env.AUTH_DB.prepare("SELECT id,email,display_name,role,expires_at FROM account_tokens WHERE type='invite' AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC").bind(new Date().toISOString()).all();

  const userRows = (users.results || []).map(function(row) {
    const status = Number(row.active) === 1 ? "Active" : "Disabled";
    const toggle = Number(row.id) === Number(admin.id) ? "" :
      '<form method="post" action="/admin/members/status"><input type="hidden" name="user_id" value="' + escapeHtml(row.id) + '"><input type="hidden" name="active" value="' + (Number(row.active) === 1 ? "0" : "1") + '"><button class="btn ' + (Number(row.active) === 1 ? "danger" : "ghost") + '" type="submit">' + (Number(row.active) === 1 ? "Disable" : "Enable") + '</button></form>';
    return '<article class="member-admin-row"><div><strong>' + escapeHtml(row.display_name) + '</strong><span>' + escapeHtml(row.email) + '</span></div>' +
      '<div class="member-badges"><span class="status-badge">' + escapeHtml(row.role) + '</span><span class="status-badge ' + status.toLowerCase() + '">' + status + '</span></div>' +
      '<div class="member-admin-actions"><form method="post" action="/admin/members/reset"><input type="hidden" name="user_id" value="' + escapeHtml(row.id) + '"><button class="btn ghost" type="submit">Reset link</button></form>' +
      '<form method="post" action="/admin/members/revoke"><input type="hidden" name="user_id" value="' + escapeHtml(row.id) + '"><button class="btn ghost" type="submit">Revoke sessions</button></form>' + toggle + '</div></article>';
  }).join("");

  const inviteRows = (invites.results || []).map(function(row) {
    return '<article class="member-admin-row pending"><div><strong>' + escapeHtml(row.display_name || "Pending member") + '</strong><span>' + escapeHtml(row.email || "") + '</span></div>' +
      '<div class="member-badges"><span class="status-badge pending">Invited</span></div><div class="member-admin-meta">Expires ' + escapeHtml(formatDateTime(row.expires_at)) + '</div></article>';
  }).join("");

  return htmlPage("Member access",
    '<section class="page-hero"><div class="container"><div class="eyebrow">Administration</div><h1>Member access</h1><p class="lead">Invite members, manage access and issue password-reset links.</p></div></section>' +
    '<section class="page-content"><div class="container"><div class="admin-heading"><div><div class="eyebrow">Invite only</div><h2>Invite a member</h2></div><a class="btn ghost" href="/admin">Back to admin</a></div>' +
    '<form class="page-card member-invite-form" method="post" action="/admin/members/invite"><label>Name<input type="text" name="display_name" required></label><label>Email address<input type="email" name="email" required></label><label>Role<select name="role"><option value="member" selected>Member</option><option value="admin">Administrator</option></select></label><div><button class="btn red" type="submit">Create invite</button></div></form>' +
    '<section class="admin-calendar-section"><h3>Members</h3><div class="member-admin-list">' + (userRows || '<div class="empty-state">No member accounts yet.</div>') + '</div></section>' +
    '<section class="admin-calendar-section"><h3>Pending invitations</h3><div class="member-admin-list">' + (inviteRows || '<div class="empty-state">No pending invitations.</div>') + '</div></section></div></section>');
}

async function createMemberInvite(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return forbidden();
  const form = await request.formData();
  const displayName = String(form.get("display_name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const role = String(form.get("role") || "member");
  if (!displayName || !isEmail(email) || !["member","admin"].includes(role)) return badRequest("A valid name, email address and role are required.");
  const existing = await env.AUTH_DB.prepare("SELECT id FROM users WHERE email=? COLLATE NOCASE LIMIT 1").bind(email).first();
  if (existing) return badRequest("An account already exists for that email address.");
  await env.AUTH_DB.prepare("UPDATE account_tokens SET used_at=CURRENT_TIMESTAMP WHERE type='invite' AND email=? COLLATE NOCASE AND used_at IS NULL").bind(email).run();
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString();
  await env.AUTH_DB.prepare("INSERT INTO account_tokens (id,token_hash,type,email,display_name,role,created_by,expires_at) VALUES (?,?,'invite',?,?,?,?,?)").bind(crypto.randomUUID(), tokenHash, email, displayName, role, admin.id, expires).run();
  const link = new URL("/join", request.url); link.searchParams.set("token", token);
  return linkPage("Member invitation created", "Send this single-use invitation link to the member. It expires in 7 days.", link.toString(), "/admin/members");
}

async function joinPage(request, env) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invite = await lookupAccountToken(env, token, "invite");
  if (!invite) return tokenInvalidPage("Invitation unavailable", "This invitation is invalid, expired or has already been used.");
  return htmlPage("Join OPJC members",
    '<section class="page-hero"><div class="container"><div class="eyebrow">Members area</div><h1>Set up your account</h1><p class="lead">You have been invited to the Old Priory Judo Club members area.</p></div></section>' +
    '<section class="page-content"><div class="container auth-wrap"><form class="page-card auth-card" method="post" action="/join"><input type="hidden" name="token" value="' + escapeHtml(token) + '">' +
    '<label>Name<input type="text" value="' + escapeHtml(invite.display_name || "") + '" disabled></label><label>Email address<input type="email" value="' + escapeHtml(invite.email || "") + '" disabled></label>' +
    '<label>Password<input type="password" name="password" autocomplete="new-password" minlength="12" required></label><label>Confirm password<input type="password" name="confirm_password" autocomplete="new-password" minlength="12" required></label><button class="btn red" type="submit">Create account</button></form></div></section>');
}

async function handleJoin(request, env) {
  if (!sameOrigin(request)) return forbidden();
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const confirmPassword = String(form.get("confirm_password") || "");
  const invite = await lookupAccountToken(env, token, "invite");
  if (!invite) return tokenInvalidPage("Invitation unavailable", "This invitation is invalid, expired or has already been used.");
  if (password.length < 12 || password !== confirmPassword) return tokenInvalidPage("Account not created", "The passwords must match and be at least 12 characters.");
  const existing = await env.AUTH_DB.prepare("SELECT id FROM users WHERE email=? COLLATE NOCASE LIMIT 1").bind(invite.email).first();
  if (existing) return tokenInvalidPage("Account not created", "An account already exists for this email address.");
  const passwordHash = await hashPassword(password);
  await env.AUTH_DB.prepare("INSERT INTO users (email,display_name,password_hash,role,active) VALUES (?,?,?,?,1)").bind(invite.email, invite.display_name, passwordHash, invite.role || "member").run();
  await env.AUTH_DB.prepare("UPDATE account_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=? AND used_at IS NULL").bind(invite.id).run();
  return htmlPage("Account created", '<section class="page-content"><div class="container auth-wrap"><div class="page-card auth-card"><div class="eyebrow">Members area</div><h2>Account created</h2><p>Your account is ready. You can now sign in.</p><a class="btn red" href="/members/login">Sign in</a></div></div></section>');
}

async function createPasswordReset(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return forbidden();
  const form = await request.formData();
  const userId = positiveInt(form.get("user_id"));
  if (!userId) return badRequest("Invalid user.");
  const user = await env.AUTH_DB.prepare("SELECT id,email,display_name FROM users WHERE id=? LIMIT 1").bind(userId).first();
  if (!user) return badRequest("User not found.");
  await env.AUTH_DB.prepare("UPDATE account_tokens SET used_at=CURRENT_TIMESTAMP WHERE type='reset' AND user_id=? AND used_at IS NULL").bind(user.id).run();
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + RESET_MINUTES * 60000).toISOString();
  await env.AUTH_DB.prepare("INSERT INTO account_tokens (id,token_hash,type,email,display_name,user_id,created_by,expires_at) VALUES (?,?,'reset',?,?,?,?,?)").bind(crypto.randomUUID(), tokenHash, user.email, user.display_name, user.id, admin.id, expires).run();
  const link = new URL("/reset-password", request.url); link.searchParams.set("token", token);
  return linkPage("Password reset link created", "Send this single-use link to the member. It expires in 60 minutes.", link.toString(), "/admin/members");
}

async function passwordResetPage(request, env) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const reset = await lookupAccountToken(env, token, "reset");
  if (!reset) return tokenInvalidPage("Reset unavailable", "This reset link is invalid, expired or has already been used.");
  return htmlPage("Reset password", '<section class="page-hero"><div class="container"><div class="eyebrow">Members area</div><h1>Reset password</h1><p class="lead">Set a new password for ' + escapeHtml(reset.email || "your account") + '.</p></div></section><section class="page-content"><div class="container auth-wrap"><form class="page-card auth-card" method="post" action="/reset-password"><input type="hidden" name="token" value="' + escapeHtml(token) + '"><label>New password<input type="password" name="password" minlength="12" required></label><label>Confirm password<input type="password" name="confirm_password" minlength="12" required></label><button class="btn red" type="submit">Set new password</button></form></div></section>');
}

async function handlePasswordReset(request, env) {
  if (!sameOrigin(request)) return forbidden();
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  const confirmPassword = String(form.get("confirm_password") || "");
  const reset = await lookupAccountToken(env, token, "reset");
  if (!reset || !reset.user_id) return tokenInvalidPage("Reset unavailable", "This reset link is invalid, expired or has already been used.");
  if (password.length < 12 || password !== confirmPassword) return tokenInvalidPage("Password not changed", "The passwords must match and be at least 12 characters.");
  const hash = await hashPassword(password);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(hash, reset.user_id),
    env.AUTH_DB.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(reset.user_id),
    env.AUTH_DB.prepare("UPDATE account_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=? AND used_at IS NULL").bind(reset.id)
  ]);
  return htmlPage("Password changed", '<section class="page-content"><div class="container auth-wrap"><div class="page-card auth-card"><div class="eyebrow">Members area</div><h2>Password changed</h2><p>Your existing sessions have been signed out. You can now sign in with the new password.</p><a class="btn red" href="/members/login">Sign in</a></div></div></section>');
}

async function changeMemberStatus(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return forbidden();
  const form = await request.formData();
  const userId = positiveInt(form.get("user_id"));
  const active = String(form.get("active")) === "1" ? 1 : 0;
  if (!userId || Number(userId) === Number(admin.id)) return badRequest("You cannot disable your own account.");
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare("UPDATE users SET active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(active, userId),
    env.AUTH_DB.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(userId)
  ]);
  return redirect("/admin/members");
}

async function revokeMemberSessions(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return forbidden();
  const form = await request.formData();
  const userId = positiveInt(form.get("user_id"));
  if (!userId) return badRequest("Invalid user.");
  await env.AUTH_DB.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(userId).run();
  return redirect("/admin/members");
}

async function lookupAccountToken(env, token, type) {
  if (!token) return null;
  const hash = await sha256Hex(token);
  return env.AUTH_DB.prepare("SELECT id,type,email,display_name,user_id,role,expires_at FROM account_tokens WHERE token_hash=? AND type=? AND used_at IS NULL AND expires_at>? LIMIT 1").bind(hash, type, new Date().toISOString()).first();
}

function tokenInvalidPage(title, message) {
  return htmlPage(title, '<section class="page-content"><div class="container auth-wrap"><div class="page-card auth-card"><div class="eyebrow">Members area</div><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(message) + '</p><a class="btn ghost" href="/">Back to home</a></div></div></section>', 400);
}

function linkPage(title, message, link, back) {
  return htmlPage(title, '<section class="page-content"><div class="container auth-wrap"><div class="page-card auth-card"><div class="eyebrow">Administration</div><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(message) + '</p><label>Link<input class="copy-link" type="text" readonly value="' + escapeHtml(link) + '"></label><button class="btn red copy-link-button" type="button">Copy link</button><a class="btn ghost" href="' + escapeHtml(back) + '">Back to member access</a></div></div></section>');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("en-GB", {day:"2-digit", month:"short", year:"numeric", timeZone:"UTC"}).format(new Date(value + "T00:00:00Z"));
  } catch {
    return String(value || "");
  }
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("en-GB", {dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"}).format(new Date(value));
  } catch {
    return String(value || "");
  }
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
  return redirect("/admin/calendar");
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
  return redirect("/admin/calendar");
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
  return redirect("/admin/calendar");
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
  return redirect("/admin/calendar");
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value >= 1073741824) return (value / 1073741824).toFixed(value >= 10737418240 ? 0 : 1).replace(/\.0$/, "") + " GB";
  if (value >= 1048576) return (value / 1048576).toFixed(value >= 104857600 ? 0 : 1).replace(/\.0$/, "") + " MB";
  if (value >= 1024) return (value / 1024).toFixed(1).replace(/\.0$/, "") + " KB";
  return Math.round(value) + " B";
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
      <div class="links"><a class="nav-link" href="/">Home</a><a class="nav-link" href="/events.html">Events</a><a class="nav-link" href="/history.html">History</a><a class="nav-link" href="/instructors.html">Instructors</a><a class="nav-link" href="/contact">Contact</a><a class="btn ghost" href="/members">Members</a></div>
    </div>
  </nav>
  <main>${content}</main>
  <footer>
    <div class="container foot foot-expanded">
      <div class="foot-brand"><strong>Old Priory Judo Club · York</strong><small>Affiliated with Bushido ZaZen International</small></div>
      <nav class="foot-links" aria-label="Policies"><a href="/policies.html#safeguarding">Safeguarding</a><a href="/policies.html#privacy">Privacy</a><a href="/policies.html#cookies">Cookies</a><a href="/policies.html#accessibility">Accessibility</a><a href="/policies.html#complaints">Complaints</a></nav>
      <small class="foot-copy">© 2026 Old Priory Judo Club. All rights reserved.</small>
    </div>
  </footer>
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
