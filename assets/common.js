// Gemeinsame Basis für Spieler- und Admin-Seite: Helfer + Datenbankzugriff (Supabase).
(function(){
  const LETTERS = ["A","B","C","D"];
  const app = document.getElementById("app");

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const h = html => { app.innerHTML = html; window.scrollTo(0,0); };
  const ls = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  async function copy(text, btn){
    try{ await navigator.clipboard.writeText(text); if(btn){ const o=btn.textContent; btn.textContent="Kopiert ✓"; setTimeout(()=>btn.textContent=o,1600);} }
    catch(e){ prompt("Kopieren:", text); }
  }
  const waLink = text => "https://wa.me/?text=" + encodeURIComponent(text);
  const playerUrl = () => location.href.replace(/admin\.html.*$/, "").replace(/#.*$/, "");

  // ---------- Supabase ----------
  const cfg = window.JGA_CONFIG || {};
  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const unwrap = ({ data, error }) => { if(error) throw new Error(error.message || String(error)); return data; };

  const db = {
    // --- lesen (Spieler + Admin) ---
    async players(){
      return unwrap(await sb.from("players").select("id,name,position").order("position").order("id"));
    },
    async questions(){
      return unwrap(await sb.from("questions").select("id,position,text,options,active").order("position").order("id"));
    },
    // --- Spieler ---
    async submit(player, answers){
      return unwrap(await sb.from("submissions").upsert({ player, answers, submitted_at: new Date().toISOString() }, { onConflict: "player" }));
    },
    // --- Admin ---
    async solutions(){
      const rows = unwrap(await sb.from("solutions").select("question_id,correct"));
      const m = {}; rows.forEach(r => m[r.question_id] = r.correct); return m;
    },
    async submissions(){
      return unwrap(await sb.from("submissions").select("player,answers,submitted_at").order("submitted_at"));
    },
    async deleteSubmission(player){
      return unwrap(await sb.from("submissions").delete().eq("player", player));
    },
    async savePlayers(names){
      const existing = await db.players();
      const keep = new Set(names);
      const gone = existing.filter(p => !keep.has(p.name)).map(p => p.id);
      if(gone.length) unwrap(await sb.from("players").delete().in("id", gone));
      const rows = names.map((name, i) => ({ name, position: i + 1 }));
      if(rows.length) unwrap(await sb.from("players").upsert(rows, { onConflict: "name" }));
    },
    // list: [{id?, position, text, options:[4], correct:-1..3}]
    async saveQuestions(list){
      const existing = await db.questions();
      const keepIds = new Set(list.filter(q => q.id).map(q => q.id));
      const gone = existing.filter(q => !keepIds.has(q.id)).map(q => q.id);
      if(gone.length) unwrap(await sb.from("questions").delete().in("id", gone));
      const toUpdate = list.filter(q => q.id).map((q) => ({ id: q.id, position: q.position, text: q.text, options: q.options, active: true }));
      if(toUpdate.length) unwrap(await sb.from("questions").upsert(toUpdate, { onConflict: "id" }));
      const toInsert = list.filter(q => !q.id);
      let inserted = [];
      if(toInsert.length){
        inserted = unwrap(await sb.from("questions").insert(toInsert.map(q => ({ position: q.position, text: q.text, options: q.options, active: true }))).select("id,position"));
        // ids zurück in die Liste schreiben (Reihenfolge = Einfügereihenfolge)
        toInsert.forEach((q, i) => { q.id = inserted[i]?.id; });
      }
      const withSol = list.filter(q => q.id && q.correct >= 0).map(q => ({ question_id: q.id, correct: q.correct }));
      const noSol = list.filter(q => q.id && !(q.correct >= 0)).map(q => q.id);
      if(withSol.length) unwrap(await sb.from("solutions").upsert(withSol, { onConflict: "question_id" }));
      if(noSol.length) unwrap(await sb.from("solutions").delete().in("question_id", noSol));
      return list;
    },
    // --- Auth ---
    async session(){ return unwrap(await sb.auth.getSession()).session; },
    async signIn(email, password){ return unwrap(await sb.auth.signInWithPassword({ email, password })); },
    async signOut(){ await sb.auth.signOut(); },
    onAuth(fn){ sb.auth.onAuthStateChange((_e, s) => fn(s)); }
  };

  function renderNotConfigured(){
    h(`
      <h1>Noch nicht verbunden</h1>
      <p class="muted lead">In <code>config.js</code> fehlen noch die Supabase-Zugangsdaten. Anleitung steht in der README.</p>
    `);
  }
  function renderError(err, retry){
    console.error(err);
    h(`
      <h1>Verbindung gestört</h1>
      <p class="muted lead">${esc(err?.message || err)}</p>
      <div class="center" style="margin-top:14px"><button class="primary" id="retry">Nochmal versuchen</button></div>
    `);
    document.getElementById("retry").onclick = retry || (() => location.reload());
  }

  window.JGA = { LETTERS, esc, h, ls, copy, waLink, playerUrl, configured, db, renderNotConfigured, renderError };
})();
