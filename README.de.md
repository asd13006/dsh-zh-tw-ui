# dsh-multi-lang-ui

**Sprachen:** [English](README.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md)

Ein DSH-Plugin, das der Web-UI von [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **mehrere Sprachen** als Sprachoptionen hinzufügt — **繁體中文, 日本語, 한국어, Français, Deutsch, Español**. Bekannte UI-Strings verwenden handgepflegte Übersetzungen (jede Sprache wurde auf Basis der englischen Referenz übersetzt); beliebige *neue / aktualisierte / Drittanbieter*-Strings fallen auf Englisch zurück (bzw. für 繁體中文 auf eine Laufzeit-Konvertierung von Vereinfacht → Traditionell) — dadurch werden Upstream-UI-Updates und andere Plugins abgedeckt, **ohne jede Sprache neu zu übersetzen**.

## Funktionen

- Fügt dem Menü „Einstellungen → Allgemein → Sprache" **6 Sprachen** hinzu (zusätzlich zum integrierten 中文 / English): 繁體中文, 日本語, 한국어, Français, Deutsch, Español.
- **Handgepflegte Übersetzungen pro Sprache**: jeder offizielle Locale-Namespace wird String für String auf Basis der **englischen Referenz** übersetzt (700+ Strings pro Sprache).
- **Fallback für unübersetzte Strings**: von Upstream oder Drittanbieter-Plugins hinzugefügte Strings — 繁體中文 verwendet eine integrierte Zeichentabelle Vereinfacht → Traditionell (720+ Zeichen), die zur Laufzeit konvertiert; die anderen Sprachen fallen auf Englisch zurück (die offiziellen `en`-Wörterbücher sind für jeden Namespace vollständig), sodass kein verstümmelter oder fehlender Text erscheint.
- **Fallback-Konvertierung auf DOM-Ebene (nur zh-TW)**: Nicht-Wörterbuch-Inhalte (z. B. Plugin-Markt-Beschreibungen) werden im zh-TW-Modus per MutationObserver von Vereinfacht nach Traditionell konvertiert (Eingabefelder, Codeblöcke und andere Nutzerinhalte sind immer ausgenommen).
- **Persistenz**: Die Sprachwahl wird im Browser-`localStorage` gespeichert und übersteht Neuladungen.
- **Keine Eingriffe**: ein reines Client-Plugin — keine Upstream-Pakete werden verändert; es degradiert still, wenn der Locale-Dienst nicht verfügbar ist, ohne andere Plugins zu beeinträchtigen.

## Installation

**Empfohlen: Installation von GitHub (diesen Link einem Agenten geben oder selbst ausführen)**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-multi-lang-ui
```

Oder lassen Sie einen Agenten die Installation durchführen: Fügen Sie diesen Repository-Link in DSH ein und bitten Sie den Agenten, den obigen Befehl auszuführen.

Nach der Installation starten Sie `dsh web` neu und wählen Ihre Sprache unter „Einstellungen → Allgemein → Sprache".

**Entfernen (wichtig)**: verwenden Sie immer `dsh plugin remove` — es bereinigt die Bundle-Liste des Profils; das manuelle Löschen des Pakets kann hängende Verweise hinterlassen, die den Start von DSH verhindern:

```bash
dsh plugin --profile web remove dsh-multi-lang-ui
```

**npm install (sobald veröffentlicht)**:

```bash
dsh plugin --profile web add dsh-multi-lang-ui
```

## Funktionsweise

```
locale translate(ns, key)
        │
        ├─ active is one of our languages ?
        │     ├─ curated translation exists (DICTS) ?  → return it
        │     └─ missing (new strings / third-party plugins)
        │           ├─ zh-TW  → convert the zh value via the char table
        │           └─ others → fall back to the en value
        └─ other languages → handled by dsh-client-locale as usual
```

Beim Start führt das Plugin Folgendes aus:

1. Registriert die sprachspezifischen Wörterbücher für jeden Locale-Namespace;
2. Umschließt `locale.translate` (kuratiert → Fallback) und `locale.setLocale` (akzeptiert unsere Sprach-IDs, schreibt `localStorage`);
3. Fügt alle unsere Sprachen zur Sprachoptionsliste hinzu (patcht die Locale-Snapshot und feuert `locale/change`, um die Einstellungszeile zu aktualisieren);
4. Umschließt `locale.adopt` — die Host-Präferenz des integrierten Locales wird asynchron geladen und setzt `active` auf `locale.preference ?? Browser-Sprache` zurück; ist die Präferenz des Nutzers eine unserer Sprachen, wird sie erneut durchgesetzt;
5. Startet die Fallback-Konvertierung auf DOM-Ebene (MutationObserver) im zh-TW-Modus für Nicht-Wörterbuch-Inhalte und stellt sie beim Wegwechseln wieder her.

## Muss ich nach Upstream-Updates neu übersetzen?

**Nein.** Drei Schutzebenen:

1. Von Upstream hinzugefügte Strings → werden zur Laufzeit durch den Fallback-Mechanismus abgedeckt;
2. Von Upstream geänderte Strings → die kuratierten Wörterbücher behalten die alten Werte, während neue/Drittanbieter-Strings weiterhin automatisch zurückfallen; regenerieren Sie die kuratierten Wörterbücher, wenn Sie eine vollständige Synchronisierung wünschen (unten);
3. Zur vollständigen Synchronisierung der kuratierten Übersetzungen: den Regenerationsablauf einmal ausführen — keine manuelle Arbeit pro String.

### Regenerieren der kuratierten Wörterbücher (optional)

```bash
node scripts/extract.mjs <path-to-node_modules/@deepseek-ai>   # 1. extract the latest zh/en dicts into src/zh-src/ and src/en/
# 2. translate src/en/*.json → src/<lang>/*.json (LLM batch OK; keys and placeholders must match)
node scripts/assemble.mjs                                     # 3. regenerate lib/client.js
```

### Prüfung auf nicht abgedeckte vereinfachte Zeichen (nach Upstream-/Drittanbieter-Updates)

```bash
node scripts/collect-chars.mjs [third-party-client.js...]   # collect all Simplified characters in use
node scripts/check-missing-chars.mjs                        # list Simplified-only characters missing from the char table
```

Wenn welche gemeldet werden, fügen Sie die Zuordnung `"简字": "繁字"` zu `src/zh-tw-parts/chars.json` hinzu und führen Sie dann `node scripts/assemble.mjs` aus.

## Repository-Aufbau

```
dsh-multi-lang-ui/
├── package.json              # plugin manifest (dsh.client.inject / bundle.patch)
├── index.mjs                 # Host side: no-op entry (pure client plugin)
├── cordis.patch.yml          # Host plugin entry
├── lib/client.js             # generated browser bundle (do not edit by hand)
├── src/
│   ├── zh-src/               # extracted zh (Simplified Chinese) dicts (generated data)
│   ├── en/                   # extracted en dicts (translation baseline for all languages)
│   ├── zh-tw/ ja/ ko/ fr/ de/ es/   # per-language curated translations (quality baseline)
│   ├── zh-tw-parts/
│   │   ├── chars.json        # Simplified→Traditional char table (zh-TW runtime fallback)
│   │   ├── simplified-only.txt  # Simplified-only character checklist (maintenance)
│   │   └── collected-chars.txt  # collect-chars output
│   └── TERMINOLOGY.md        # terminology reference (used when polishing translations)
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright end-to-end verification scripts
```

## Bekannte Einschränkungen

- Vereinfachte Zeichen mit mehreren Bedeutungen (z. B. 复 in 复制/恢复/复杂 bildet auf unterschiedliche traditionelle Formen ab) verwenden eine einzige Zuordnung (復); die kuratierten Wörterbücher decken die Haupt-Strings ab, aber einige neue Strings werden möglicherweise unvollkommen konvertiert.
- Die Sprachpräferenz liegt im Browser-`localStorage` (pro Browser); auch das integrierte Locale ist für entfernte Browser nicht persistent — das ist ein konsistentes Design.
- Vereinfachte Zeichen, die nicht in der Zeichentabelle stehen, werden unverändert durchgereicht — führen Sie regelmäßig `check-missing-chars.mjs` aus und erweitern Sie die Tabelle.

## Sicherheit & Datenschutz

- **Kein Netzwerkverkehr**: das Plugin tätigt niemals eine Netzwerkanfrage (kein fetch / WebSocket / Telemetrie); die einzige externe URL ist der Dokumentationslink in dieser README.
- **Keine Datenerfassung**: keine Telemetrie, keine Analysen, kein Fehlerreporting; die einzigen persistierten Daten sind `localStorage["dsh-multi-lang-ui.preference"]` (eine Sprach-ID wie `"ja"`).
- **Kein Zugriff auf sensible Daten**: keine Anmeldedaten / Tokens / Sitzungsaufzeichnungen / Dateisystemzugriff; die Host-Seite (`index.mjs`) ist ein No-op.
- **Nur lesende DOM-Konvertierung**: es werden ausschließlich Textknoten umgeschrieben (kein innerHTML, keine Injektion); Eingabefelder, textarea, contenteditable und Codeblöcke (pre/code) sind immer ausgenommen, sodass Tippen und Code nie beeinträchtigt werden. Angezeigte Sitzungsnachrichten werden konvertiert (nur lesender Anzeigeeffekt; gespeicherte Daten bleiben unverändert) und beim Zurückschalten wiederhergestellt.
- **Null Lieferkettenrisiko**: `dependencies` ist leer — die Installation lädt nichts Neues herunter; das Client-Bundle ist vollständig eigenständig (null `require`); Peer-Abhängigkeiten sind offizielle Pakete, die bereits in DSH vorhanden sind.

## FAQ

**F: Warum zeigt dshmarket die Beschreibung meines Plugins nicht an?**
A: Beschreibung und Kategorie des Marktes stammen aus dem kuratierten „awesome-dsh-plugin"-Registry (`data/plugins/<owner>__<repo>.yml`), nicht aus dem lokalen package.json. Sobald der Eintrag in dieses Registry aufgenommen ist, wird er erscheinen.

**F: Muss ich auf npm veröffentlichen, um eine Versionsnummer im Markt zu erhalten?**
A: Nein. Die Version eines installierten Plugins wird aus seinem lokalen `node_modules`-package.json gelesen (eine GitHub-Installation zeigt bereits `v0.1.0` an). Die npm-Veröffentlichung wirkt sich nur auf die npm-Suche und reine npm-Installationen aus.

**F: Muss ich das Plugin aktualisieren, wenn Upstream neue Strings hinzufügt?**
A: Nein — der Laufzeit-Fallback deckt neue Strings sofort ab, einschließlich der vereinfachten chinesischen Strings von Drittanbieter-Plugins. Regenerieren Sie die kuratierten Wörterbücher mit `scripts/`, wenn Sie eine Synchronisierung in bester Qualität wünschen.

**F: DSH startet nach dem Entfernen des Plugins nicht?**
A: Entfernen Sie immer über `dsh plugin --profile web remove dsh-multi-lang-ui` (es bereinigt die Bundle-Liste des Profils). Das manuelle Löschen des Pakets kann hängende Verweise hinterlassen, die den Start verhindern.

## Lizenz

MIT
