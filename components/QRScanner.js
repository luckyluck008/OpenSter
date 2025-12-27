import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ExpoCamera from 'expo-camera';

const QRScanner = ({ onScan, onCancel }) => {
  const [permission, setPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoCamera.requestCameraPermissionsAsync();
        setPermission({ granted: status === 'granted' });
      } catch (e) {
        setPermission({ granted: false });
      }
    })();
    // Reset beim Mounten
    hasScannedRef.current = false;
    return () => {
      hasScannedRef.current = true; // Verhindere Scans beim Unmounten
    };
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    // Doppelte Absicherung: State UND Ref
    if (scanned || hasScannedRef.current) return;
    
    hasScannedRef.current = true;
    setScanned(true);
    
    console.log('QR Code gescannt (einmalig):', data);
    onScan({ data });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Lade Kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kamera-Zugriff erforderlich</Text>
        <Text style={styles.subMessage}>
          Bitte erlaube den Kamera-Zugriff, um QR-Codes zu scannen.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={async () => {
          const { status } = await ExpoCamera.requestCameraPermissionsAsync();
          setPermission({ granted: status === 'granted' });
        }}>
          <Text style={styles.permissionButtonText}>Zugriff erlauben</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoCamera.Camera
        style={styles.camera}
        type={'back'}
        barCodeScannerSettings={{ barCodeTypes: ['qr'] }}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            QR-Code der Spielkarte scannen
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Erneut scannen</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </ExpoCamera.Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#8a2be2',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#8a2be2',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#8a2be2',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#8a2be2',
  },
  infoContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subMessage: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default QRScanner;
