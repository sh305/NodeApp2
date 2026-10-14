import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Ellipse } from 'react-native-svg';
import { T } from '../components/TranslatedText';

// Back Chevron Icon
const ChevronLeft = ({ size = 22, color = '#1C1C1E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Circular Face Scan Graphic matching Screenshot 2
const FaceScanGraphic = ({ size = 150 }) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Defs>
      <SvgGradient id="glowCircle" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E0F7FF" />
        <Stop offset="100%" stopColor="#C4EFFF" />
      </SvgGradient>
      <SvgGradient id="scanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#00D2FF" stopOpacity="0.2" />
        <Stop offset="50%" stopColor="#00D2FF" stopOpacity="1" />
        <Stop offset="100%" stopColor="#00D2FF" stopOpacity="0.2" />
      </SvgGradient>
    </Defs>

    {/* Background Soft Glow Circle */}
    <Circle cx="80" cy="80" r="62" fill="url(#glowCircle)" />

    {/* User Head Outline */}
    <Circle cx="80" cy="62" r="15" stroke="#00C4DF" strokeWidth="5.5" />

    {/* User Shoulders Outline */}
    <Path
      d="M52 108C54 94 66 87 80 87C94 87 106 94 108 108"
      stroke="#00C4DF"
      strokeWidth="5.5"
      strokeLinecap="round"
    />

    {/* Horizontal Scanning Line */}
    <Path
      d="M28 80H132"
      stroke="url(#scanLineGrad)"
      strokeWidth="3.5"
      strokeLinecap="round"
    />

    {/* Scanner Reflection Arc */}
    <Ellipse cx="80" cy="98" rx="26" ry="7" fill="#00C4DF" opacity="0.15" />
  </Svg>
);

export default function RealPersonIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}><T>Real Person Verification</T></Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Middle Content */}
      <View style={styles.contentWrap}>
        {/* Center Graphic */}
        <View style={styles.graphicWrap}>
          <FaceScanGraphic size={150} />
        </View>

        {/* Informative Text */}
        <Text style={styles.descriptionText}>
          <T>
            We will capture your facial information for gender detection. The captured information is only used for verification and is not visible to other users
          </T>
        </Text>
      </View>

      {/* Bottom Action Section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        <TouchableOpacity
          style={styles.verifyButtonTouch}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('FaceCapture')}
        >
          <LinearGradient
            colors={['#00E5A3', '#00C48C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyGradient}
          >
            <Text style={styles.verifyButtonText}><T>I Want to Verify</T></Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Disclaimer Note */}
        <Text style={styles.disclaimerText}>
          <T>
            The personal information and images collected during the verification process are only used for system review and will not be publicly displayed
          </T>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 34,
    marginTop: -40,
  },
  graphicWrap: {
    marginBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 15,
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  verifyButtonTouch: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00D2A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  verifyGradient: {
    height: 54,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
