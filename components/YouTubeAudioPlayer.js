import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

// Unsichtbarer YouTube Player
// Spielt Musik im Hintergrund ab ohne UI-Elemente zu zeigen

const InvisibleYouTubePlayer = ({
  videoId,
  isPlaying = false,
  onPlaybackStatusUpdate,
  onReady,
  startTime = 0,
  volume = 100
}) => {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const isMounted = useRef(true);

  // Cleanup bei unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Spiele/Pause wenn sich isPlaying ändert
  useEffect(() => {
    if (!isMounted.current) return;
    
    const tryPlayPause = async () => {
      if (playerRef.current && playerReady) {
        try {
          if (isPlaying) {
            await playerRef.current.playVideo();
          } else {
            await playerRef.current.pauseVideo();
          }
        } catch (e) {
          console.warn('Play/Pause error:', e.message);
        }
      }
    };
    
    // Kleine Verzögerung um sicherzustellen dass Player bereit ist
    const timeout = setTimeout(tryPlayPause, 500);
    return () => clearTimeout(timeout);
  }, [isPlaying, playerReady]);

  // Seek wenn startTime sich ändert
  useEffect(() => {
    if (!isMounted.current) return;
    
    const trySeek = async () => {
      if (playerRef.current && playerReady && startTime > 0) {
        try {
          await playerRef.current.seekTo(startTime, true);
        } catch (e) {
          console.warn('Seek error:', e.message);
        }
      }
    };
    
    const timeout = setTimeout(trySeek, 500);
    return () => clearTimeout(timeout);
  }, [startTime, playerReady]);

  // Video ID ändern
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (videoId && videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
      setPlayerReady(false);
    }
  }, [videoId, currentVideoId]);

  const onStateChange = useCallback((state) => {
    if (!isMounted.current) return;
    
    // YouTube Player States:
    // -1 = unstarted
    // 0 = ended
    // 1 = playing
    // 2 = paused
    // 3 = buffering
    // 5 = video cued
    
    const isActuallyPlaying = state === 'playing';
    
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate({
        isPlaying: isActuallyPlaying,
        isBuffering: state === 'buffering',
        isEnded: state === 'ended'
      });
    }

    if (state === 'ended' && onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate({ isEnded: true, isPlaying: false });
    }
  }, [onPlaybackStatusUpdate]);

  const handleReady = useCallback(() => {
    if (!isMounted.current) return;
    
    setPlayerReady(true);
    if (onReady) onReady();
    
    // Setze Lautstärke
    const setVol = async () => {
      if (playerRef.current) {
        try {
          await playerRef.current.setVolume(volume);
        } catch (e) {
          console.warn('SetVolume error:', e.message);
        }
      }
    };
    
    setTimeout(setVol, 300);
  }, [onReady, volume]);

  if (!currentVideoId) return null;

  return (
    <View style={styles.invisibleContainer}>
      <YoutubePlayer
        ref={playerRef}
        height={1}
        width={1}
        play={isPlaying}
        videoId={currentVideoId}
        onChangeState={onStateChange}
        onReady={handleReady}
        onError={(error) => {
          console.warn('YouTube Player Error:', error);
          if (onPlaybackStatusUpdate) {
            onPlaybackStatusUpdate({ error: error });
          }
        }}
        initialPlayerParams={{
          controls: false,
          modestbranding: true,
          rel: false,
          showinfo: false,
          iv_load_policy: 3,
          start: startTime,
          preventFullScreen: true,
          loop: false,
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          javaScriptEnabled: true,
          domStorageEnabled: true,
          allowsFullscreenVideo: false,
          bounces: false,
          backgroundColor: 'transparent',
        }}
        forceAndroidAutoplay={false}
      />
    </View>
  );
};

// Hauptkomponente
const YouTubeAudioPlayer = (props) => {
  if (Platform.OS === 'web') {
    return null; // Web wird nicht unterstützt
  }
  return <InvisibleYouTubePlayer {...props} />;
};

const styles = StyleSheet.create({
  invisibleContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  }
});

export default YouTubeAudioPlayer;
