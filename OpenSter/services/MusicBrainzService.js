import axios from 'axios';

class MusicBrainzService {
  constructor() {
    this.baseURL = 'https://musicbrainz.org/ws/2';
    this.headers = {
      'User-Agent': 'OpenSter/1.0 (contact@openster.app)'
    };
  }

  // Search for a track by artist and title to get the earliest release date
  async searchTrack(artist, title) {
    try {
      // Encode the search parameters
      const encodedArtist = encodeURIComponent(artist);
      const encodedTitle = encodeURIComponent(title);
      
      // Construct the search query
      const query = `artist:"${encodedArtist}" AND recording:"${encodedTitle}"`;
      const searchUrl = `${this.baseURL}/recording/?query=${query}&fmt=json&limit=5`;
      
      const response = await axios.get(searchUrl, { headers: this.headers });
      
      if (response.data && response.data.recordings && response.data.recordings.length > 0) {
        // Find the recording with the earliest release date
        let earliestRecording = response.data.recordings[0];
        let earliestDate = this.parseDate(earliestRecording.first_release_date);
        
        for (const recording of response.data.recordings) {
          const releaseDate = this.parseDate(recording.first_release_date);
          if (releaseDate && (!earliestDate || releaseDate < earliestDate)) {
            earliestDate = releaseDate;
            earliestRecording = recording;
          }
        }
        
        return {
          id: earliestRecording.id,
          title: earliestRecording.title,
          artist: earliestRecording.artist_credit[0].name,
          releaseDate: earliestRecording.first_release_date,
          year: earliestDate ? earliestDate.getFullYear() : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error searching track on MusicBrainz:', error);
      throw error;
    }
  }

  // Search for releases of a specific recording to get more accurate release dates
  async getRecordingReleases(recordingId) {
    try {
      const searchUrl = `${this.baseURL}/release/?query=recording:"${recordingId}"&fmt=json&limit=10`;
      
      const response = await axios.get(searchUrl, { headers: this.headers });
      
      if (response.data && response.data.releases && response.data.releases.length > 0) {
        // Find the earliest release date among all releases
        let earliestRelease = response.data.releases[0];
        let earliestDate = this.parseDate(earliestRelease.date);
        
        for (const release of response.data.releases) {
          const releaseDate = this.parseDate(release.date);
          if (releaseDate && (!earliestDate || releaseDate < earliestDate)) {
            earliestDate = releaseDate;
            earliestRelease = release;
          }
        }
        
        return {
          id: earliestRelease.id,
          title: earliestRelease.title,
          date: earliestRelease.date,
          year: earliestDate ? earliestDate.getFullYear() : null,
          country: earliestRelease.country,
          label: earliestRelease.label_info && earliestRelease.label_info.length > 0 
            ? earliestRelease.label_info[0].label.name : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting releases for recording:', error);
      throw error;
    }
  }

  // Parse date string to JavaScript Date object
  parseDate(dateString) {
    if (!dateString) return null;
    
    // MusicBrainz date format is YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 0) return null;
    
    const year = parseInt(parts[0]);
    if (isNaN(year)) return null;
    
    // Month is 0-indexed in JavaScript Date
    const month = parts.length > 1 && parts[1] ? parseInt(parts[1]) - 1 : 0;
    const day = parts.length > 2 && parts[2] ? parseInt(parts[2]) : 1;
    
    return new Date(year, month, day);
  }

  // Get the earliest release year for a track by artist and title
  async getEarliestReleaseYear(artist, title) {
    try {
      // First, search for the track
      const trackInfo = await this.searchTrack(artist, title);
      
      if (!trackInfo) {
        console.log(`Track not found: ${artist} - ${title}`);
        return null;
      }
      
      // Get more detailed release information
      const releaseInfo = await this.getRecordingReleases(trackInfo.id);
      
      // Return the earliest year found
      const year = releaseInfo && releaseInfo.year ? releaseInfo.year : trackInfo.year;
      
      return {
        originalArtist: trackInfo.artist,
        originalTitle: trackInfo.title,
        earliestYear: year,
        firstReleaseDate: releaseInfo ? releaseInfo.date : trackInfo.releaseDate,
        recordingId: trackInfo.id
      };
    } catch (error) {
      console.error('Error getting earliest release year:', error);
      throw error;
    }
  }
}

export default new MusicBrainzService();