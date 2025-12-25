import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Button, TouchableOpacity } from 'react-native';

// Mock-Komponente für den QR-Scanner, da die Installation von expo-camera Probleme bereitet
const QRScanner = ({ onScan, onCancel }) => {
  const [scanning, setScanning] = useState(true);
  const [mockCameraActive, setMockCameraActive] = useState(false);

  // Simuliere das Scannen nach einer Verzögerung
  useEffect(() => {
    if (scanning) {
      const scanTimeout = setTimeout(() => {
        // Simuliere das Finden eines QR-Codes
        const mockQRCode = 'os:sp:4uLU6hMCjMI75M1A2tKUQ3'; // Beispiel Spotify Track ID
        onScan({ data: mockQRCode });
      }, 3000); // Scanning nach 3 Sekunden

      return () => clearTimeout(scanTimeout);
    }
  }, [scanning]);

  const handleCancel = () => {
    setScanning(false);
    onCancel();
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <View style={styles.scanArea}>
          <Text style={styles.scanText}>QR-Code scannen</Text>
          <View style={styles.scanFrame} />
          {mockCameraActive && <View style={styles.cameraMock} />}
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Halten Sie die Kamera über den QR-Code auf der Rückseite der Spielkarte.
        </Text>
        <Text style={styles.infoText}>
          Der Code sollte mit "os:sp:" beginnen.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanArea: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ced1', // Neon-Cyan
    borderStyle: 'dashed',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 'auto',
  },
  cameraMock: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoSection: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4b5c', // Rot
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRScanner;