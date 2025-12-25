import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  FlatList,
} from 'react-native';
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
    // Speichere die bearbeiteten Tracks in AsyncStorage
    try {
      await AsyncStorage.setItem('selectedTracks', JSON.stringify(editedTracks));
      // Navigiere zum Druckbildschirm
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
        <Text style={styles.trackNumber}>{index + 1}.</Text>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{item.name}</Text>
          <Text style={styles.trackArtist}>{item.artist}</Text>
        </View>
      </View>
      
      <View style={styles.trackDetails}>
        <Text style={styles.detailLabel}>Original Year:</Text>
        <TextInput
          style={styles.yearInput}
          value={item.originalYear ? item.originalYear.toString() : ''}
          onChangeText={(value) => updateTrack(index, 'originalYear', value ? parseInt(value) : null)}
          placeholder="Year"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
      
      <View style={styles.trackEdit}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setEditingTrackIndex(editingTrackIndex === index ? null : index);
          }}
        >
          <Text style={styles.editButtonText}>
            {editingTrackIndex === index ? 'Hide' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {editingTrackIndex === index && (
        <View style={styles.editSection}>
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Title:</Text>
            <TextInput
              style={styles.editInput}
              value={item.name}
              onChangeText={(value) => updateTrack(index, 'name', value)}
              placeholder="Track title"
            />
          </View>
          
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Artist:</Text>
            <TextInput
              style={styles.editInput}
              value={item.artist}
              onChangeText={(value) => updateTrack(index, 'artist', value)}
              placeholder="Artist name"
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{playlistInfo.name}</Text>
        <Text style={styles.subtitle}>by {playlistInfo.owner}</Text>
        <Text style={styles.trackCount}>{tracks.length} tracks</Text>
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
        >
          <Text style={styles.generateButtonText}>Generate Cards</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    padding: 20,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9d1d9',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b949e',
    marginBottom: 5,
  },
  trackCount: {
    fontSize: 14,
    color: '#58a6ff',
  },
  listContainer: {
    padding: 10,
  },
  trackItem: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  trackNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58a6ff',
    width: 25,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9d1d9',
    marginBottom: 5,
  },
  trackArtist: {
    fontSize: 14,
    color: '#8b949e',
  },
  trackDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#c9d1d9',
    marginRight: 10,
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    padding: 8,
    borderRadius: 4,
    width: 80,
    fontSize: 14,
  },
  trackEdit: {
    alignItems: 'flex-end',
  },
  editButton: {
    backgroundColor: '#238636',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  editSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  editField: {
    marginBottom: 10,
  },
  editLabel: {
    fontSize: 14,
    color: '#c9d1d9',
    marginBottom: 5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  generateButton: {
    backgroundColor: '#58a6ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#0d1117',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReviewScreen;