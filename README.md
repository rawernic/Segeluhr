# Segeluhr
Starttimer für Känguru Regatten

## Segeluhr Countdown

Ein einfacher Countdown-Starttimer als statische Web-App.

### Funktionen

- Presets: **5:00**, **3:00**, **1:00**
- Eigene Minuten-/Sekunden-Eingabe
- Start, Pause/Fortsetzen, Reset
- Optische Warnung in den letzten 10 Sekunden
- Akustischer Signalton bei 0

### Start

Einfach `index.html` im Browser öffnen.

### Online (GitHub Pages)

Nach dem Merge in `main` wird die App automatisch unter folgendem Link veröffentlicht:

**https://rawernic.github.io/Segeluhr/**

> **Einmalige Einrichtung:** In den Repository-Einstellungen unter *Settings → Pages → Source* die Option **GitHub Actions** wählen.

### Release erstellen

Ein neues Release (ZIP-Download) wird automatisch erzeugt, wenn ein Versions-Tag gepusht wird:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Das ZIP-Archiv erscheint dann unter *Releases* auf GitHub.
