// YouTube Service - Kein API Key nötig!
// Nutzt Invidious Instanzen für Playlist-Daten und YouTube iFrame für Playback

// Aktuelle funktionierende Invidious Instanzen (Stand: 2026) - Quell: https://docs.invidious.io/instances/
const INVIDIOUS_INSTANCES = [
  'https://invidious.projectsegfau.lt',
  'https://invidious.privacydev.net',
  'https://iv.melmac.space',
  'https://yewtu.be',
  'https://invidious.flokinet.to',
  'https://inv.riverside.rocks',
  'https://invidious.esmailelbob.xyz',
];

// Fallback: YouTube oEmbed API (immer verfügbar, aber nur für einzelne Videos)
const OEMBED_API = 'https://www.youtube.com/oembed';

class YouTubeService {
  constructor() {
    this.currentInstance = 0;
    this.maxRetries = 3;
  }

  // Rotiere durch Invidious Instanzen bei Fehlern
  getNextInstance() {
    this.currentInstance = (this.currentInstance + 1) % INVIDIOUS_INSTANCES.length;
    return INVIDIOUS_INSTANCES[this.currentInstance];
  }

  getCurrentInstance() {
    return INVIDIOUS_INSTANCES[this.currentInstance];
  }

  // Extrahiere Video ID aus YouTube URL
  extractVideoId(url) {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Extrahiere Playlist ID aus YouTube URL
  extractPlaylistId(url) {
    if (!url) return null;
    
    // Zuerst prüfen ob es eine Playlist URL ist
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (playlistMatch) {
      const playlistId = playlistMatch[1];
      // Ignoriere YouTube Mix Playlists
      if (playlistId.startsWith('RD')) return null;
      return playlistId;
    }
    
    // Falls es nur eine Playlist ID ist (mindestens 13 Zeichen)
    if (/^[a-zA-Z0-9_-]{13,}$/.test(url.trim())) {
      return url.trim();
    }
    
    return null;
  }

  // Suche nach Videos mit Retry-Logik
  async searchVideos(query, maxResults = 10, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      console.warn('Alle Invidious Instanzen fehlgeschlagen. Suche nicht verfügbar.');
      return [];
    }

    const instance = this.getCurrentInstance();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&limit=${maxResults}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error('Invalid response format');
      
      return data.slice(0, maxResults).map(video => ({
        id: video.videoId,
        title: video.title || 'Unbekannt',
        author: video.author || 'Unbekannt',
        duration: video.lengthSeconds || 0,
        thumbnail: video.videoThumbnails?.[0]?.url || video.videoThumbnails?.[1]?.url || null,
        youtubeUrl: `https://youtube.com/watch?v=${video.videoId}`,
        year: this.extractYearFromTitle(video.title)
      }));
    } catch (error) {
      console.warn(`Invidious instance ${instance} failed:`, error.message);
      this.getNextInstance();
      return this.searchVideos(query, maxResults, retryCount + 1);
    }
  }

  // Hole Playlist-Daten
  async getPlaylistVideos(playlistId, retryCount = 0) {
    if (retryCount >= this.maxRetries) {
      throw new Error('Konnte Playlist nicht laden. Alle Server sind offline. Bitte versuche es später erneut.');
    }

    const instance = this.getCurrentInstance();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(
        `${instance}/api/v1/playlists/${playlistId}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (!data.videos) throw new Error('Invalid playlist format');
      
      return {
        id: playlistId,
        title: data.title || 'Unbekannte Playlist',
        author: data.author || 'Unbekannt',
        description: data.description || '',
        videoCount: data.videoCount || 0,
        videos: data.videos.map(video => ({
          id: video.videoId,
          title: video.title || 'Unbekannt',
          artist: video.author || 'Unbekannt',
          duration: video.lengthSeconds || 0,
          thumbnail: video.videoThumbnails?.[0]?.url || video.videoThumbnails?.[1]?.url || null,
          youtubeUrl: `https://youtube.com/watch?v=${video.videoId}`,
          year: this.extractYearFromTitle(video.title)
        }))
      };
    } catch (error) {
      console.warn(`Invidious playlist failed (instance ${instance}):`, error.message);
      this.getNextInstance();
      return this.getPlaylistVideos(playlistId, retryCount + 1);
    }
  }

  // Prüfe ob Invidious Instanz erreichbar ist
  async testInstance(instanceUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${instanceUrl}/api/v1/stats`, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Hole die schnellste erreichbare Invidious Instanz
  async getFastestInstance() {
    const testPromises = INVIDIOUS_INSTANCES.map(async (instance) => {
      const startTime = Date.now();
      const isReachable = await this.testInstance(instance);
      const responseTime = Date.now() - startTime;
      return { instance, isReachable, responseTime };
    });

    const results = await Promise.all(testPromises);
    const reachableInstances = results.filter(r => r.isReachable);
    
    if (reachableInstances.length === 0) {
      throw new Error('Keine erreichbaren Invidious Instanzen gefunden');
    }

    // Sortiere nach Antwortzeit (schnellste zuerst)
    const fastestInstance = reachableInstances.sort((a, b) => a.responseTime - b.responseTime)[0];
    this.currentInstance = INVIDIOUS_INSTANCES.indexOf(fastestInstance.instance);
    console.log(`Verwende schnellste Instanz: ${fastestInstance.instance} (${fastestInstance.responseTime}ms)`);
    
    return fastestInstance.instance;
  }

  // Hole Video-Details via oEmbed (Fallback)
  async getVideoDetails(videoId) {
    try {
      const response = await fetch(
        `${OEMBED_API}?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 5000 }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        id: videoId,
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url
      };
    } catch (error) {
      console.warn('oEmbed failed:', error.message);
      return null;
    }
  }

  // Extrahiere Jahr aus Titel
  extractYearFromTitle(title) {
    if (!title) return null;
    
    // Suche nach (YYYY) oder [YYYY] oder einfach 4-stellige Jahreszahlen
    const match = title.match(/\((\d{4})\)|\[(\d{4})\]|(\d{4})/);
    if (match) {
      const year = parseInt(match[1] || match[2] || match[3]);
      if (year >= 1950 && year <= new Date().getFullYear()) {
        return year;
      }
    }
    return null;
  }

  // Generiere YouTube Embed URL
  getEmbedUrl(videoId, options = {}) {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      controls: options.controls !== false ? '1' : '0',
      disablekb: '1',
      fs: '0',
      iv_load_policy: '3',
      modestbranding: '1',
      playsinline: '1',
      rel: '0',
      showinfo: '0',
      mute: options.mute ? '1' : '0',
      ...(options.start > 0 && { start: options.start.toString() })
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  // Validiere ob Video existiert
  async validateVideo(videoId) {
    try {
      const instance = this.getCurrentInstance();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${instance}/api/v1/videos/${videoId}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Erstelle Track aus URL
  createTrackFromUrl(url, metadata = {}) {
    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    return {
      id: videoId,
      title: metadata.title || 'Unbekannter Titel',
      artist: metadata.artist || 'Unbekannter Künstler',
      year: metadata.year || null,
      youtubeUrl: `https://youtube.com/watch?v=${videoId}`,
      youtubeId: videoId,
      duration: metadata.duration || 0,
      type: 'youtube'
    };
  }
}

export default new YouTubeService();
