import React from 'react';
import { Print } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { View, Text, StyleSheet } from 'react-native';

// Funktion zur Erstellung des HTML für das PDF
const generatePDFHtml = (tracks) => {
  // Erstelle HTML für A4-Layout mit Karten
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OpenSter Spielkarten</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .page {
        width: 210mm;
        height: 297mm;
        padding: 10mm;
        box-sizing: border-box;
        position: relative;
      }
      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 5mm;
        height: 100%;
      }
      .card {
        border: 1px solid #ccc;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        background: white;
      }
      .front {
        padding: 5mm;
        text-align: center;
      }
      .back {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .artist {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2mm;
      }
      .year {
        font-size: 24px;
        font-weight: bold;
        color: #8a2be2; /* Neon-Violett */
        margin: 3mm 0;
      }
      .title {
        font-size: 12px;
      }
      .fold-line {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 0.5mm;
        background: #ddd;
        transform: translateY(-50%);
      }
      .cut-marks {
        position: absolute;
        width: 2mm;
        height: 2mm;
        border: 1px solid #999;
      }
      .cm-tl { top: 0; left: 0; }
      .cm-tr { top: 0; right: 0; }
      .cm-bl { bottom: 0; left: 0; }
      .cm-br { bottom: 0; right: 0; }
    </style>
  </head>
  <body>
  `;

  // Gruppiere Tracks in Seiten (9 Karten pro Seite)
  const tracksPerPage = 9;
  for (let i = 0; i < tracks.length; i += tracksPerPage) {
    const pageTracks = tracks.slice(i, i + tracksPerPage);
    
    html += `<div class="page">`;
    html += `<div class="card-grid">`;
    
    // Fülle die Seite mit Karten auf (auch wenn weniger als 9 Tracks vorhanden sind)
    for (let j = 0; j < tracksPerPage; j++) {
      if (j < pageTracks.length) {
        const track = pageTracks[j];
        // Vorderseite mit Interpret, Jahr und Titel
        html += `
        <div class="card">
          <div class="front">
            <div class="artist">${track.artist}</div>
            <div class="year">${track.year}</div>
            <div class="title">${track.title}</div>
          </div>
          <div class="fold-line"></div>
        </div>
        `;
      } else {
        // Leere Karte wenn keine Tracks mehr vorhanden
        html += `<div class="card"></div>`;
      }
    }
    
    html += `</div></div>`;
  }

  html += `
  </body>
  </html>
  `;

  return html;
};

// Funktion zur Erstellung der Rückseite mit QR-Codes
const generateBackPDFHtml = (tracks) => {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OpenSter Spielkarten - Rückseite</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .page {
        width: 210mm;
        height: 297mm;
        padding: 10mm;
        box-sizing: border-box;
        position: relative;
      }
      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 5mm;
        height: 100%;
      }
      .card {
        border: 1px solid #ccc;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        background: white;
      }
      .qr-placeholder {
        text-align: center;
        font-size: 10px;
        color: #666;
      }
      .fold-line {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 0.5mm;
        background: #ddd;
        transform: translateY(-50%);
      }
    </style>
  </head>
  <body>
  `;

  const tracksPerPage = 9;
  for (let i = 0; i < tracks.length; i += tracksPerPage) {
    const pageTracks = tracks.slice(i, i + tracksPerPage);
    
    html += `<div class="page">`;
    html += `<div class="card-grid">`;
    
    for (let j = 0; j < tracksPerPage; j++) {
      if (j < pageTracks.length) {
        const track = pageTracks[j];
        html += `
        <div class="card">
          <div class="qr-placeholder">
            QR: os:sp:${track.id || 'unknown'}
          </div>
          <div class="fold-line"></div>
        </div>
        `;
      } else {
        html += `<div class="card"></div>`;
      }
    }
    
    html += `</div></div>`;
  }

  html += `
  </body>
  </html>
  `;

  return html;
};

export const generateCardsPDF = async (tracks) => {
  try {
    // Generiere HTML für Vorderseite
    const frontHtml = generatePDFHtml(tracks);
    
    // Erstelle PDF aus HTML
    const frontResult = await Print.printToFileAsync({
      html: frontHtml,
      width: 210 * 3.78, // A4 Breite in Pixel (210mm * 3.78 px/mm bei ~288 DPI)
      height: 297 * 3.78, // A4 Höhe in Pixel
    });

    // Generiere HTML für Rückseite
    const backHtml = generateBackPDFHtml(tracks);
    
    // Erstelle PDF für Rückseite
    const backResult = await Print.printToFileAsync({
      html: backHtml,
      width: 210 * 3.78,
      height: 297 * 3.78,
    });

    // In einer echten Implementierung würden wir hier beide PDFs kombinieren
    // oder separat zur Verfügung stellen
    
    // Teile das PDF
    await shareAsync(frontResult.uri);
    
    return { frontResult, backResult };
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    throw error;
  }
};

// Komponente für die PDF-Vorschau
export const PDFPreview = ({ tracks }) => {
  return (
    <View style={styles.container}>
      <Text>PDF-Vorschau ({tracks.length} Tracks)</Text>
      {/* In einer echten Implementierung würde hier eine Vorschau angezeigt */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});