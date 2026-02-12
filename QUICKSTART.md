# 🚀 Quick Start Gids

Volg deze stappen om in 15 minuten je fantasy game live te hebben!

## Stap 1: Supabase Setup (5 min)

1. Ga naar [supabase.com](https://supabase.com) en maak een account
2. Klik "New Project"
3. Vul in:
   - Naam: `cycling-fantasy`
   - Wachtwoord: kies een sterk wachtwoord
   - Region: `West EU (Frankfurt)`
4. Wacht 2 minuten tot het project klaar is

## Stap 2: Database Installeren (2 min)

1. Klik in Supabase op "SQL Editor" (linker menu)
2. Open `database-setup.sql` in een text editor
3. Kopieer de hele inhoud
4. Plak in Supabase SQL Editor
5. Klik "Run" ✓

## Stap 3: API Keys Kopiëren (1 min)

1. Klik op het tandwiel icoon ⚙️ linksonder ("Project Settings")
2. Klik "API" in het menu
3. Kopieer deze 2 waarden:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon key**: `eyJhbG...` (lange string)
4. Open `js/config.js`
5. Vervang `YOUR_SUPABASE_URL` met jouw URL
6. Vervang `YOUR_SUPABASE_ANON_KEY` met jouw anon key
7. Sla op

## Stap 4: Test Lokaal (2 min)

1. Open `index.html` in je browser (dubbelklik)
2. Klik "Registreren"
3. Maak een account aan
4. ✓ Je bent ingelogd!

## Stap 5: Jezelf Admin Maken (2 min)

1. Ga terug naar Supabase Dashboard
2. Klik "Table Editor" (linker menu)
3. Selecteer tabel: `profiles`
4. Zoek je email
5. Dubbelklik op het vakje onder `is_admin`
6. Vink het aan ✓
7. Ververs je browser
8. Ga naar `admin/index.html`
9. ✓ Je hebt nu toegang tot het admin panel!

## Stap 6: Eerste Data Toevoegen (3 min)

### Renners Importeren
1. In admin panel → tab "Renners"
2. Klik "Bulk Import"
3. Open `example-riders.txt`
4. Kopieer de inhoud
5. Plak in het tekstveld
6. Klik "Importeren"
7. ✓ 50 renners toegevoegd!

### Eerste Koers Maken
1. Tab "Koersen"
2. Klik "Nieuwe Koers"
3. Vul in:
   - Naam: `Omloop Het Nieuwsblad 2026`
   - Datum: `2026-03-01`
   - Deadline: `2026-03-01T12:00` (12:00 op de dag zelf)
4. Klik "Koers Aanmaken"
5. Klik "Configureren"

### Koers Configureren
**Tab Deelnemers:**
- Zoek en voeg 20-30 renners toe die aan de koers meedoen

**Tab Top 10 Config:**
- Voeg 10 favorieten toe voor de ranking vraag
- Sleep ze in volgorde van favorieten status

**Tab Head-to-Head:**
- Kies 2 renners, bijv: "Wout van Aert" vs "Mathieu van der Poel"
- Klik "Opslaan"

✓ Eerste koers is klaar!

## Stap 7: Deployment (Optioneel)

### Optie A: Lokaal Testen
- Open gewoon `index.html` in je browser
- Deel de bestanden via OneDrive/Dropbox met vrienden
- Iedereen opent `index.html` lokaal

### Optie B: Online Hosting (GitHub Pages)
1. Maak een GitHub account op [github.com](https://github.com)
2. Download [GitHub Desktop](https://desktop.github.com)
3. Open GitHub Desktop
4. "Add Local Repository" → selecteer de `cycling-fantasy-game` folder
5. "Publish repository" → geef het een naam
6. Ga naar github.com → je repository → Settings → Pages
7. Source: "main branch" → Save
8. Na 2 minuten live op: `https://jouwusername.github.io/cycling-fantasy-game/`

## Klaar! 🎉

Je vrienden kunnen nu:
1. Naar je URL gaan (of lokale index.html openen)
2. Account aanmaken
3. Voorspellingen invullen
4. Plezier hebben!

## Snelle Tips

✅ **Deadlines**: Stel de deadline altijd 1 uur voor de start in
✅ **Top 10**: Kies een mix van favorieten, outsiders en langeafstandskandidaten
✅ **H2H**: Kies twee renners die ongeveer even sterk zijn voor de koers
✅ **Updates**: Renners kunnen altijd toegevoegd/verwijderd worden
✅ **Voorspellingen**: Spelers kunnen hun voorspelling aanpassen tot de deadline

## Hulp Nodig?

- Controleer je Supabase API keys in `js/config.js`
- Open de browser console (F12) voor errors
- Check de volledige `README.md` voor meer details

**Veel succes! 🚴**
