# 7 gegen Martin – JGA-Quiz

Kleine Web-App für den Junggesellenabschied: Die Jungs beantworten auf dem Handy Fragen über Martin,
alle Antworten landen in einer Datenbank, und der Zeremonienmeister löst am Feuer Frage für Frage auf.

- **Spieler-Seite:** `index.html` – ein Link für alle, jeder wählt seinen Namen.
- **Admin-Seite:** `admin.html` – Fragen pflegen, Spieler pflegen, Eingang beobachten, Auflösung.
- **Datenbank:** [Supabase](https://supabase.com) (Postgres, kostenloser Plan reicht). Die Seite selbst ist rein statisch und läuft auf GitHub Pages.

## Einrichtung (ca. 15 Minuten)

### 1. Supabase-Projekt anlegen

1. Auf <https://supabase.com> anmelden → **New project** (Name egal, Region z. B. Frankfurt, Datenbank-Passwort merken).
2. Im Projekt links **SQL Editor** → **New query** → den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → **Run**.
   Das legt die Tabellen, die Zugriffsregeln und die Startdaten (Spielernamen, 12 Fragen ohne Antworten) an.
3. Links **Authentication → Users → Add user → Create new user**: deine E-Mail + ein Passwort eintragen,
   **Auto Confirm User** anhaken. Das ist dein Admin-Login.
4. Links **Project Settings → API**: die **Project URL** und den **anon public** Key kopieren.

### 2. Zugangsdaten eintragen

In [`config.js`](config.js) beide Werte eintragen:

```js
window.JGA_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

Der anon-Key darf öffentlich im Repo liegen. Was er darf, regelt die Datenbank per Row Level Security:
Spieler können Fragen und Namen lesen und ihre eigene Abgabe speichern, mehr nicht.
Lösungen und fremde Abgaben sieht nur, wer auf der Admin-Seite eingeloggt ist.

### 3. Auf GitHub Pages veröffentlichen

1. Neues Repository auf GitHub anlegen (public oder private, beides geht mit Pages).
2. Alle Dateien dieses Ordners hochladen bzw. pushen:

```bash
git init && git add . && git commit -m "JGA-Quiz" && git branch -M main
```

```bash
git remote add origin https://github.com/DEIN-NAME/DEIN-REPO.git && git push -u origin main
```

3. Im Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)` → **Save**.
4. Nach ein bis zwei Minuten ist die Seite unter `https://DEIN-NAME.github.io/DEIN-REPO/` erreichbar.
   Die Admin-Seite ist `https://DEIN-NAME.github.io/DEIN-REPO/admin.html`.

## Ablauf

1. **Admin → Fragen:** Antworten der Braut eintragen, richtige markieren, speichern. Unvollständige Fragen sehen die Spieler nicht.
2. **Admin → Eingang:** Spieler-Link kopieren oder per WhatsApp an alle schicken. Die Liste zeigt, wer schon abgegeben hat, und aktualisiert sich alle 20 Sekunden.
3. **Spieler:** Link öffnen, Namen wählen, 12 Fragen beantworten, abschicken. Antworten können bis zur Auflösung noch geändert werden (einfach nochmal abschicken).
4. **Admin → Auflösung:** Am Feuer Frage für Frage aufdecken, Zwischenstand läuft mit, am Ende die Siegerehrung. „Martin“ wird separat gewertet.

## Lokal testen

Die Seite braucht einen kleinen Webserver (wegen der getrennten Dateien), z. B.:

```bash
python3 -m http.server 8000
```

Dann <http://localhost:8000> bzw. <http://localhost:8000/admin.html> öffnen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Spieler-Seite |
| `admin.html` | Admin-Seite (Login über Supabase Auth) |
| `config.js` | Supabase-URL und anon-Key |
| `assets/common.js` | Gemeinsame Helfer und Datenbankzugriff |
| `assets/style.css`, `assets/logo.webp` | Gestaltung |
| `supabase/schema.sql` | Tabellen, Zugriffsregeln, Startdaten |
