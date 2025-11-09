 
import express from 'express';
import path from 'path'; // Das 'path'-Modul hilft uns, Dateipfade korrekt zu verwalten

const app = express();
const port = 8000; // Der Port, auf dem dein Server laufen soll

// WARUM: Wir müssen dem Server sagen, wo er die statischen Dateien (dein Frontend HTML, CSS, JS) findet.
// Der 'public'-Ordner ist auf derselben Ebene wie der 'backend'-Ordner, der dieses Backend-Projekt enthält.
// path.join(__dirname, '..', '..', 'public') navigiert korrekt:
// 1. __dirname: Ist der Ordner, in dem die aktuelle Datei (server.js nach Kompilierung) liegt, also 'backend/dist'.
// 2. '..': Geht eine Ebene hoch zu 'backend'.
// 3. '..': Geht eine weitere Ebene hoch zu 'project-one' (dem Hauptverzeichnis).
// 4. 'public': Fügt den Namen des Ordners hinzu, in dem deine Frontend-Dateien liegen.
const publicPath = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicPath)); // Sage Express, dass es Dateien aus diesem Ordner servieren soll

// WARUM: Wenn jemand die Hauptadresse (z.B. http://localhost:8000) aufruft,
// soll die 'index.html'-Datei deines Frontends gesendet werden.
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Starte den Server und lasse ihn auf dem definierten Port lauschen.
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
  console.log(`Statische Frontend-Dateien werden von ${publicPath} bereitgestellt.`);
});