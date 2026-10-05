import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';

const ICONS = {
  // Basic tools
  members: require('../../assets/icons/Room Icons/tool_members.png'),
  room_settings: require('../../assets/icons/Room Icons/tool_room_settings.png'),
  seat_settings: require('../../assets/icons/Room Icons/tool_seat_settings.png'),
  broadcast: require('../../assets/icons/Room Icons/tool_broadcast.png'),
  gather_members: require('../../assets/icons/Room Icons/tool_gather_members.png'),

  // Entertainment tools
  star_calculator: require('../../assets/icons/Room Icons/tool_star_calculator.png'),
  combat: require('../../assets/icons/Room Icons/tool_combat.png'),
  room_pk: require('../../assets/icons/Room Icons/tool_room_pk.png'),
  game_pk: require('../../assets/icons/Room Icons/tool_game_pk.png'),
  games: require('../../assets/icons/Room Icons/tool_games.png'),
  my_music: require('../../assets/icons/Room Icons/tool_my_music.png'),
  sound_effect: require('../../assets/icons/Room Icons/tool_sound_effect.png'),
  lucky_draw: require('../../assets/icons/Room Icons/tool_lucky_draw.png'),
  soccer_rival: require('../../assets/icons/Room Icons/tool_soccer_rival.png'),

  // Other tools
  task: require('../../assets/icons/Room Icons/tool_task.png'),
  lucky_packet: require('../../assets/icons/Room Icons/tool_lucky_packet.png'),
  lucky_number: require('../../assets/icons/Room Icons/tool_lucky_number.png'),
  no_gift_effects: require('../../assets/icons/Room Icons/tool_no_gift_effects.png'),
  no_enter_effects: require('../../assets/icons/Room Icons/tool_no_enter_effects.png'),
  mute: require('../../assets/icons/Room Icons/tool_mute.png'),
};

const SECTIONS = [
  {
    key: 'basic_tools',
    title: 'Basic tools',
    items: [
      { id: 'members', name: 'Members', icon: ICONS.members },
      { id: 'room_settings', name: 'Room Settings', icon: ICONS.room_settings },
      { id: 'seat_settings', name: 'Seat Settings', icon: ICONS.seat_settings },
      { id: 'broadcast', name: 'Broadcast', icon: ICONS.broadcast },
      // { id: 'gather_members', name: 'Gather Members', icon: ICONS.gather_members },
    ],
  },
  {
    key: 'entertainment_tools',
    title: 'Entertainment tools',
    items: [
      //{ id: 'star_calculator', name: 'Star Calculator', icon: ICONS.star_calculator, hasToggle: true },
      //{ id: 'combat', name: 'Combat', icon: ICONS.combat, hasToggle: true },
      { id: 'room_pk', name: 'Room PK', icon: ICONS.room_pk, hasToggle: true },
      { id: 'game_pk', name: 'Game PK', icon: ICONS.game_pk, hasToggle: true },
      { id: 'games', name: 'Games', icon: ICONS.games },
      { id: 'my_music', name: 'My music', icon: ICONS.my_music },
      { id: 'sound_effect', name: 'Sound Effect', icon: ICONS.sound_effect },
      { id: 'lucky_draw', name: 'Lucky Draw', icon: ICONS.lucky_draw },
      { id: 'soccer_rival', name: 'Soccer Rival', icon: ICONS.soccer_rival, hasToggle: true },
    ],
  },
  {
    key: 'other_tools',
    title: 'Other tools',
    items: [
      { id: 'task', name: 'Task', icon: ICONS.task, hasBadge: true },
      { id: 'lucky_packet', name: 'Lucky Packet', icon: ICONS.lucky_packet },
      { id: 'lucky_number', name: 'Lucky number', icon: ICONS.lucky_number },
      { id: 'no_gift_effects', name: 'No gift effects', icon: ICONS.no_gift_effects, hasToggle: true },
      { id: 'no_enter_effects', name: 'No enter effects', icon: ICONS.no_enter_effects, hasToggle: true },
      { id: 'mute', name: 'Mute', icon: ICONS.mute, hasToggle: true },
    ],
  },
];

export default function VoiceRoomToolsModal({
  visible,
  onClose,
  onSelectTool,
  roomPkActive = false,
}) {
  const insets = useSafeAreaInsets();

  // State to manage switches for tools that have toggle buttons
  const [toggleStates, setToggleStates] = useState({
    star_calculator: false,
    combat: false,
    room_pk: Boolean(roomPkActive),
    game_pk: false,
    soccer_rival: false,
    no_gift_effects: false,
    no_enter_effects: false,
    mute: false,
  });

  useEffect(() => {
    setToggleStates((prev) => ({
      ...prev,
      room_pk: Boolean(roomPkActive),
    }));
  }, [roomPkActive]);

  const handleItemPress = (item) => {
    if (item.hasToggle) {
      if (item.id === 'room_pk') {
        const nextVal = !roomPkActive;
        if (onSelectTool) {
          onSelectTool(item, nextVal);
        }
        return;
      }
      const nextVal = !toggleStates[item.id];
      setToggleStates((prev) => ({
        ...prev,
        [item.id]: nextVal,
      }));
      if (onSelectTool) {
        onSelectTool(item, nextVal);
      }
    } else {
      if (onSelectTool) {
        onSelectTool(item);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dismiss backdrop on tap */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Modal Bottom Sheet Card */}
        <View style={[styles.sheetCard, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          {/* Top Grabber Handle */}
          <View style={styles.handleBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {SECTIONS.map((section) => (
              <View key={section.key} style={styles.sectionWrap}>
                {/* Section Title */}
                <Text style={styles.sectionTitle}>
                  <T>{section.title}</T>
                </Text>

                {/* 4-Column Grid */}
                <View style={styles.gridRow}>
                  {section.items.map((item) => {
                    const isToggledOn = item.id === 'room_pk' ? Boolean(roomPkActive) : Boolean(toggleStates[item.id]);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.gridItem}
                        activeOpacity={0.75}
                        onPress={() => handleItemPress(item)}
                      >
                        {/* Icon Wrapper */}
                        <View style={styles.iconContainer}>
                          <Image
                            source={item.icon}
                            style={styles.toolIconImg}
                            resizeMode="contain"
                          />

                          {/* Red Notification Badge */}
                          {item.hasBadge && <View style={styles.badgeDot} />}

                          {/* Toggle Switch Pill */}
                          {item.hasToggle && (
                            <View
                              style={[
                                styles.togglePill,
                                isToggledOn && styles.togglePillActive,
                              ]}
                            >
                              <View
                                style={[
                                  styles.toggleKnob,
                                  isToggledOn && styles.toggleKnobActive,
                                ]}
                              />
                            </View>
                          )}
                        </View>

                        {/* Text Label */}
                        <Text style={styles.itemLabel} numberOfLines={2}>
                          <T>{item.name}</T>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#0F0F1A',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '82%',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  toolIconImg: {
    width: 42,
    height: 42,
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#0F0F1A',
  },
  togglePill: {
    position: 'absolute',
    bottom: -2,
    width: 22,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 1.5,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  togglePillActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  itemLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 72,
  },
});
