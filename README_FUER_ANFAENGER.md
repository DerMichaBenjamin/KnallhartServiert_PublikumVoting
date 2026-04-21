# Release Voting – komplette Neustart-Version

Diese Version ist für den Fall gedacht, dass das alte Projekt zu chaotisch geworden ist.

## Die ehrlichste Empfehlung

Ja: **neu anfangen macht hier Sinn**.

Warum?

- Im alten Projekt sind schon mehrere Versionen, alte API-Routen und neue Dateien durcheinander geraten.
- Wenn du sehr wenig Technik-Erfahrung hast, ist ein kompletter Neustart meistens **schneller** als weiteres Reparieren.
- Der sicherste Weg ist: **altes Projekt behalten, neues Projekt separat anlegen**.

## Was diese neue Version kann

- Admin-Seite zum Anlegen von Umfragen
- aktuelle Runde als "live" setzen
- Runde beenden
- Link zur jeweiligen Umfrage direkt im Admin sehen
- öffentliche Voting-Seite
- direkter Link pro Runde über `/release-voting/[slug]`
- Ergebnisliste im Admin
- Liste der letzten Stimmen im Admin

## WICHTIG: so machst du es am einfachsten

### Bitte NICHT das alte Projekt weiter umbauen.

Mach stattdessen:

1. neues GitHub-Repo
2. neues Vercel-Projekt
3. dieselbe oder eine neue Supabase-Datenbank
4. dieses Paket komplett hochladen

So bleibt dein altes Projekt als Backup erhalten.

---

# TEIL A – neues GitHub-Repo anlegen

## 1. Neues Repo erstellen

1. Öffne GitHub.
2. Klicke oben rechts auf das **+**.
3. Klicke auf **New repository**.
4. Name zum Beispiel:
   `release-voting-clean`
5. Das Repo darf **Public oder Private** sein.
6. Klicke auf **Create repository**.

## 2. Dieses ZIP entpacken

1. Lade das ZIP herunter.
2. Rechtsklick auf das ZIP.
3. **Alle extrahieren**.
4. Öffne den entpackten Ordner.

## 3. Alle Dateien aus dem ZIP in das neue Repo hochladen

Wenn du nur im Browser arbeitest:

1. Öffne dein neues leeres GitHub-Repo.
2. Klicke auf **uploading an existing file** oder **Add file** → **Upload files**.
3. Ziehe **alle Dateien und Ordner aus dem entpackten ZIP** hinein.
4. Klicke auf **Commit changes**.

Wichtig: Alles aus dem ZIP hochladen, nicht nur einzelne Dateien.

---

# TEIL B – Supabase vorbereiten

## 4. SQL-Datei ausführen

1. Öffne Supabase.
2. Öffne dein Projekt.
3. Gehe links auf **SQL Editor**.
4. Klicke auf **New query**.
5. Öffne im ZIP die Datei:
   `supabase_release_voting.sql`
6. Kopiere den kompletten Inhalt.
7. Füge ihn in Supabase ein.
8. Klicke auf **Run**.

Danach gibt es in der Datenbank genau diese zwei Tabellen:

- `release_polls`
- `release_votes`

---

# TEIL C – Umgebungsvariablen setzen

## 5. Die zwei Supabase-Werte finden

In Supabase:

1. Projekt öffnen
2. **Project Settings**
3. **API**

Dort brauchst du:

- **Project URL**
- **service_role key**

## 6. Datei `.env.local.example` bearbeiten

Im ZIP liegt die Datei:

`.env.local.example`

Öffne sie.

Dort steht:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=DEIN_SERVICE_ROLE_KEY
```

Ersetze:

- `https://DEIN-PROJEKT.supabase.co` durch deine echte Project URL
- `DEIN_SERVICE_ROLE_KEY` durch deinen echten service_role key

Danach speichere die Datei.

## 7. Datei umbenennen

Aus:

`.env.local.example`

wird:

`.env.local`

Wichtig:

- nur **ein** Gleichheitszeichen verwenden
- keine zusätzlichen Anführungszeichen einfügen
- kein Leerzeichen vor oder nach `=`

Richtig:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

# TEIL D – neues Vercel-Projekt anlegen

## 8. Neues Vercel-Projekt erstellen

1. Öffne Vercel.
2. Klicke auf **Add New** → **Project**.
3. Wähle das **neue GitHub-Repo** aus.
4. Klicke auf **Import**.

## 9. Environment Variables in Vercel setzen

Im Vercel-Projekt:

1. **Settings**
2. **Environment Variables**

Lege diese zwei Variablen an:

### Variable 1
Name:
`NEXT_PUBLIC_SUPABASE_URL`

Wert:
Deine Supabase Project URL

### Variable 2
Name:
`SUPABASE_SERVICE_ROLE_KEY`

Wert:
Dein Supabase service_role key

Am besten jeweils aktivieren für:

- Production
- Preview
- Development

Dann speichern.

---

# TEIL E – Deployment starten

## 10. Deployment auslösen

Wenn du das Repo in GitHub hochgeladen hast und die Variablen gesetzt sind, baut Vercel das Projekt automatisch.

Falls nicht:

1. Gehe auf **Deployments**.
2. Starte ein neues Deployment.

---

# TEIL F – was du danach aufrufst

## Admin
`/admin/release-voting`

## Öffentliche aktuelle Umfrage
`/release-voting`

## Direkter Link zu einer Runde
`/release-voting/dein-slug`

---

# WIE DU DIE ERSTE UMFRAGE ANLEGST

1. Öffne `/admin/release-voting`
2. Fülle aus:
   - Titel
   - Slug
   - Beschreibung
   - Status = `Live`
   - Start
   - Ende
   - Songliste
3. Songliste immer **eine Zeile pro Song**:

```text
Songtitel – Interpret
Songtitel – Interpret
Songtitel – Interpret
```

4. Klicke auf **Umfrage anlegen**

Wenn Status = **Live**, erscheint die Runde auf `/release-voting` sofort als aktuelle Umfrage.

---

# WENN DU DICH ZWISCHEN "ALTES REPO LÖSCHEN" ODER "NEU" FRAGST

## Meine klare Empfehlung

**Nicht das alte Repo löschen.**

Besser:

- altes Repo lassen, wie es ist
- neues Repo anlegen
- dieses neue Projekt frisch deployen

Warum?

- Du hast einen sauberen Schnitt
- kein Durcheinander mit Altcode
- kein Risiko, dass du das alte Projekt endgültig kaputt machst
- du kannst jederzeit vergleichen oder zurückgehen

---

# WENN ETWAS NICHT GEHT

## Prüfe in dieser Reihenfolge

### 1. SQL ausgeführt?
Wenn nicht, fehlen die Tabellen.

### 2. ENV-Variablen korrekt?
Besonders häufige Fehler:

- zwei `=` statt einem
- falscher Key
- URL ohne `https://`
- Variable in Vercel vergessen

### 3. Neues Repo und neues Vercel-Projekt verwendet?
Wenn du wieder das alte Projekt benutzt, schleppst du womöglich den alten Ballast mit.

---

# DATEIÜBERSICHT

- `app/` → Seiten und API-Routen
- `components/PublicVotingForm.tsx` → Voting-Formular
- `lib/` → Datenbank-Helfer
- `supabase_release_voting.sql` → Tabellen anlegen
- `.env.local.example` → Vorlage für die 2 Umgebungsvariablen
- `package.json` → Projekt-Abhängigkeiten

