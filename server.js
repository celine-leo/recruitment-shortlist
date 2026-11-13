// Local server for the interview shortlist.
// Run:  node server.js   then open http://localhost:3000
// Saves state to data/state.json; stores each imported CSV in uploads/<YYYY-MM-DD_HHMM>/.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const EXPORTS_DIR = path.join(ROOT, "exports");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const PORT = process.env.PORT || 3000;
const MAX_BODY = 5 * 1024 * 1024;

// Dates used to work out the year of a sign-up timeslot when no schedule has been saved yet.
// Keep in step with DEFAULT_SCHEDULE.dates in shortlist.html.
const DEFAULT_DATES = ["2026-11-10", "2026-11-12", "2026-11-13"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function scheduleDates() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    const d = s.settings && s.settings.schedule && s.settings.schedule.dates;
    if (Array.isArray(d) && d.length) return d.map(x => x.d).filter(Boolean);
  } catch (e) { /* no saved state yet */ }
  return DEFAULT_DATES;
}

function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f); f = ""; rows.push(row); row = [];
    } else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

function slotKey(s, dates) {
  // "Thu, 12 Nov, 10:00am–11:00am" or "2026-11-12 10:00" -> "2026-11-12|10:00" (date + start time).
  // A timeslot with no year takes the year of the schedule date with the same day and month.
  const p2 = x => String(x).padStart(2, "0");
  let md = null, year = null, rest = s;
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) { year = m[1]; md = p2(m[2]) + "-" + p2(m[3]); rest = s.slice(m.index + m[0].length); }
  else {
    m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?(?:\s+(\d{4}))?/);
    if (!m) return null;
    const mi = MONTHS.indexOf(m[2].toLowerCase()); if (mi < 0) return null;
    md = p2(mi + 1) + "-" + p2(m[1]); year = m[3] || null; rest = s.slice(m.index + m[0].length);
  }
  const t = rest.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i);
  if (!t) return null;
  let h = parseInt(t[1], 10); const ap = (t[3] || "").toLowerCase();
  if (ap === "pm" && h !== 12) h += 12; if (ap === "am" && h === 12) h = 0;
  if (!year) { const hit = dates.find(d => d.slice(5) === md); year = hit ? hit.slice(0, 4) : (dates[0] || String(new Date().getFullYear())).slice(0, 4); }
  return year + "-" + md + "|" + p2(h) + ":" + t[2];
}

function parseSignups(text) {
  const dates = scheduleDates();
  const rows = parseCsv(text);
  const hi = rows.findIndex(r => r[0] && r[0].trim() === "participant_no"); // skips FormSG metadata rows
  if (hi < 0) throw new Error("No header row starting with participant_no found");
  const head = rows[hi].map(h => h.trim());
  const ix = name => head.indexOf(name);
  const out = [];
  for (const r of rows.slice(hi + 1)) {
    const n = parseInt((r[ix("participant_no")] || "").trim(), 10);
    if (!n) continue;
    const g = name => (r[ix(name)] || "").trim();
    const av = [], unparsed = [];
    g("timeslot").split(";").map(x => x.trim()).filter(Boolean).forEach(x => { const k = slotKey(x, dates); if (!k) unparsed.push(x); else if (!av.includes(k)) av.push(k); });
    // Every other column is kept as-is in raw, so fields can be (re)configured in Settings without re-importing.
    const raw = {};
    head.forEach((h, i) => { if (h && !["participant_no", "timeslot", "submission_timestamp"].includes(h)) raw[h] = (r[i] || "").trim(); });
    out.push({ n, raw, av, unparsed, submitted: g("submission_timestamp") });
  }
  return out;
}

function stamp() {
  const d = new Date(), p = x => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes());
}

function uniqueFolder() {
  let base = stamp(), name = base, i = 2;
  while (fs.existsSync(path.join(UPLOADS_DIR, name))) name = base + "-" + i++;
  return name;
}

function saveState(s) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function seedState() {
  const folders = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).filter(f => fs.existsSync(path.join(UPLOADS_DIR, f, "signups.csv"))).sort() : [];
  if (!folders.length) throw new Error("No uploads/<timestamp>/signups.csv found to seed from");
  const first = folders[0];
  const ps = parseSignups(fs.readFileSync(path.join(UPLOADS_DIR, first, "signups.csv"), "utf8"));
  const s = { v: 3, participants: ps, place: {}, avail: {}, status: {}, calledAt: {}, notes: {}, deadline: {}, uploads: [{ folder: first, added: ps.map(p => p.n) }] };
  ps.forEach(p => { s.place[p.n] = "N"; s.avail[p.n] = p.av.slice(); s.status[p.n] = "unset"; });
  saveState(s);
  return s;
}

function getState() {
  if (!fs.existsSync(STATE_FILE)) return seedState();
  const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  if (!s.calledAt) s.calledAt = {};
  if (!s.notes) s.notes = {};
  if (!s.deadline) s.deadline = {};
  if (!s.v || s.v < 2) {
    // One-time migration: "pending call" used to be the default; the default is now "unset" (grey ?).
    Object.keys(s.status).forEach(n => { if (s.status[n] === "pendcall") s.status[n] = "unset"; });
    s.v = 2;
  }
  if (s.v < 3) {
    // One-time: lock the deadline day for people already at Called / Pending confirmation, from their current slot.
    Object.keys(s.status).forEach(n => {
      const pl = s.place[n] || "";
      if ((s.status[n] === "called" || s.status[n] === "pendconf") && pl.indexOf("|") > 0 && !s.deadline[n]) s.deadline[n] = pl.split("|")[0];
    });
    s.v = 3;
    saveState(s);
  }
  return s;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = "", size = 0;
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { reject(new Error("Body too large")); req.destroy(); } else b += c; });
    req.on("end", () => resolve(b));
    req.on("error", reject);
  });
}

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url.split("?")[0];
    if (req.method === "GET" && (url === "/" || url === "/shortlist.html"))
      return send(res, 200, fs.readFileSync(path.join(ROOT, "shortlist.html"), "utf8"), "text/html; charset=utf-8");
    if (req.method === "GET" && url === "/api/state") return send(res, 200, getState());
    if (req.method === "PUT" && url === "/api/state") {
      const inc = JSON.parse(await readBody(req));
      const s = getState();
      // Only the user-editable parts are accepted; participants come from CSVs.
      ["place", "avail", "status", "calledAt", "notes", "deadline", "settings"].forEach(k => { if (inc[k] && typeof inc[k] === "object") s[k] = inc[k]; });
      saveState(s);
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url === "/api/import") {
      const text = await readBody(req);
      const parsed = parseSignups(text); // throws before anything is written if the file is bad
      const s = getState();
      const known = new Set(s.participants.map(p => p.n));
      const added = parsed.filter(p => !known.has(p.n));
      const folder = uniqueFolder();
      fs.mkdirSync(path.join(UPLOADS_DIR, folder), { recursive: true });
      fs.writeFileSync(path.join(UPLOADS_DIR, folder, "signups.csv"), text);
      added.forEach(p => { s.participants.push(p); s.place[p.n] = "N"; s.avail[p.n] = p.av.slice(); s.status[p.n] = "unset"; });
      s.participants.sort((a, b) => a.n - b.n);
      s.uploads.push({ folder, added: added.map(p => p.n) });
      saveState(s);
      return send(res, 200, { state: s, folder, rowsInFile: parsed.length, added: added.map(p => p.n) });
    }
    if (req.method === "POST" && url === "/api/export") {
      const text = await readBody(req);
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
      const kind = new URL(req.url, "http://x").searchParams.get("kind") === "confirmed" ? "confirmed_" : "";
      const base = "shortlist_" + kind + stamp();
      let file = base + ".csv", i = 2;
      while (fs.existsSync(path.join(EXPORTS_DIR, file))) file = base + "-" + i++ + ".csv";
      fs.writeFileSync(path.join(EXPORTS_DIR, file), text);
      return send(res, 200, { file: "exports/" + file });
    }
    send(res, 404, { error: "Not found" });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

server.listen(PORT, "127.0.0.1", () => console.log("Shortlist running at http://localhost:" + PORT));
