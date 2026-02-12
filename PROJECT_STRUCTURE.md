# Project Structuur

```
cycling-fantasy-game/
│
├── 📄 index.html                    # Hoofdpagina voor spelers
├── 📄 database-setup.sql            # Supabase database schema
├── 📄 README.md                     # Volledige documentatie
├── 📄 QUICKSTART.md                 # 15-minuten setup gids
├── 📄 example-riders.txt            # 50 voorbeeld renners voor bulk import
├── 📄 .gitignore                    # Git ignore configuratie
│
├── 📁 css/
│   └── style.css                    # Alle styling (gebruikers + modal)
│
├── 📁 js/
│   ├── config.js                    # Supabase configuratie (VEREIST SETUP!)
│   ├── auth.js                      # Login/registratie/uitloggen
│   ├── races.js                     # Koersen laden en weergeven
│   ├── predictions.js               # Voorspellingen formulier logica
│   └── app.js                       # Algemene app functies (tabs, etc)
│
└── 📁 admin/
    ├── index.html                   # Admin panel interface
    ├── admin.css                    # Admin specifieke styling
    └── admin.js                     # Admin functionaliteit
```

## Bestandsgroottes

| Bestand | Regels | Functie |
|---------|--------|---------|
| database-setup.sql | ~250 | Complete database schema met RLS |
| index.html | ~195 | Spelers interface met 3 tabs |
| style.css | ~600 | Volledige styling dark theme |
| auth.js | ~145 | Authenticatie + profiel beheer |
| races.js | ~160 | Koersen laden + autocomplete |
| predictions.js | ~315 | Formulier + opslaan voorspellingen |
| admin/index.html | ~250 | Admin panel met tabs |
| admin.css | ~330 | Admin specifieke styling |
| admin.js | ~680 | Volledige admin functionaliteit |

**Totaal: ~2900 regels code**

## Database Tabellen

```
auth.users (Supabase managed)
└── profiles
    ├── is_admin (boolean)
    └── display_name (text)

riders (UCI profrenners)
├── first_name
├── last_name
├── team
├── nationality
└── uci_id

races (Koersen)
├── name
├── date
├── registration_deadline
└── is_monument

race_riders (M:N relation)
├── race_id → races
└── rider_id → riders

top_10_candidates (10 renners per koers)
├── race_id → races
├── rider_id → riders
└── display_order

head_to_head (H2H per koers)
├── race_id → races
├── rider_a_id → riders
└── rider_b_id → riders

predictions (Voorspellingen)
├── user_id → auth.users
└── race_id → races

prediction_top3 (Top 3 keuzes)
├── prediction_id → predictions
├── rider_id → riders
└── position (1-3)

prediction_top10 (Top 10 ranking)
├── prediction_id → predictions
├── rider_id → riders
└── predicted_position (1-10)

prediction_h2h (H2H keuze)
├── prediction_id → predictions
├── h2h_id → head_to_head
└── selected_rider_id → riders
```

## Features Checklist

### ✅ Geïmplementeerd

**Authenticatie**
- [x] Login systeem
- [x] Registratie
- [x] Uitloggen
- [x] Profiel bewerken
- [x] Row Level Security (RLS)

**Spelers Interface**
- [x] Koersen overzicht
- [x] Datum + deadline weergave
- [x] Voorspelling formulier (modal)
- [x] Top 3 met autocomplete
- [x] Top 10 drag & drop ranking
- [x] Head-to-Head selectie
- [x] Voorspellingen bewerken
- [x] Status indicator (ingevuld/niet ingevuld)

**Admin Panel**
- [x] Koersen toevoegen
- [x] Koersen verwijderen
- [x] Renners toevoegen (handmatig)
- [x] Renners bulk import
- [x] Renners zoeken/filteren
- [x] Koers configuratie modal
- [x] Deelnemers beheren
- [x] Top 10 kandidaten selecteren (drag & drop)
- [x] Head-to-Head instellen
- [x] Admin rechten controle

**Database**
- [x] Complete schema
- [x] Row Level Security policies
- [x] Automatische profile creation
- [x] Cascade deletes
- [x] Indexes voor performance

**UI/UX**
- [x] Dark theme
- [x] Responsive design
- [x] Monument badges
- [x] Autocomplete dropdown
- [x] Drag & drop sorteerbaar
- [x] Modal dialogs
- [x] Tab navigatie
- [x] Loading states

### 📋 Toekomstige Features

**Scoring Systeem**
- [ ] Uitslagen invoeren
- [ ] Automatische punten berekening
- [ ] Klassement genereren
- [ ] Seizoenspunten

**Social Features**
- [ ] Voorspellingen zien na deadline
- [ ] Leaderboard
- [ ] Profiel foto's
- [ ] Groepen/leagues

**Notificaties**
- [ ] Email reminders voor deadlines
- [ ] Push notificaties
- [ ] Resultaat updates

**Analytics**
- [ ] Statistieken per speler
- [ ] Grafieken en visualisaties
- [ ] Export naar Excel/PDF
- [ ] Historische data

**Admin Features**
- [ ] Bulk koersen import
- [ ] Seizoen templates
- [ ] Punten systeem configuratie
- [ ] Renners uit PCS scrapen

## Technische Details

**Stack:**
- Frontend: Vanilla JavaScript (ES6+)
- Backend: Supabase (PostgreSQL + Auth)
- Styling: CSS3 (Custom, geen framework)
- Hosting: GitHub Pages (frontend) + Supabase (backend)
- External Libraries:
  - Supabase JS SDK v2
  - SortableJS v1.15.0

**Browser Support:**
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Responsive design

**Security:**
- Row Level Security (RLS) geactiveerd
- JWT tokens via Supabase Auth
- HTTPS enforced (via GitHub Pages)
- API keys client-side (public anon key)
- SQL injection protected (parameterized queries)

**Performance:**
- Lazy loading van renners
- Autocomplete debouncing
- Optimized queries met indexes
- CDN voor external libraries
- Minimal bundle size (~50KB incl. HTML/CSS/JS)

## Setup Vereisten

1. ✅ Supabase account (gratis tier)
2. ✅ GitHub account (optioneel, voor hosting)
3. ✅ Modern web browser
4. ✅ Text editor (voor config.js)

**Tijd om op te zetten:** 15-20 minuten
**Kosten:** €0 (gratis tiers)
**Ervaring nodig:** Geen programmeer kennis vereist!
