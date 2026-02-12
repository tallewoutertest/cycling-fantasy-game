# Development Workflow

## Lokaal werken en naar GitHub pushen

### Bij elke wijziging:

```bash
# Ga naar je project folder
cd /Users/wouter/Desktop/Claude\ Code/cycling-fantasy-game

# Bekijk wat er veranderd is
git status

# Voeg alle wijzigingen toe
git add .

# Of voeg specifieke bestanden toe
git add js/config.js
git add css/style.css

# Maak een commit met een beschrijving
git commit -m "Beschrijving van je wijziging"

# Push naar GitHub
git push

# GitHub Pages wordt automatisch binnen 1-2 minuten bijgewerkt!
```

### Voorbeelden:

**Voorbeeld 1: CSS kleuren aangepast**
```bash
git add css/style.css
git commit -m "Update kleuren in dark theme"
git push
```

**Voorbeeld 2: Bug fix in auth**
```bash
git add js/auth.js
git commit -m "Fix: registratie werkt nu ook zonder email verificatie"
git push
```

**Voorbeeld 3: Meerdere bestanden**
```bash
git add .
git commit -m "Voeg nieuwe features toe voor koers filtering"
git push
```

### Snelle workflow:

```bash
# Alles in één keer (gebruik voor kleine wijzigingen)
git add . && git commit -m "Quick fix" && git push
```

## Lokale server voor testen

Voor testen VOOR je pusht:

```bash
# Start lokale server
python3 -m http.server 8000

# Test op: http://localhost:8000
# Als het werkt, dan push naar GitHub
```

## Wijzigingen bekijken voor commit

```bash
# Zie welke bestanden gewijzigd zijn
git status

# Zie de exacte wijzigingen
git diff

# Zie wijzigingen in een specifiek bestand
git diff js/auth.js
```

## Handige Git commando's

```bash
# Laatste commits bekijken
git log --oneline

# Vorige commit ongedaan maken (maar wijzigingen behouden)
git reset --soft HEAD~1

# Alle lokale wijzigingen weggooien (VOORZICHTIG!)
git reset --hard HEAD
```

## Tips

✅ **Commit vaak** - kleine wijzigingen, duidelijke messages
✅ **Test lokaal eerst** - gebruik lokale server
✅ **Push naar GitHub** - binnen 2 min live
✅ **Controleer GitHub Pages** - wacht 1-2 min na push

⚠️ **LET OP**: Push NOOIT je Supabase keys naar een public repository!
(In ons geval is het nu al gebeurd, maar voor productie zou je environment variables gebruiken)
