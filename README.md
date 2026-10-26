# Kleine Happen – Android-App

Beikost- und BLW-Begleiter: Tagebuch mit Milchmahlzeiten und Windeln, Wochenübersicht, Rezepte mit Wochenplan und Einkaufsliste, Regenbogen-Liste, Allergene, Meilensteine und Tipps.

.NET 10 MAUI, nur Android (Ziel: API 36). Die Oberfläche liegt in `Resources/Raw/wwwroot/` (`index.html`, `app.js`, Sprachdateien in `lang/`) und läuft in einer `HybridWebView`. Alle Daten bleiben in einer JSON-Datei im privaten App-Speicher (`Services/DataStore.cs`). Keine NuGet-Pakete außer `Microsoft.Maui.Controls`. Einziger Netzwerkzugriff ist das Laden der öffentlichen `rezepte.json` (abschaltbar), Schriften sind eingebettet.

Veröffentlichen: siehe `../PLAY-STORE.md`.

## Entwickeln

- Debug: Projekt in Visual Studio öffnen, Handy oder Emulator wählen, F5. Debug-Builds brauchen keinen Keystore.
- Seiteninhalt untersuchen: im Debug-Build `chrome://inspect` am PC öffnen.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `Resources/Raw/wwwroot/index.html` | Aufbau und Design der Oberfläche |
| `Resources/Raw/wwwroot/app.js` | Logik, Sprachwahl (`detectLang`, `t()`) |
| `Resources/Raw/wwwroot/lang/*.js` | Texte, Rezepte, Lebensmittel und Tipps für de, en, fr, es, it, nl, pl, tr |
| `Platforms/Android/Resources/values*/strings.xml` | App-Name je Sprache (Standard: „Little Bites“) |
| `Services/PhotoStore.cs` | Fotos als kleine JPEGs im privaten App-Ordner `photos/` |
| `Platforms/Android/Reminders.cs` | Allergen-Erinnerungen (AlarmManager, Benachrichtigung, Neustart) |
| `Platforms/Android/QuickActions.cs` | Schnellzugriffe beim langen Drücken auf das App-Symbol |
| `Platforms/Android/Resources/drawable/` | Symbole für Benachrichtigung und Schnellzugriffe |
| `Resources/Raw/wwwroot/fonts/` | Outfit und Poppins (SIL Open Font License) |
| `Services/AppBridge.cs` | Methoden für das JavaScript: `LoadAll`, `Save`, `Delete`, `DeleteAll`, `ShareText`, `PickText`, `OpenUrl`, `Caps`, `PickPhoto`, `SavePhoto`, `LoadPhoto`, `DeletePhoto`, `EnableReminders`, `SetReminder`, `ClearReminder`, `SetShortcuts`, `TakeQuick` |
| `Services/DataStore.cs` | JSON-Datei lesen und schreiben, mit Vorgängerversion als Reserve |
| `MainPage.xaml(.cs)` | HybridWebView, Safe Area, Zurück-Taste |
| `Platforms/Android/MainActivity.cs` | Hochformat, Systemleisten |

## Datenformat

Eine Datei `kleine-happen.json` mit Dokumenten nach Pfad:

- `days/JJJJ-MM-TT` – Mahlzeiten, Milch (`still`), Windeln, Wasser
- `foods/list` – probierte Lebensmittel und Allergene
- `prefs/main` – Name, Geburtstag, Favoriten, Einrichtung erledigt, Sprache (`lang`, leer = automatisch)
- `plan/main`, `shop/list`, `milestones/main` (mit `photo`), `myrecipes/<id>`
- `remote/recipes` – zwischengespeicherte Liste aus `rezepte.json` (nicht in der Sicherung)
- Einträge können `rx` (Reaktionen) und `photo` (Foto-ID) haben, Allergene `plan` (Tage) und `last` (zuletzt gegeben)

Die Sicherung („Sicherung teilen“) enthält dieselben Dokumente; beim Einlesen wird zusammengeführt, nicht überschrieben.

## Sprachen

Interne Werte bleiben deutsch (Mahlzeiten, Lebensmittelgruppen, Allergene, Lebensmittel aus dem Katalog), damit Tagebuch und Sicherungen in jeder Sprache gleich bleiben. Angezeigt werden die Übersetzungen aus `lang/<code>.js`.

Neue Sprache hinzufügen:

1. `lang/en.js` als `lang/<code>.js` kopieren, in der ersten Zeile `.en=` durch `.<code>=` ersetzen und alles übersetzen.
2. In `index.html` das Skript eintragen und in `app.js` den Code zu `LANGS` hinzufügen.
3. `Platforms/Android/Resources/values-<code>/strings.xml` mit `app_name` anlegen.
