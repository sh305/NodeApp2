import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';

const RIGHTS_DATA = [
  { authority: 'Seat Lock', admin: true, host: true, owner: true },
  { authority: 'Invite on seat', admin: true, host: true, owner: true },
  { authority: 'Accept/Reject seat application', admin: true, host: true, owner: true },
  { authority: 'Kick off the seat', admin: true, host: true, owner: true },
  { authority: 'Open Mic/Close Mic', admin: true, host: true, owner: true },
  { authority: 'Forbid from sending images in the room', admin: true, host: true, owner: true },
  { authority: 'Kick off the room', admin: true, host: true, owner: true },
  { authority: 'Set/Cancel Admin', admin: false, host: false, owner: true },
  { authority: 'Set/Cancel Host', admin: true, host: false, owner: true },
  { authority: 'Accept/Reject member application', admin: true, host: false, owner: true },
  { authority: 'Play music', admin: false, host: true, owner: true },
  { authority: 'Play sound effect', admin: false, host: true, owner: true },
  { authority: 'Start/End the counter', admin: false, host: true, owner: true },
];

export default function AdminRightsModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
        {/* ══ 1. TOP HEADER ══ */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <T>Admin rights</T>
          </Text>
          <View style={styles.headerRightSpacer} />
        </View>

        {/* ══ 2. NOTICE BANNER ══ */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            <T>Host rights are granted only when host seat is occupied. User can be host and admin at the same time.</T>
          </Text>
        </View>

        {/* ══ 3. TABLE ══ */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(30, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.columnHeader, styles.colAuthority]}>
              <T>Authority</T>
            </Text>
            <Text style={[styles.columnHeader, styles.colRole]}>
              <T>Admin</T>
            </Text>
            <Text style={[styles.columnHeader, styles.colRole]}>
              <T>Host</T>
            </Text>
            <Text style={[styles.columnHeader, styles.colOwner]}>
              <T>Room owner</T>
            </Text>
          </View>

          {/* Table Rows */}
          {RIGHTS_DATA.map((row, index) => {
            const isAlt = index % 2 === 1;
            return (
              <View
                key={row.authority}
                style={[styles.tableRow, isAlt && styles.tableRowAlt]}
              >
                <Text style={[styles.rowAuthorityText, styles.colAuthority]}>
                  <T>{row.authority}</T>
                </Text>
                <View style={[styles.cellCenter, styles.colRole]}>
                  {row.admin ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    <Text style={styles.dashMark}>--</Text>
                  )}
                </View>
                <View style={[styles.cellCenter, styles.colRole]}>
                  {row.host ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    <Text style={styles.dashMark}>--</Text>
                  )}
                </View>
                <View style={[styles.cellCenter, styles.colOwner]}>
                  {row.owner ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    <Text style={styles.dashMark}>--</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: '#374151',
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightSpacer: {
    width: 36,
  },
  noticeBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  noticeText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  columnHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  colAuthority: {
    flex: 2.2,
    paddingRight: 8,
  },
  colRole: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  colOwner: {
    flex: 1.2,
    textAlign: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  rowAuthorityText: {
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 17,
  },
  cellCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D293', // Mint green checkmark matching Screenshot 4
  },
  dashMark: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
