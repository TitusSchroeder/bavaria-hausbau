# Storyblok Headless CMS Setup-Anleitung für BAVARIA Hausbau GmbH

Diese Anleitung erklärt Schritt für Schritt, wie Sie das **Storyblok Cloud Headless CMS** kostenlos einrichten, um alle Exposé-Texte, Kaufpreise, Quadratmeter und hochauflösende Bilder/Grundrisse mit einem **visuellen Live-Preview-Editor** direkt im Browser zu verwalten.

---

## 🚀 Schritt 1: Kostenloses Storyblok-Konto erstellen
1. Registrieren Sie sich auf [https://www.storyblok.com](https://www.storyblok.com) (Kostenloser Free Tier).
2. Erstellen Sie einen neuen Space namens `bavaria-hausbau`.

---

## 📐 Schritt 2: Content-Schema (Block) `project` anlegen
1. Navigieren Sie in Storyblok im linken Menü auf **Block Library** -> **New Block**.
2. Name des Blocks: `project`
3. Fügen Sie folgende Felder hinzu:
   - `title` (Text) – z. B. *"Wohnobjekt Pulverturmstraße 58"*
   - `tagline` (Text) – z. B. *"MÜNCHEN HASENBERGL / FELDMOCHING"*
   - `lead` (Text) – z. B. *"Exklusives Neubau-Mehrfamilienhaus mit 5 Einheiten"*
   - `description` (Text / RichText) – Ausführlicher Beschreibungstext
   - `price_range` (Text) – z. B. *"884.800 € – 1.144.900 €"*
   - `sqm_range` (Text) – z. B. *"78 – 106 m²"*
   - `main_image` (Asset / Image) – Haupt-Außenansicht des Gebäudes
   - `gallery` (Multi-Asset / Asset List) – Impressionen & Grundrisse
   - `immocontact_url` (Text) – Link zum ImmoScout24-Exposé

---

## 🔑 Schritt 3: API Token generieren & in der Website hinterlegen
1. Gehen Sie in Storyblok auf **Settings** -> **Access Tokens**.
2. Kopieren Sie den **Public Preview Token**.
3. Öffnen Sie in Ihrem Projekt die Datei:
   `assets/js/storyblok-cms.js`
4. Ersetzen Sie die erste Zeile:
   ```javascript
   const STORYBLOK_TOKEN = 'HIER_IHREN_PUBLIC_TOKEN_EINFÜGEN';
   ```

---

## ⚡ Schritt 4: Visuellen Live-Preview Editor nutzen
1. Tragen Sie in Storyblok unter **Settings** -> **Visual Editor** Ihre Website-URL ein (z. B. `https://ihre-domain.de/index.html` oder lokal `http://localhost:8080`).
2. Wenn Sie nun in Storyblok unter **Content** ein Exposé bearbeiten, sehen Sie Ihre BAVARIA Hausbau Website direkt im Live-Editor!
3. Sobald Sie Texte oder Bilder in Storyblok ändern, aktualisiert sich die Website in Echtzeit.

---

## 🛡 Automatische Ausfallsicherheit (Fallback)
Sollte der Storyblok API-Token nicht gesetzt sein oder die Internetverbindung unterbrochen werden, schaltet die Website **automatisch und unterbrechungsfrei** auf die lokale `assets/data/projects.json` zurück. Die Website bleibt somit immer 100 % funktionsfähig und ausfallsicher.
