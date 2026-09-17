-- ============================================================
--  7 gegen Martin – Datenbankschema für Supabase (Postgres)
--  Einmal im Supabase SQL-Editor ausführen (Dashboard → SQL Editor → New query).
-- ============================================================

-- Spieler (Namen, die auf der Spieler-Seite zur Auswahl stehen)
create table if not exists public.players (
  id          serial primary key,
  name        text not null unique,
  position    int  not null default 0
);

-- Fragen inkl. Antwortmöglichkeiten – ohne Lösung, damit Spieler sie lesen dürfen
create table if not exists public.questions (
  id          serial primary key,
  position    int  not null default 0,
  text        text not null default '',
  options     text[] not null default array['','','',''],
  active      boolean not null default true
);

-- Lösungen getrennt, nur für den Admin lesbar
create table if not exists public.solutions (
  question_id int primary key references public.questions(id) on delete cascade,
  correct     smallint not null check (correct between 0 and 3),
  note        text not null default ''   -- Originalton der Braut, erscheint bei der Auflösung
);

-- Abgaben: ein Datensatz pro Spieler, Antworten als {"<question_id>": <0..3>, ...}
create table if not exists public.submissions (
  player       text primary key,
  answers      jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

-- ------------------------------------------------------------
--  Row Level Security
--  anon (Spieler-Seite):   Spieler + Fragen lesen, eigene Abgabe schreiben
--  authenticated (Admin):  alles
-- ------------------------------------------------------------
alter table public.players     enable row level security;
alter table public.questions   enable row level security;
alter table public.solutions   enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "players_read"        on public.players;
drop policy if exists "players_admin"       on public.players;
drop policy if exists "questions_read"      on public.questions;
drop policy if exists "questions_admin"     on public.questions;
drop policy if exists "solutions_admin"     on public.solutions;
drop policy if exists "submissions_insert"  on public.submissions;
drop policy if exists "submissions_update"  on public.submissions;
drop policy if exists "submissions_admin"   on public.submissions;

create policy "players_read"   on public.players   for select to anon, authenticated using (true);
create policy "players_admin"  on public.players   for all    to authenticated using (true) with check (true);

create policy "questions_read"  on public.questions for select to anon, authenticated using (true);
create policy "questions_admin" on public.questions for all    to authenticated using (true) with check (true);

create policy "solutions_admin" on public.solutions for all to authenticated using (true) with check (true);

-- Spieler dürfen abgeben und ihre Abgabe überschreiben, aber keine Abgaben lesen
create policy "submissions_insert" on public.submissions for insert to anon with check (true);
create policy "submissions_update" on public.submissions for update to anon using (true) with check (true);
create policy "submissions_admin"  on public.submissions for all    to authenticated using (true) with check (true);

-- ------------------------------------------------------------
--  Startdaten (nur wenn die Tabellen noch leer sind)
-- ------------------------------------------------------------
insert into public.players (name, position)
select * from (values
  ('Jakob',1),('Shawn',2),('Lars',3),('Flo',4),('Fabi',5),('Hans',6),('Phil',7),('Martin',8)
) as v(name, position)
where not exists (select 1 from public.players);

insert into public.questions (position, text)
select * from (values
  (1,  'Was war Martins erster Satz beim Kennenlernen?'),
  (2,  'Welches peinliche Lied findet Martin heimlich gut?'),
  (3,  'Was kann Martin nicht ausstehen, beschwert sich aber nie darüber?'),
  (4,  'Was war Martins schlechtester Kochversuch?'),
  (5,  'Wie lange braucht Martin morgens, bis man mit ihm reden kann?'),
  (6,  'Welche Serie oder welchen Film hat Martin am häufigsten gesehen?'),
  (7,  'Was ist Martins größter „Ich mach das morgen“-Klassiker?'),
  (8,  'Wenn Martin in den Wald geht: Was vergisst er garantiert?'),
  (9,  'Was war das Erste, was Martin nach dem Antrag gesagt hat?'),
  (10, 'Was verliert Martin in der Wildnis als Erstes?'),
  (11, 'Welche Angewohnheit von Martin hat die Braut übernommen, ohne es zu wollen?'),
  (12, 'Wovor hat Martin wirklich Angst?')
) as v(position, text)
where not exists (select 1 from public.questions);
