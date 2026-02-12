# UCI Renners Importeren

Als je alle UCI WorldTeam renners wilt importeren, zijn er verschillende manieren:

## Optie 1: Handmatig via ProCyclingStats (Aanbevolen)

1. Ga naar [ProCyclingStats Teams](https://www.procyclingstats.com/teams.php)
2. Klik op elk WorldTeam
3. Kopieer de renners lijst
4. Format naar: `Voornaam Achternaam, Team, Nationaliteit`
5. Gebruik Bulk Import in admin panel

### Voorbeeld workflow:
```
1. Ga naar https://www.procyclingstats.com/team/uae-team-emirates-2026
2. Kopieer renners lijst
3. Format in Excel/Google Sheets:

   Tadej Pogačar, UAE Team Emirates, SLO
   Juan Ayuso, UAE Team Emirates, ESP
   Pavel Sivakov, UAE Team Emirates, FRA
   ...

4. Plak in admin panel > Renners > Bulk Import
```

## Optie 2: Bestaande Lijst Gebruiken

In dit project zit al `example-riders.txt` met 50 top renners voor klassiekers!

**Te gebruiken:**
1. Open `example-riders.txt`
2. Kopieer de inhoud
3. Admin panel > Renners > Bulk Import
4. Plak en klik "Importeren"

## Optie 3: Eigen Lijst Maken

Maak een text bestand met dit format (1 renner per regel):
```
Voornaam Achternaam, Team, Nationaliteit
```

**Voorbeeld:**
```
Wout van Aert, Visma-Lease a Bike, BEL
Mathieu van der Poel, Alpecin-Deceuninck, NED
Tadej Pogačar, UAE Team Emirates, SLO
Jonas Vingegaard, Visma-Lease a Bike, DEN
Remco Evenepoel, Soudal Quick-Step, BEL
```

**Tips:**
- Nationaliteit is 3-letter code (BEL, NED, FRA, etc.)
- Team naam moet exact zijn voor consistency
- Je kunt maximaal 1000 renners per import doen

## Optie 4: Van je Klassiekers Project

Je hebt al een scraper in het `klassiekers-2026` project! Je kunt de data daaruit gebruiken:

```bash
# Ga naar het klassiekers project
cd ../klassiekers-2026

# Run de scraper (als je Python hebt)
python scraper.py

# Dit geeft je startlijsten per koers
# Je kunt deze renners kopiëren en importeren
```

## UCI WorldTeams 2026

Hier zijn de huidige UCI WorldTeams waarvan je renners kunt importeren:

1. UAE Team Emirates
2. Visma-Lease a Bike
3. INEOS Grenadiers
4. Soudal Quick-Step
5. Alpecin-Deceuninck
6. Bahrain Victorious
7. Movistar Team
8. Lidl-Trek
9. Groupama-FDJ
10. Intermarché-Wanty
11. Cofidis
12. EF Education-EasyPost
13. AG2R Citroën Team
14. Team Jayco AlUla
15. Astana Qazaqstan Team
16. Israel-Premier Tech
17. Lotto Dstny
18. dsm-firmenich PostNL

## Bulk Format Voorbeelden

### Minimaal (alleen naam en team):
```
Wout van Aert, Visma-Lease a Bike
Mathieu van der Poel, Alpecin-Deceuninck
```

### Volledig (met nationaliteit):
```
Wout van Aert, Visma-Lease a Bike, BEL
Mathieu van der Poel, Alpecin-Deceuninck, NED
```

### Met UCI ID (optioneel):
Dit kan NIET via bulk import, alleen handmatig per renner.

## Tips voor Grote Imports

**Voor een volledig UCI WorldTeam seizoen:**

1. Start met de top 50-100 favorieten voor klassiekers (use `example-riders.txt`)
2. Voeg specifieke renners toe per koers als je die koers configureert
3. Je hoeft niet ALLE WorldTour renners toe te voegen
4. Focus op renners die relevant zijn voor jouw koersen

**Vuistregel:**
- Sprint koersen: ~30-40 sprinters/leadouts
- Klassiekers: ~80-100 klassieke renners
- Grote ronden: ~150-200 allrounders

## Automatische Import (Toekomstige Feature)

In een toekomstige update zal er een automatische import zijn van:
- [ ] ProCyclingStats API integratie
- [ ] UCI ranking import
- [ ] Startlijsten per koers
- [ ] Automatische updates

Voor nu: handmatig importeren is het snelst en meest betrouwbaar!

## Troubleshooting

**Foutmelding: "Duplicate key value violates unique constraint"**
- Deze renner bestaat al in de database
- Skip deze renner of verwijder duplicaten uit je import lijst

**Foutmelding: "violates foreign key constraint"**
- Check of alle verplichte velden ingevuld zijn
- Minimaal: voornaam en achternaam vereist

**Import lijkt niet te werken**
- Check of je het juiste formaat gebruikt (komma's tussen velden)
- Maximaal 3 velden: Naam, Team, Nationaliteit
- Naam moet minimaal voornaam + achternaam bevatten

## Handige Shortcuts

**Renners snel toevoegen voor een specifieke koers:**

1. Ga naar ProCyclingStats startlijst van de koers
2. Kopieer de renners namen
3. Format in Excel met team en nationaliteit
4. Bulk import in admin panel
5. Ga naar de koers configuratie
6. Voeg dezelfde renners toe als "Deelnemers"

**Voor Head-to-Head keuzes:**
- Kies 2 renners met vergelijkbare vorm/palmares
- Voorbeelden: Van Aert vs Van der Poel, Pogačar vs Vingegaard
- Of 2 ploeggenoten die beide kans maken

**Voor Top 10 ranking:**
- Kies een mix van favorieten (1-3), outsiders (4-7), long shots (8-10)
- Varieer in specialismen (sprinters vs klimmers vs klassiekers)
- Maak het interessant en uitdagend!
