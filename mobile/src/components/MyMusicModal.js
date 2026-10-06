import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import { musicPlayer } from '../services/musicPlayerService';

let DocumentPicker = null;
try {
  // eslint-disable-next-line global-require
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  console.log('expo-document-picker not available:', e);
}

let MediaLibrary = null;
try {
  // eslint-disable-next-line global-require
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // Silent fallback
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '<unknown>';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ── SVG ICONS ──
function BackArrowIcon({ size = 24, color = '#334155' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GreenPlayIndicator({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4.5L19.5 12L7 19.5V4.5Z" fill="#10B981" />
    </Svg>
  );
}

function CheckboxIcon({ checked = false, size = 22 }) {
  if (checked) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect width="24" height="24" rx="6" fill="#10B981" />
        <Polyline
          points="6 12 10.5 16.5 18 8"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="5.5"
        stroke="#10B981"
        strokeWidth="1.6"
        fill="transparent"
      />
    </Svg>
  );
}

function DeviceUploadIcon({ size = 20, color = '#10B981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3V15M12 3L7.5 7.5M12 3L16.5 7.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function MyMusicModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Mode: 'list' (Screenshot 2), 'add' (Screenshot 3), 'edit' (Screenshot 4)
  const [viewMode, setViewMode] = useState('list');

  // Player state
  const [playerState, setPlayerState] = useState(musicPlayer.getState());

  // Checkbox selections for 'add' and 'edit' modes
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [selectedToDelete, setSelectedToDelete] = useState(new Set());

  // Local device/custom scanned songs pool
  const [libraryPool, setLibraryPool] = useState(playerState.deviceLibrary || []);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // ── Auto Scan Phone Storage for Music Files ──
  const scanDeviceMusic = async () => {
    try {
      if (!MediaLibrary) return;
      setIsScanning(true);
      setPermissionDenied(false);

      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setPermissionDenied(true);
        setIsScanning(false);
        return;
      }

      const res = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 500,
        sortBy: [['creationTime', false]],
      });

      if (res && res.assets && res.assets.length > 0) {
        const scannedTracks = res.assets.map((asset) => ({
          id: `dev_${asset.id}`,
          title: asset.filename || 'Audio Track',
          artist: formatDuration(asset.duration),
          uri: asset.uri,
          duration: asset.duration,
        }));

        await musicPlayer.addMultipleToDeviceLibrary(scannedTracks);

        setLibraryPool((prev) => {
          const map = new Map();
          scannedTracks.forEach((t) => map.set(t.uri, t));
          prev.forEach((t) => map.set(t.uri, t));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      // In Expo Go, Google Play Android policy restricts Expo Go from media library permissions.
      // Seamlessly fall back so user can use the direct Audio tab picker.
      setPermissionDenied(true);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const unsub = musicPlayer.subscribe((state) => {
      setPlayerState(state);
      setLibraryPool(state.deviceLibrary || []);
    });
    return unsub;
  }, []);

  // Auto-scan whenever opening or switching to 'add' mode
  useEffect(() => {
    if (visible && viewMode === 'add') {
      scanDeviceMusic();
    }
  }, [visible, viewMode]);

  // Reset states when modal closes or mode changes
  useEffect(() => {
    if (!visible) {
      setViewMode('list');
      setSelectedToAdd(new Set());
      setSelectedToDelete(new Set());
    }
  }, [visible]);

  const { currentSong, isPlaying, myMusicList } = playerState;

  // ── Handle Play / Select in list mode ──
  const handleItemPress = (song) => {
    if (viewMode === 'list') {
      if (currentSong?.id === song.id) {
        musicPlayer.togglePlay();
      } else {
        musicPlayer.playSong(song);
      }
    } else if (viewMode === 'edit') {
      toggleDeleteSelection(song.id);
    }
  };

  // ── Toggle Checkbox for Add Mode ──
  const toggleAddSelection = (songId) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  // ── Toggle Checkbox for Edit/Delete Mode ──
  const toggleDeleteSelection = (songId) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  // ── Confirm Adding Songs (Screenshot 3 -> Screenshot 2) ──
  const handleConfirmAdding = async () => {
    if (selectedToAdd.size === 0) {
      showToast(t('Please select at least one song to add'), 'info');
      return;
    }

    const songsToInsert = libraryPool.filter((s) => selectedToAdd.has(s.id));
    await musicPlayer.addSongs(songsToInsert);
    setSelectedToAdd(new Set());
    setViewMode('list');
    showToast(t('Music added successfully'), 'success');
  };

  // ── Confirm Deleting Songs (Screenshot 4) ──
  const handleDeleteSongs = async () => {
    if (selectedToDelete.size === 0) {
      showToast(t('Please select at least one song to delete'), 'info');
      return;
    }

    const idsToDelete = Array.from(selectedToDelete);
    await musicPlayer.deleteSongs(idsToDelete);
    setSelectedToDelete(new Set());
    setViewMode('list');
    showToast(t('Selected music deleted'), 'success');
  };

  // ── Pick Multiple Real Audio Files From Phone Device Storage ──
  const handlePickFromDevice = async () => {
    try {
      if (!DocumentPicker) {
        showToast(t('File picker not supported in this environment'), 'error');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newTracks = result.assets.map((file, idx) => ({
          id: `device_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          title: file.name || 'Local_Audio.mp3',
          artist: file.size
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : '<device storage>',
          uri: file.uri,
        }));

        // Persist all selected tracks to device library
        await musicPlayer.addMultipleToDeviceLibrary(newTracks);

        // Add to active library pool
        setLibraryPool((prev) => {
          const map = new Map();
          newTracks.forEach((t) => map.set(t.uri, t));
          prev.forEach((t) => map.set(t.uri, t));
          return Array.from(map.values());
        });

        // Automatically pre-check newly picked songs so user can tap Confirm Adding
        setSelectedToAdd((prev) => {
          const next = new Set(prev);
          newTracks.forEach((t) => next.add(t.id));
          return next;
        });

        showToast(t('Music added successfully'), 'success');
      }
    } catch (err) {
      console.log('Document picker error:', err);
      showToast(t('Failed to load audio file'), 'error');
    }
  };

  // ── Header Left Action ──
  const handleHeaderBack = () => {
    if (viewMode === 'add' || viewMode === 'edit') {
      setViewMode('list');
      setSelectedToAdd(new Set());
      setSelectedToDelete(new Set());
    } else {
      onClose();
    }
  };

  // ── Render Header ──
  const renderHeader = () => {
    return (
      <View style={[styles.headerContainer, { paddingTop: Math.max(12, insets.top) }]}>
        {/* Left Back Arrow */}
        <TouchableOpacity
          style={styles.headerBackBtn}
          activeOpacity={0.7}
          onPress={handleHeaderBack}
        >
          <BackArrowIcon size={24} color="#334155" />
        </TouchableOpacity>

        {/* Center Title */}
        <Text style={styles.headerTitle}>
          {viewMode === 'add' ? <T>Add music</T> : <T>My music</T>}
        </Text>

        {/* Right Action */}
        <View style={styles.headerRightBox}>
          {viewMode === 'list' && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedToDelete(new Set());
                setViewMode('edit');
              }}
            >
              <Text style={styles.headerActionText}>
                <T>Edit</T>
              </Text>
            </TouchableOpacity>
          )}

          {viewMode === 'edit' && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.7}
              onPress={() => {
                setViewMode('list');
                setSelectedToDelete(new Set());
              }}
            >
              <Text style={styles.headerActionText}>
                <T>Save</T>
              </Text>
            </TouchableOpacity>
          )}

          {viewMode === 'add' && (
            <TouchableOpacity
              style={styles.headerDevicePickBtn}
              activeOpacity={0.7}
              onPress={handlePickFromDevice}
            >
              <DeviceUploadIcon size={20} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Render Song Item (Matches Screenshots 2, 3, 4) ──
  const renderItem = ({ item }) => {
    const isCurrentPlaying = currentSong?.id === item.id && isPlaying;

    if (viewMode === 'list') {
      // Screenshot 2: Simple item with title, subtitle, divider, and green play indicator if active
      return (
        <TouchableOpacity
          style={styles.songItemRow}
          activeOpacity={0.75}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.songInfoCol}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist || '<unknown>'}
            </Text>
          </View>

          {isCurrentPlaying && (
            <View style={styles.rightIndicatorBox}>
              <GreenPlayIndicator size={18} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (viewMode === 'add') {
      // Screenshot 3: Item with title, subtitle, optional play preview, and rounded checkbox
      const isChecked = selectedToAdd.has(item.id);
      return (
        <TouchableOpacity
          style={styles.songItemRow}
          activeOpacity={0.75}
          onPress={() => toggleAddSelection(item.id)}
        >
          <View style={styles.songInfoCol}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist || '<unknown>'}
            </Text>
          </View>

          <View style={styles.rightAddControlsRow}>
            {isCurrentPlaying && (
              <View style={styles.previewIndicatorBox}>
                <GreenPlayIndicator size={16} />
              </View>
            )}
            <CheckboxIcon checked={isChecked} size={22} />
          </View>
        </TouchableOpacity>
      );
    }

    // Screenshot 4: Edit Mode with rounded checkbox for delete
    const isChecked = selectedToDelete.has(item.id);
    return (
      <TouchableOpacity
        style={styles.songItemRow}
        activeOpacity={0.75}
        onPress={() => toggleDeleteSelection(item.id)}
      >
        <View style={styles.songInfoCol}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist || '<unknown>'}
          </Text>
        </View>

        <View style={styles.rightAddControlsRow}>
          {isCurrentPlaying && (
            <View style={styles.previewIndicatorBox}>
              <GreenPlayIndicator size={16} />
            </View>
          )}
          <CheckboxIcon checked={isChecked} size={22} />
        </View>
      </TouchableOpacity>
    );
  };

  // ── Bottom Fixed Action Button ──
  const renderBottomBar = () => {
    if (viewMode === 'list') {
      // Screenshot 2: "Add music" large green pill button
      return (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
          <TouchableOpacity
            style={styles.greenPillBtn}
            activeOpacity={0.8}
            onPress={() => {
              const existingIds = new Set(myMusicList.map((s) => s.id));
              setSelectedToAdd(existingIds);
              setViewMode('add');
              scanDeviceMusic();
            }}
          >
            <Text style={styles.greenPillBtnText}>
              <T>Add music</T>
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewMode === 'add') {
      // Screenshot 3: "Confirm Adding" large green gradient/pill button
      return (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
          <TouchableOpacity
            style={styles.greenPillBtn}
            activeOpacity={0.8}
            onPress={handleConfirmAdding}
          >
            <Text style={styles.greenPillBtnText}>
              <T>Confirm Adding</T>
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Screenshot 4: "Delete" pill button
    const deleteCount = selectedToDelete.size;
    const canDelete = deleteCount > 0;

    return (
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <TouchableOpacity
          style={[styles.deletePillBtn, canDelete ? styles.deleteBtnActive : styles.deleteBtnDisabled]}
          activeOpacity={canDelete ? 0.8 : 1}
          onPress={canDelete ? handleDeleteSongs : null}
          disabled={!canDelete}
        >
          <Text style={[styles.deleteBtnText, canDelete && styles.deleteBtnTextActive]}>
            <T>Delete</T>
            {deleteCount > 0 ? ` (${deleteCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Data source depending on mode
  const currentData = viewMode === 'add' ? libraryPool : myMusicList;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleHeaderBack}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {renderHeader()}

        {/* Scanning indicator banner in 'add' mode */}
        {viewMode === 'add' && isScanning && (
          <View style={styles.scanningBanner}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.scanningBannerText}>
              <T>Scanning device music...</T>
            </Text>
          </View>
        )}



        {/* Songs List */}
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(90, insets.bottom + 80) },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {viewMode === 'add' ? (
                  <T>No audio files selected yet</T>
                ) : (
                  <T>No music added yet</T>
                )}
              </Text>
              {viewMode === 'add' ? (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={handlePickFromDevice}
                >
                  <DeviceUploadIcon size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>
                    <T>Select Music from Phone</T>
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.emptySubText}>
                  <T>Tap Add music below to add songs from your device</T>
                </Text>
              )}
            </View>
          }
        />

        {/* Bottom Floating Action Bar */}
        {renderBottomBar()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  headerRightBox: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  headerDevicePickBtn: {
    padding: 6,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  permissionBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  permissionBannerSubText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  permissionBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  devicePickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  devicePickTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  devicePickBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  devicePickBannerSubText: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  devicePickBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  devicePickBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 8,
  },
  songItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  songInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 13,
    color: '#94A3B8',
  },
  rightIndicatorBox: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAddControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  previewIndicatorBox: {
    marginRight: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionBtnText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  greenPillBtn: {
    backgroundColor: '#10B981',
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  greenPillBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  deletePillBtn: {
    borderRadius: 30,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: '#CBD5E1', // Exact light grey pill from Screenshot 4
  },
  deleteBtnActive: {
    backgroundColor: '#EF4444', // Red when items selected to delete
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  deleteBtnTextActive: {
    color: '#FFFFFF',
  },
});
