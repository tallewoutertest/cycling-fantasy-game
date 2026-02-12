# 🚴 Wielrennen Fantasy Game

Een complete fantasy game applicatie voor wielrennen klassiekers waar je met vrienden kunt voorspellen hoe koersen aflopen.

## Features

### Voor Spelers
- ✅ Authenticatie (inloggen/registreren)
- ✅ Overzicht van beschikbare koersen
- ✅ Voorspellingen invullen per koers:
  - **Top 3**: Selecteer 3 renners uit alle UCI profrenners
  - **Top 10 Rangschikking**: Rangschik 10 voorgeselecteerde renners
  - **Head-to-Head**: Kies welke van 2 renners hoger eindigt
- ✅ Voorspellingen bewerken tot de deadline
- 📊 Klassement (komt later)

### Voor Admin
- ✅ Koersen toevoegen en configureren
- ✅ Renners database beheren
- ✅ Per koers configureren:
  - Deelnemende renners
  - Top 10 kandidaten selecteren
  - Head-to-Head opties instellen
- ✅ Bulk import voor renners

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: GitHub Pages + Supabase
- **Libraries**:
  - Supabase JS SDK
  - SortableJS (drag & drop)

## Setup Instructies

### 1. Supabase Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com)
2. Maak een gratis account aan
3. Klik op "New Project"
4. Vul de project details in:
   - Project naam: bijv. "cycling-fantasy"
   - Database wachtwoord: kies een sterk wachtwoord
   - Region: kies de dichtstbijzijnde regio (bijv. West EU)
5. Wacht tot het project klaar is (1-2 minuten)

### 2. Database Configureren

1. Ga naar je Supabase project dashboard
2. Klik in het linker menu op "SQL Editor"
3. Open het bestand `database-setup.sql` uit dit project
4. Kopieer de hele inhoud
5. Plak het in de Supabase SQL Editor
6. Klik op "Run" rechtsonder
7. Je ziet nu "Success. No rows returned" - dit is correct!

### 3. API Keys Configureren

1. In je Supabase project, ga naar "Project Settings" (tandwiel icoon linksonder)
2. Klik op "API" in het menu
3. Je ziet nu:
   - **Project URL**: bijvoorbeeld `https://xxxxx.supabase.co`
   - **anon public key**: een lange string beginnend met `eyJ...`
4. Open het bestand `js/config.js` in dit project
5. Vervang de placeholders:
   ```javascript
   const SUPABASE_URL = 'https://jouwproject.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...'; // De anon key
   ```
6. Sla het bestand op

### 4. Eerste Admin Account Aanmaken

1. Open `index.html` in je browser (lokaal testen)
2. Klik op "Registreren"
3. Vul je gegevens in en maak een account
4. Ga terug naar Supabase Dashboard
5. Klik op "Table Editor" in het linker menu
6. Selecteer de tabel "profiles"
7. Zoek je account (herkenbaar aan je email)
8. Dubbelklik op de "is_admin" kolom bij jouw rij
9. Vink het vakje aan (wordt `true`)
10. Je bent nu admin!

### 5. Deployment naar GitHub Pages

#### Optie A: Via GitHub Desktop (Makkelijkst)

1. Download en installeer [GitHub Desktop](https://desktop.github.com)
2. Open GitHub Desktop
3. Klik op "File" > "Add Local Repository"
4. Selecteer de `cycling-fantasy-game` folder
5. Klik op "Create Repository" als het nog geen git repo is
6. Vul een beschrijving in en klik "Create Repository"
7. Klik op "Publish repository" bovenin
8. Vink "Keep this code private" uit (tenzij je een private repo wilt)
9. Klik "Publish repository"
10. Ga naar github.com en log in
11. Ga naar je repository
12. Klik op "Settings"
13. Scroll naar "Pages" in het linker menu
14. Bij "Source" selecteer "main" branch
15. Klik "Save"
16. Na 1-2 minuten is je site live op: `https://jouwnaam.github.io/cycling-fantasy-game/`

#### Optie B: Via Command Line

```bash
cd cycling-fantasy-game
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jouwnaam/cycling-fantasy-game.git
git push -u origin main
```

Vervolgens in GitHub:
- Settings > Pages > Source: main branch > Save

### 6. Renners Toevoegen

1. Log in op je app
2. Ga naar `/admin/` (bijv. `https://jouwnaam.github.io/cycling-fantasy-game/admin/`)
3. Klik op "Renners" tab
4. Je hebt 2 opties:

**Optie A: Handmatig toevoegen**
- Klik "Renner Toevoegen"
- Vul naam, team, nationaliteit in
- Klik "Renner Toevoegen"

**Optie B: Bulk Import** (sneller!)
- Klik "Bulk Import"
- Plak renners in dit formaat (1 per regel):
  ```
  Wout van Aert, Visma-Lease a Bike, BEL
  Mathieu van der Poel, Alpecin-Deceuninck, NED
  Tadej Pogačar, UAE Team Emirates, SLO
  Jonas Vingegaard, Visma-Lease a Bike, DEN
  Remco Evenepoel, Soudal Quick-Step, BEL
  ```
- Klik "Importeren"

### 7. Eerste Koers Configureren

1. In het Admin Panel, ga naar "Koersen" tab
2. Klik "Nieuwe Koers"
3. Vul in:
   - **Naam**: bijv. "Omloop Het Nieuwsblad"
   - **Datum**: de wedstrijddatum
   - **Inschrijving Deadline**: datum + tijd waarop voorspellingen sluiten (vaak 1 uur voor de start)
   - **Is Monument**: vink aan voor de 5 monumenten (Milano-Sanremo, Ronde, Roubaix, Luik, Lombardije)
4. Klik "Koers Aanmaken"
5. Klik "Configureren" bij de koers
6. Configureer in de tabs:

**Tab 1: Deelnemers**
- Zoek en voeg renners toe die aan deze koers meedoen
- Dit is de pool waaruit spelers kunnen kiezen voor hun Top 3

**Tab 2: Top 10 Config**
- Selecteer 10 favorieten die spelers moeten rangschikken
- Sleep ze in de standaard volgorde (bijv. op basis van favorieten status)

**Tab 3: Head-to-Head**
- Kies 2 renners die ongeveer even sterk zijn
- Spelers moeten kiezen wie van de 2 hoger eindigt
- Leuke voorbeelden: Wout vs Mathieu, of twee ploeggenoten

### 8. Vrienden Uitnodigen

Deel de link naar je app:
```
https://jouwnaam.github.io/cycling-fantasy-game/
```

Je vrienden kunnen:
1. Een account aanmaken met hun email
2. Inloggen
3. Voorspellingen invullen voor alle koersen
4. Hun voorspellingen bijwerken tot de deadline

## Projectstructuur

```
cycling-fantasy-game/
├── index.html              # Hoofdpagina voor spelers
├── css/
│   └── style.css          # Alle styling
├── js/
│   ├── config.js          # Supabase configuratie
│   ├── auth.js            # Authenticatie logica
│   ├── races.js           # Koersen weergave
│   ├── predictions.js     # Voorspellingen formulier
│   └── app.js             # Algemene app functies
├── admin/
│   ├── index.html         # Admin panel
│   ├── admin.css          # Admin styling
│   └── admin.js           # Admin logica
├── database-setup.sql     # Database schema
└── README.md              # Deze file
```

## Database Schema

### Belangrijkste tabellen:
- **riders**: Alle UCI renners
- **races**: Koersen met datum en deadline
- **race_riders**: Welke renners doen mee aan welke koers
- **top_10_candidates**: De 10 renners voor ranking per koers
- **head_to_head**: H2H opties per koers
- **predictions**: Voorspellingen van gebruikers
- **prediction_top3**: Top 3 keuzes
- **prediction_top10**: Top 10 rangschikking
- **prediction_h2h**: H2H keuze

## Security Features

✅ Row Level Security (RLS) geactiveerd
✅ Gebruikers kunnen alleen hun eigen voorspellingen zien/wijzigen
✅ Alleen admins kunnen koersen en renners beheren
✅ Voorspellingen kunnen niet meer worden gewijzigd na deadline

## Veelgestelde Vragen

**Q: Kan ik meerdere admins hebben?**
A: Ja! Ga in Supabase naar de `profiles` tabel en zet `is_admin` op `true` voor andere gebruikers.

**Q: Hoe bereken ik de scores na een koers?**
A: Dit moet je momenteel handmatig doen. Een toekomstige update zal automatische scoring toevoegen.

**Q: Kunnen spelers elkaars voorspellingen zien?**
A: Nee, niet in de huidige versie. De database heeft RLS waardoor iedereen alleen zijn eigen voorspellingen ziet.

**Q: Wat als een renner niet deelneemt aan een koers?**
A: Verwijder de renner uit de "Deelnemers" lijst in het admin panel. Voorspellingen die al zijn ingevuld blijven staan.

**Q: Kan ik koersen verwijderen?**
A: Ja, maar alle voorspellingen voor die koers worden ook verwijderd. Wees voorzichtig!

**Q: Is dit gratis?**
A: Ja! Supabase heeft een gratis tier die ruim voldoende is voor een groep vrienden. GitHub Pages is ook gratis.

## Toekomstige Features

- [ ] Automatische scoring na koersen
- [ ] Live klassement
- [ ] Notificaties voor deadlines
- [ ] Spelers kunnen elkaars voorspellingen zien na de deadline
- [ ] Statistieken en grafieken
- [ ] Seizoenspunten over meerdere koersen
- [ ] Badges en achievements
- [ ] Export naar Excel/PDF

## Support

Heb je vragen of problemen? Check de issues op GitHub of neem contact op!

## Licentie

MIT License - Vrij te gebruiken en aanpassen voor persoonlijk gebruik.

---

**Veel plezier met je wielrennen fantasy game! 🚴🏆**
