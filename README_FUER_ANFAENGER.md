# Knallhart Serviert – Release Voting

## Was diese Version zusätzlich kann
- besseres, übersichtlicheres Frontend
- Drag & Drop Ranking mit eindeutigen Punktzahlen
- Admin-Login ohne öffentlichen Admin-Link
- voreingestellter Slug mit Datum
- Direktlink pro Umfrage im Backend
- eingebautes Platzhalter-Logo unter `public/knallhart-serviert-logo.svg`

## Wichtig
Wenn du das echte Logo hast, ersetze einfach die Datei `public/knallhart-serviert-logo.svg` durch dein echtes Logo mit demselben Dateinamen.

## Vercel Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

## Admin-Zugang
Nach dem Deploy:
- Login: `/admin/login`
- Dashboard: `/admin/release-voting`

## Supabase
Im SQL Editor die Datei `supabase_release_voting.sql` komplett ausführen.
