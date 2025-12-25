import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReviewScreen = ({ route, navigation }) => {
  const { playlistInfo, tracks } = route.params;
  const [editedTracks, setEditedTracks] = useState(tracks);
  const [editingTrackIndex, setEditingTrackIndex] = useState(null);

  const updateTrack = (index, field, value) => {
    const updatedTracks = [...editedTracks];
    updatedTracks[index] = {
      ...updatedTracks[index],
      [field]: value,
    };
    setEditedTracks(updatedTracks);
  };

  const handleGenerateCards = async () => {
    try {
      await AsyncStorage.setItem('selectedTracks', JSON.stringify(editedTracks));
      navigation.navigate('Print', { 
        playlistInfo, 
        tracks: editedTracks 
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Tracks:', error);
      Alert.alert('Fehler', 'Fehler beim Speichern der Musikdaten');
    }
  };

  const renderTrackItem = ({ item, index }) => (
    <View style={styles.trackItem}>
      <View style={styles.trackHeader}>
        <View style={styles.trackNumber}>
          <Text style={styles.trackNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editToggle}
          onPress={() => setEditingTrackIndex(editingTrackIndex === index ? null : index)}
        >
          <Text style={styles.editToggleText}>
            {editingTrackIndex === index ? '✓' : '✎'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.yearRow}>
        <Text style={styles.yearLabel}>Jahr:</Text>
        <TextInput
          style={styles.yearInput}
          value={item.originalYear ? item.originalYear.toString() : ''}
          onChangeText={(value) => updateTrack(index, 'originalYear', value ? parseInt(value) : null)}
          placeholder="----"
          placeholderTextColor="#666"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
      
      {editingTrackIndex === index && (
        <View style={styles.editSection}>
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Titel:</Text>
            <TextInput
              style={styles.editInput}
              value={item.name}
              onChangeText={(value) => updateTrack(index, 'name', value)}
              placeholder="Track Titel"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Künstler:</Text>
            <TextInput
              style={styles.editInput}
              value={item.artist}
              onChangeText={(value) => updateTrack(index, 'artist', value)}
              placeholder="Künstlername"
              placeholderTextColor="#666"
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.playlistName} numberOfLines={1}>{playlistInfo.name}</Text>
        <Text style={styles.trackCount}>{tracks.length} Tracks</Text>
      </View>
      
      <FlatList
        data={editedTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.generateButton} 
          onPress={handleGenerateCards}
          activeOpacity={0.8}
        >
          <Text style={styles.generateButtonText}>🎴 Karten generieren</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playlistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  trackCount: {
    fontSize: 13,
    color: '#8a2be2',
  },
  listContainer: {
    padding: 12,
  },
  trackItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  trackNumberText: {
    color: '#8a2be2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    color: '#999',
  },
  editToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editToggleText: {
    color: '#8a2be2',
    fontSize: 16,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearLabel: {
    color: '#999',
    fontSize: 13,
    marginRight: 8,
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#8a2be2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    width: 70,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editField: {
    marginBottom: 8,
  },
  editLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  generateButton: {
    backgroundColor: '#8a2be2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewScreen;