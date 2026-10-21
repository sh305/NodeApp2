import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';

class AgoraVoiceService {
  constructor() {
    this.engine = null;
    this.isJoined = false;
    this.appId = null;
    this.channelName = null;
    this.uid = 0;
    this.onSpeakersCallback = null;
  }

  async requestMicrophonePermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'FunMaza requires access to your microphone for real-time voice chat in rooms.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Failed to request microphone permission:', err);
        return false;
      }
    }
    return true;
  }

  async initializeEngine(appId) {
    if (this.engine) return this.engine;
    try {
      this.appId = appId;
      this.engine = createAgoraRtcEngine();
      this.engine.initialize({ appId });
      this.engine.enableAudio();
      this.engine.enableAudioVolumeIndication(200, 3, true);
      this.engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

      this.engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('✅ Successfully joined Agora voice channel:', connection.channelId);
          this.isJoined = true;
        },
        onLeaveChannel: (connection, stats) => {
          console.log('🚪 Left Agora voice channel');
          this.isJoined = false;
        },
        onAudioVolumeIndication: (connection, speakers, speakerNumber, totalVolume) => {
          if (this.onSpeakersCallback && Array.isArray(speakers)) {
            // speakers: [{ uid, volume, vad }]
            const activeUids = speakers
              .filter((s) => (s.volume || 0) > 8)
              .map((s) => (s.uid === 0 ? this.uid : s.uid));
            this.onSpeakersCallback(activeUids);
          }
        },
        onError: (err, msg) => {
          console.warn('Agora RTC Engine error:', err, msg);
        },
      });

      return this.engine;
    } catch (e) {
      console.warn('Error initializing Agora RTC Engine:', e);
      return null;
    }
  }

  async joinRoom({ appId, channelName, token, uid, isSpeaker = false, onSpeakersUpdate }) {
    try {
      await this.requestMicrophonePermission();
      const engine = await this.initializeEngine(appId);
      if (!engine) return false;

      this.channelName = channelName;
      this.uid = Number(uid) || 0;
      this.onSpeakersCallback = onSpeakersUpdate;

      const role = isSpeaker
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;

      engine.setClientRoleType(role);
      if (isSpeaker) {
        engine.muteLocalAudioStream(false);
      } else {
        engine.muteLocalAudioStream(true);
      }

      engine.joinChannel(token, channelName, this.uid, {
        clientRoleType: role,
        publishMicrophoneTrack: isSpeaker,
      });

      return true;
    } catch (err) {
      console.warn('Error joining Agora voice channel:', err);
      return false;
    }
  }

  setMute(isMuted) {
    if (!this.engine) return;
    try {
      this.engine.muteLocalAudioStream(Boolean(isMuted));
    } catch (e) {
      console.warn('Error muting/unmuting local audio stream:', e);
    }
  }

  setRole(isSpeaker, isMuted = false) {
    if (!this.engine) return;
    try {
      const role = isSpeaker
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
      this.engine.setClientRoleType(role);
      this.engine.muteLocalAudioStream(isSpeaker ? Boolean(isMuted) : true);
    } catch (e) {
      console.warn('Error changing Agora client role:', e);
    }
  }

  leaveRoom() {
    if (!this.engine) return;
    try {
      this.engine.leaveChannel();
      this.isJoined = false;
      this.onSpeakersCallback = null;
    } catch (e) {
      console.warn('Error leaving Agora voice channel:', e);
    }
  }

  destroy() {
    this.leaveRoom();
    if (this.engine) {
      try {
        this.engine.release();
      } catch (e) {}
      this.engine = null;
    }
  }
}

const agoraVoiceService = new AgoraVoiceService();
export default agoraVoiceService;
