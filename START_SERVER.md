# Lokale Server Starten

Als je de app lokaal wilt testen zonder `file://`, heb je een lokale webserver nodig.

## Optie 1: Python (Makkelijkst)

Als je Python hebt geïnstalleerd:

```bash
# Ga naar de project folder
cd /Users/wouter/Desktop/Claude\ Code/cycling-fantasy-game

# Start een lokale server op poort 8000
python3 -m http.server 8000
```

Open dan in je browser: `http://localhost:8000`

## Optie 2: PHP

Als je PHP hebt:

```bash
cd /Users/wouter/Desktop/Claude\ Code/cycling-fantasy-game
php -S localhost:8000
```

Open: `http://localhost:8000`

## Optie 3: Node.js

Als je Node.js hebt:

```bash
# Installeer http-server (eenmalig)
npm install -g http-server

# Start server
cd /Users/wouter/Desktop/Claude\ Code/cycling-fantasy-game
http-server -p 8000
```

Open: `http://localhost:8000`

## Optie 4: VS Code Live Server

Als je Visual Studio Code gebruikt:

1. Installeer de "Live Server" extensie
2. Rechtermuisklik op `index.html`
3. Kies "Open with Live Server"

## Site URL in Supabase Configureren

Als je een lokale server gebruikt, configureer dan in Supabase:

1. Ga naar Authentication > URL Configuration
2. Voeg toe aan "Redirect URLs":
   - `http://localhost:8000/**`
   - `http://127.0.0.1:8000/**`
3. Save

Nu zou email bevestiging moeten werken!

## Maar het Makkelijkst...

**Schakel email bevestiging gewoon uit** (zie README)
- Dit is perfect voor een privé app met vrienden
- Sneller en geen gedoe met lokale servers
- Veiliger omdat alleen jij de registratie link deelt
