import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { generateCardsPDF, PDFPreview } from '../components/PDFGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrintScreen = ({ navigation, route }) => {
  const [tracks, setTracks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const savedTracks = await AsyncStorage.getItem('selectedTracks');
      if (savedTracks) {
        const parsedTracks = JSON.parse(savedTracks);
        setTracks(parsedTracks);
      }
      setLoaded(true);
    } catch (error) {
      console.error('Fehler beim Laden der Tracks:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Musikdaten');
    }
  };

  const handleGeneratePDF = async () => {
    if (tracks.length === 0) {
      Alert.alert('Hinweis', 'Keine Musikdaten zum Drucken vorhanden');
      return;
    }

    setIsGenerating(true);
    try {
      await generateCardsPDF(tracks);
      Alert.alert('Erfolg', 'PDF erfolgreich generiert und gespeichert!');
    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
      Alert.alert('Fehler', 'Fehler bei der PDF-Generierung: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8a2be2" />
        <Text>Lade Daten...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Spielkarten drucken</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Anzahl der Songs: {tracks.length}</Text>
          <Text style={styles.infoText}>Karten pro A4-Seite: 9 (3x3 Grid)</Text>
          <Text style={styles.infoText}>Format: Vorderseite mit Lösung, Rückseite mit QR-Code</Text>
        </View>

        {/* Vorschau der ersten paar Karten */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Karten-Vorschau</Text>
          {tracks.slice(0, 9).map((track, index) => (
            <View key={index} style={styles.cardPreview}>
              <Text style={styles.artist}>{track.artist}</Text>
              <Text style={styles.year}>{track.year}</Text>
              <Text style={styles.titleText}>{track.title}</Text>
              <Text style={styles.qrCode}>QR: os:sp:{track.id || 'unknown'}</Text>
            </View>
          ))}
          {tracks.length === 0 && (
            <Text style={styles.noDataText}>Keine Musikdaten zum Anzeigen</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.generateButton, isGenerating && styles.disabledButton]} 
          onPress={handleGeneratePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}>Generiere...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>PDF generieren</Text>
          )}
        </TouchableOpacity>

        <Button
          title="Zurück zur Übersicht"
          onPress={() => navigation.goBack()}
          color="#8a2be2"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    color: '#8a2be2', // Neon-Violett
  },
  infoBox: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    color: '#fff',
    marginBottom: 5,
    fontSize: 16,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    color: '#00ced1', // Neon-Cyan
  },
  cardPreview: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  artist: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  year: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a2be2', // Neon-Violett
    textAlign: 'center',
    marginVertical: 5,
  },
  titleText: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  qrCode: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  noDataText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#8a2be2', // Neon-Violett
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrintScreen;