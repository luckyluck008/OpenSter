import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'qrcode';

// QR Code als SVG generieren (funktioniert ohne Canvas in React Native)
const generateQRSVG = async (data) => {
  try {
    const svgString = await QRCode.toString(data, {
      type: 'svg',
      width: 80,
      margin: 1,
      color: {
        dark: '#8a2be2',
        light: '#ffffff'
      }
    });
    return svgString;
  } catch (error) {
    console.error('QR Code Fehler:', error);
    return null;
  }
};

// HTML escape helper
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Generiere komplettes PDF mit Vorder- und Rückseiten
export const generateCardsPDF = async (tracks) => {
  try {
    // Unterstützung für verschiedene Track-Formate
    const normalizedTracks = tracks.map(track => {
      // YouTube Format
      if (track.youtubeId || track.type === 'youtube' || (track.id && track.id.length === 11)) {
        const videoId = track.youtubeId || track.id;
        return {
          ...track,
          id: videoId,
          name: track.name || track.title,
          artist: track.artist || 'YouTube',
          originalYear: track.originalYear || track.year,
          qrUrl: `https://youtube.com/watch?v=${videoId}`,
          type: 'youtube'
        };
      }
      // Legacy Spotify Format (falls noch vorhanden)
      if (track.spotifyId || (track.id && track.id.length === 22)) {
        return {
          ...track,
          qrUrl: `https://open.spotify.com/track/${track.id}`,
          type: 'spotify'
        };
      }
      // Fallback
      return {
        ...track,
        qrUrl: `https://youtube.com/watch?v=${track.id}`,
        type: 'youtube'
      };
    });

    // Generiere QR-Codes parallel für alle Tracks
    const qrCodes = await Promise.all(
      normalizedTracks.map(track => generateQRSVG(track.qrUrl))
    );

    const tracksPerPage = 12;
    const totalPages = Math.ceil(normalizedTracks.length / tracksPerPage);
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 10mm; }
        html, body { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; }
        .page {
          page-break-after: always;
          padding: 10mm;
        }
        .page:last-child { page-break-after: avoid; }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, 50mm);
          grid-template-rows: repeat(4, 50mm);
          gap: 3mm;
        }
        .card-front {
          width: 50mm;
          height: 50mm;
          border: 1.5pt solid #8a2be2;
          border-radius: 3mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          padding: 2mm;
          text-align: center;
          overflow: hidden;
        }
        .card-back {
          width: 50mm;
          height: 50mm;
          border: 1.5pt solid #8a2be2;
          border-radius: 3mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: white;
          padding: 2mm;
          overflow: hidden;
        }
        .card-empty {
          width: 50mm;
          height: 50mm;
          border: 0.5pt dashed #ccc;
          background: #f9f9f9;
          border-radius: 3mm;
        }
        .artist {
          font-size: 11pt;
          font-weight: bold;
          color: #000;
          margin-bottom: 1mm;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          max-height: 14mm;
          overflow: hidden;
          line-height: 1.2;
        }
        .year {
          font-size: 20pt;
          font-weight: bold;
          color: #8a2be2;
          margin: 2mm 0;
        }
        .title {
          font-size: 10pt;
          color: #000;
          max-height: 14mm;
          overflow: hidden;
          line-height: 1.2;
          font-weight: 600;
        }
        .qr-container {
          width: 22mm;
          height: 22mm;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .qr-container svg {
          width: 22mm !important;
          height: 22mm !important;
        }
        .track-id {
          font-size: 4pt;
          color: #999;
          margin-top: 2mm;
          word-break: break-all;
          max-width: 45mm;
          text-align: center;
        }
        .logo {
          font-size: 9pt;
          font-weight: bold;
          color: #8a2be2;
          margin-top: 2mm;
        }
        .platform-icon {
          font-size: 12pt;
          margin-bottom: 1mm;
        }
        .grid-back {
          direction: rtl;
        }
        .grid-back > * {
          direction: ltr;
        }
      </style>
    </head>
    <body>
    `;

    // Generiere Seiten: immer Vorderseite, dann Rückseite
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIdx = pageNum * tracksPerPage;
      const pageTracks = normalizedTracks.slice(startIdx, startIdx + tracksPerPage);
      const pageQRs = qrCodes.slice(startIdx, startIdx + tracksPerPage);
      
      // === VORDERSEITE (Lösung) ===
      html += `<div class="page">`;
      html += `<div class="card-grid">`;
      
      for (let j = 0; j < tracksPerPage; j++) {
        if (j < pageTracks.length) {
          const track = pageTracks[j];
          const year = track.originalYear || track.year || '????';
          const title = track.name || track.title || 'Unbekannt';
          const artist = track.artist || 'YouTube';
          
          html += `
          <div class="card-front">
            <div class="artist">${escapeHtml(artist)}</div>
            <div class="year">${year}</div>
            <div class="title">${escapeHtml(title)}</div>
          </div>
          `;
        } else {
          html += `<div class="card-empty"></div>`;
        }
      }
      
      html += `</div></div>`;
      
      // === RÜCKSEITE (QR-Codes) - gespiegelt ===
      html += `<div class="page">`;
      html += `<div class="card-grid grid-back">`;
      
      for (let j = 0; j < tracksPerPage; j++) {
        if (j < pageTracks.length) {
          const track = pageTracks[j];
          const qrSvg = pageQRs[j];
          const platformIcon = track.type === 'youtube' ? '▶️' : '🎵';
          
          html += `
          <div class="card-back">
            <div class="platform-icon">${platformIcon}</div>
            <div class="qr-container">${qrSvg || '<div style="width:25mm;height:25mm;background:#eee;border-radius:2mm;"></div>'}</div>
            <div class="track-id">${track.id || ''}</div>
            <div class="logo">OpenSter</div>
          </div>
          `;
        } else {
          html += `<div class="card-empty"></div>`;
        }
      }
      
      html += `</div></div>`;
    }

    html += `</body></html>`;
    
    // Erstelle PDF
    const result = await Print.printToFileAsync({
      html: html,
      base64: false
    });

    // Teile das PDF
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'OpenSter Spielkarten PDF',
      UTI: 'com.adobe.pdf'
    });
    
    return result;
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
