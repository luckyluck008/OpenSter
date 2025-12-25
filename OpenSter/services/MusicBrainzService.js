import axios from 'axios';

class MusicBrainzService {
  constructor() {
    this.baseURL = 'https://musicbrainz.org/ws/2';
    this.headers = {
      'User-Agent': 'OpenSter/1.0.0 ( https://github.com/openster )',
      'Accept': 'application/json'
    };
    this.lastRequestTime = 0;
    this.minDelay = 1200; // MusicBrainz requires 1 request per second, add buffer
  }

  // Wait to respect rate limit
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Clean up title for search
  cleanTitle(title) {
    return title
      .replace(/\s*-\s*(Remaster(ed)?|Radio|Single|Album|Edit|Version|Remix|Live|Acoustic|Deluxe|Anniversary|Mono|Stereo|\d{4}).*/gi, '')
      .replace(/\s*\(feat\..*\)/gi, '')
      .replace(/\s*\(with.*\)/gi, '')
      .replace(/\s*\[.*\]/g, '')
      .replace(/\s*\(.*Remaster.*\)/gi, '')
      .replace(/\s*\(.*Version.*\)/gi, '')
      .replace(/\s*\(.*Edition.*\)/gi, '')
      .trim();
  }

  // Clean up artist name
  cleanArtist(artist) {
    return artist
      .split(',')[0]  // Take first artist
      .split(' & ')[0] // Remove collaborators
      .split(' feat.')[0]
      .split(' feat ')[0]
      .split(' with ')[0]
      .split(' x ')[0]
      .trim();
  }

  // Get the earliest release year for a track
  async getEarliestReleaseYear(artist, title) {
    try {
      await this.waitForRateLimit();
      
      const cleanArtist = this.cleanArtist(artist);
      const cleanTitle = this.cleanTitle(title);
      
      // Simple search query - more flexible
      const query = encodeURIComponent(`recording:"${cleanTitle}" AND artist:"${cleanArtist}"`);
      const searchUrl = `${this.baseURL}/recording?query=${query}&fmt=json&limit=10`;
      
      const response = await axios.get(searchUrl, { 
        headers: this.headers,
        timeout: 10000
      });
      
      if (!response.data?.recordings?.length) {
        // Try fallback search with just title if artist search fails
        const fallbackQuery = encodeURIComponent(`recording:"${cleanTitle}"`);
        const fallbackUrl = `${this.baseURL}/recording?query=${fallbackQuery}&fmt=json&limit=5`;
        
        await this.waitForRateLimit();
        const fallbackResponse = await axios.get(fallbackUrl, { 
          headers: this.headers,
          timeout: 10000 
        });
        
        if (!fallbackResponse.data?.recordings?.length) {
          console.log(`❌ Nicht gefunden: ${cleanArtist} - ${cleanTitle}`);
          return null;
        }
        
        response.data = fallbackResponse.data;
      }
      
      // Find the earliest release year
      let earliestYear = null;
      let bestRecording = null;
      
      for (const recording of response.data.recordings) {
        if (recording['first-release-date']) {
          const year = parseInt(recording['first-release-date'].substring(0, 4));
          if (!isNaN(year) && (earliestYear === null || year < earliestYear)) {
            earliestYear = year;
            bestRecording = recording;
          }
        }
      }
      
      if (earliestYear) {
        console.log(`✅ ${cleanArtist} - ${cleanTitle}: ${earliestYear}`);
        return {
          originalArtist: bestRecording['artist-credit']?.[0]?.name || artist,
          originalTitle: bestRecording.title,
          earliestYear: earliestYear,
          firstReleaseDate: bestRecording['first-release-date'],
          recordingId: bestRecording.id
        };
      }
      
      console.log(`⚠️ Kein Jahr gefunden: ${cleanArtist} - ${cleanTitle}`);
      return null;
      
    } catch (error) {
      // Handle rate limiting and server errors silently
      if (error.response?.status === 503 || error.response?.status === 502) {
        console.log(`⏳ Server Fehler (${error.response?.status}), warte und versuche erneut...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          return await this.getEarliestReleaseYear(artist, title); // Retry once
        } catch (retryError) {
          console.log(`⚠️ Retry fehlgeschlagen für: ${artist} - ${title}`);
          return null;
        }
      }
      // Log but don't throw - return null silently for other errors
      console.log(`⚠️ MusicBrainz Fehler für ${artist} - ${title}:`, error.message);
      return null;
    }
  }
}

export default new MusicBrainzService();