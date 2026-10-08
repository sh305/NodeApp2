import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import PersonalTasksModal from '../components/PersonalTasksModal';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';
import { PhonePeIcon, GooglePayIcon, PaytmIcon, BhimUpiIcon } from '../components/PaymentBrandIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Owner Official Payment Details
const OWNER_MOBILE_NUMBER = '7982720270';
const OWNER_UPI_ID = '7982720270@ybl';
const OWNER_PAYEE_NAME = 'Shivam Rai';

// Asset Icons
const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');
const RECHARGE_QR_IMG = require('../../assets/icons/recharge_qr.png');

// Store SVG Icon
const StoreIcon = ({ size = 22, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9L4.5 4H19.5L21 9M3 9V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V9M3 9H21M9 21V13H15V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Back Arrow SVG
const BackArrowIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// History / Clock SVG Icon
const HistoryIcon = ({ size = 22, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path
      d="M12 7V12L15 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Refresh SVG Icon
const RefreshIcon = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 12A8 8 0 0 1 7.2 18.2L4 15M4 12A8 8 0 0 1 16.8 5.8L20 9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 4V9H15M4 20V15H9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Question Mark Icon
const QuestionIcon = ({ size = 14, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.39913C11.0108 7.03015 11.7289 6.87898 12.4332 6.97127C13.1375 7.06356 13.7828 7.39327 14.2599 7.90428C14.737 8.41529 15.0142 9.07433 15.0442 9.76943C15.0442 11.5 12.0442 12.5 12.0442 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

// Chevron Right Icon
const ChevronRight = ({ size = 18, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 6 Recharge Packages (Matching Screenshot 1)
const RECHARGE_PACKAGES = [
  { id: 'p1', coins: 200, bonus: 0, price: '₹22.20' },
  { id: 'p2', coins: 1000, bonus: 0, price: '₹111.00' },
  { id: 'p3', coins: 5000, bonus: 150, price: '₹571.00' },
  { id: 'p4', coins: 14000, bonus: 200, price: '₹1,576.00' },
  { id: 'p5', coins: 40000, bonus: 1080, price: '₹4,559.00' },
  { id: 'p6', coins: 160000, bonus: 4680, price: '₹18,279.00' },
];

// Preset Game Coin Exchange Tiers (Matching Screenshot 3)
const GAME_COIN_PRESETS = [
  { id: 'gc1', gameCoins: 1000, goldCost: 100 },
  { id: 'gc2', gameCoins: 5000, goldCost: 500 },
  { id: 'gc3', gameCoins: 10000, goldCost: 1000 },
  { id: 'gc4', gameCoins: 100000, goldCost: 10000 },
];

export default function WalletScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Active Tab: 'coins' | 'diamonds' | 'gameCoins'
  const [activeTab, setActiveTab] = useState('coins');

  // Balances
  const [goldCoins, setGoldCoins] = useState(currentUser?.coins || 0);
  const [diamonds, setDiamonds] = useState(currentUser?.diamonds || 0);
  const [gameCoins, setGameCoins] = useState(currentUser?.gameCoins || 0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Custom Exchange Modal State
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [exchanging, setExchanging] = useState(false);

  // Personal Tasks Modal for Diamonds Tab
  const [tasksModalVisible, setTasksModalVisible] = useState(false);

  // Recharge Methods Modal State
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(RECHARGE_PACKAGES[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PhonePe');
  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState(null);
  const [uploadingRefundQr, setUploadingRefundQr] = useState(false);
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Live Socket Listener for recharge approvals and rejections
  useEffect(() => {
    let socket = null;
    try {
      socket = io(BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      socket.on('recharge_status_updated', (data) => {
        const myId = currentUser?._id || currentUser?.id;
        if (data?.userId && myId && data.userId.toString() === myId.toString()) {
          fetchRechargeStatus();
          fetchWalletBalances(true);
          if (data.status === 'approved') {
            showToast(
              t('Recharge approved successfully! Coins added to wallet.') +
              (data.coinsAwarded ? ` (+${data.coinsAwarded} Coins)` : ''),
              'success'
            );
          } else if (data.status === 'rejected') {
            const reasonMsg = data.rejectionReason ? `: ${data.rejectionReason}` : '';
            showToast(t('Payment rejected') + reasonMsg, 'error');
          }
        }
      });
    } catch (err) {
      // quiet
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUser, fetchRechargeStatus, fetchWalletBalances, showToast, t]);

  // Copy Mobile Number to Clipboard (Primary - Zero Error Method)
  const handleCopyMobileNumber = async () => {
    try {
      await Clipboard.setStringAsync(OWNER_MOBILE_NUMBER);
      setCopiedNumber(true);
      showToast(
        t('Mobile number copied: ') +
        OWNER_MOBILE_NUMBER +
        t('. Paste in "To Mobile Number" in PhonePe/Paytm to pay.'),
        'success'
      );
      setTimeout(() => setCopiedNumber(false), 2500);
    } catch (e) {
      showToast(t('Failed to copy mobile number'), 'error');
    }
  };

  // Copy UPI ID to Clipboard (Method 1)
  const handleCopyUpiId = async () => {
    try {
      await Clipboard.setStringAsync(OWNER_UPI_ID);
      setCopiedUpi(true);
      showToast(t('UPI ID copied to clipboard: ') + OWNER_UPI_ID, 'success');
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (e) {
      showToast(t('Failed to copy UPI ID'), 'error');
    }
  };

  // Launch Specific Installed App (PhonePe, Paytm, Google Pay) with Mobile Number copied
  const handleLaunchPaymentApp = async (appType) => {
    // 1. Always copy Mobile Number to clipboard automatically
    await handleCopyMobileNumber();

    const rawPrice = selectedPackage?.price ? selectedPackage.price.replace(/[^0-9.]/g, '') : '22.2';
    const numericAmount = parseFloat(rawPrice) || 22.2;
    const commonParams = `pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_PAYEE_NAME)}&am=${numericAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Gold Coins Recharge')}`;

    // App-specific UPI schemes
    let appUrl = '';
    if (appType === 'phonepe') {
      appUrl = `phonepe://pay?${commonParams}`;
    } else if (appType === 'paytm') {
      appUrl = `paytmmp://pay?${commonParams}`;
    } else if (appType === 'gpay') {
      appUrl = `tez://upi/pay?${commonParams}`;
    }

    if (appUrl) {
      try {
        await Linking.openURL(appUrl);
        return;
      } catch (err) {
        // App specific scheme not supported or not installed, fallback to generic upi://
      }
    }

    // Fallback: Launch generic UPI chooser
    await handleOpenUpiApp();
  };

  // Launch Installed UPI App Directly via standard UPI intent (PhonePe / GPay / Paytm / BHIM)
  const handleOpenUpiApp = async () => {
    if (!selectedPackage) return;
    try {
      const rawPrice = selectedPackage.price.replace(/[^0-9.]/g, '');
      const numericAmount = parseFloat(rawPrice) || 22.2;

      // Standard NPCI UPI URI with verified payee name
      const upiUrl = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_PAYEE_NAME)}&am=${numericAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Gold Coins Recharge')}`;

      await Linking.openURL(upiUrl);
    } catch (e) {
      showToast(t('Could not launch UPI app. Please copy UPI ID or scan QR code.'), 'info');
    }
  };

  // Fetch Latest Balances from Backend
  const fetchWalletBalances = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await api.get('/users/wallet/balance');
      if (res.data?.success) {
        setGoldCoins(res.data.coins ?? 0);
        setDiamonds(res.data.diamonds ?? 0);
        setGameCoins(res.data.gameCoins ?? 0);
      }
    } catch (e) {
      // Fallback to profile
      try {
        const uid = currentUser?._id || currentUser?.id;
        if (uid) {
          const pRes = await api.get(`/users/${uid}/profile`);
          if (pRes.data?.success && pRes.data.user) {
            setGoldCoins(pRes.data.user.coins ?? 0);
            setDiamonds(pRes.data.user.diamonds ?? 0);
            setGameCoins(pRes.data.user.gameCoins ?? 0);
          }
        }
      } catch (err) {
        // silent
      }
    } finally {
      setRefreshing(false);
    }
  }, [currentUser]);

  // Fetch active recharge status from backend
  const fetchRechargeStatus = useCallback(async () => {
    try {
      const res = await api.get('/recharge/my-status');
      if (res.data?.success) {
        setRechargeStatus(res.data.request || null);
        if (res.data.coins !== undefined) {
          setGoldCoins(res.data.coins);
        }
      }
    } catch (e) {
      // quiet
    }
  }, []);

  useEffect(() => {
    fetchWalletBalances(true);
    fetchRechargeStatus();
  }, [fetchWalletBalances, fetchRechargeStatus]);

  // Handle Refresh Click on Coins Tab
  const handleRefreshBalance = async () => {
    await Promise.all([fetchWalletBalances(false), fetchRechargeStatus()]);
    showToast(t('Balance refreshed successfully'), 'success');
  };

  // Handle Package Card Click
  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setUtrNumber('');
    // If pending or proof_submitted request exists, user cannot make another purchase until approved
    if (rechargeStatus && (rechargeStatus.status === 'pending' || rechargeStatus.status === 'proof_submitted')) {
      setRechargeModalVisible(true);
      showToast(
        t('Your recharge request is pending approval. You cannot make another purchase until this order is confirmed.'),
        'info'
      );
      return;
    }
    // If rejected, acknowledge and clear rejected status so user can purchase coins again
    if (rechargeStatus && rechargeStatus.status === 'rejected') {
      if (rechargeStatus._id) {
        api.post(`/recharge/${rechargeStatus._id}/acknowledge`).catch(() => { });
      }
      setRechargeStatus(null);
    }
    setSelectedPaymentMethod('PhonePe');
    setRechargeModalVisible(true);
  };

  // Handle Submit Recharge
  const handleSubmitRecharge = async () => {
    if (!selectedPackage) return;

    // Strict 12-Digit UTR Validation
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      showToast(
        t('Please enter valid 12-digit UTR / UPI Reference Number from payment receipt'),
        'error'
      );
      return;
    }

    try {
      setSubmittingRecharge(true);
      const rawPrice = selectedPackage.price.replace(/[^0-9.]/g, '');
      const numericAmount = parseFloat(rawPrice) || 22.2;

      const res = await api.post('/recharge/request', {
        packageId: selectedPackage.id,
        coins: selectedPackage.coins,
        bonus: selectedPackage.bonus || 0,
        amount: numericAmount,
        currency: 'INR',
        priceDisplay: `${selectedPackage.price} INR`,
        paymentMethod: selectedPaymentMethod,
        utrNumber: cleanUtr,
      });

      if (res.data?.success) {
        showToast(
          t('Recharge request submitted successfully. Please wait for confirmation.'),
          'success'
        );
        setRechargeStatus(res.data.request);
        setUtrNumber('');
      } else {
        showToast(t(res.data?.message || 'Submission failed'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingRecharge(false);
    }
  };

  // Acknowledge approved or refunded notification
  const handleAcknowledgeRecharge = async (reqId) => {
    try {
      await api.post(`/recharge/${reqId}/acknowledge`);
      setRechargeStatus(null);
      await fetchWalletBalances(true);
      setRechargeModalVisible(false);
    } catch (e) {
      setRechargeModalVisible(false);
    }
  };

  // Upload user's refund QR code image
  const handlePickRefundQr = async (reqId) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;

        setUploadingRefundQr(true);
        const res = await api.post(`/recharge/${reqId}/upload-refund-qr`, {
          qrImage: base64Data,
        });

        if (res.data?.success) {
          showToast(
            t('Refund QR code uploaded successfully. Our team will process your refund shortly.'),
            'success'
          );
          setRechargeStatus(null);
          setRechargeModalVisible(false);
          await fetchWalletBalances(true);
        } else {
          showToast(t(res.data?.message || 'Upload failed'), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload QR code';
      console.error('Error uploading refund QR:', msg);
      showToast(t(msg), 'error');
    } finally {
      setUploadingRefundQr(false);
    }
  };

  // Upload user's payment proof screenshot for review / dispute
  const handlePickPaymentProof = async (reqId) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:image/jpeg;base64,${asset.base64}`;

        setUploadingPaymentProof(true);
        const res = await api.post(`/recharge/${reqId}/upload-payment-proof`, {
          proofImage: base64Data,
        });

        if (res.data?.success) {
          showToast(
            t('Payment proof submitted successfully. Owner will review your receipt.'),
            'success'
          );
          setRechargeStatus(res.data.request);
          await fetchWalletBalances(true);
        } else {
          showToast(t(res.data?.message || 'Upload failed'), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload payment proof';
      console.error('Error uploading payment proof:', msg);
      showToast(t(msg), 'error');
    } finally {
      setUploadingPaymentProof(false);
    }
  };

  // Handle Preset Game Coin Exchange
  const handlePresetExchange = async (preset) => {
    if (goldCoins < preset.goldCost) {
      showToast(
        t('Insufficient gold coins balance, please recharge first'),
        'error'
      );
      setActiveTab('coins');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/users/wallet/exchange-game-coins', {
        goldCoins: preset.goldCost,
      });

      if (res.data?.success) {
        setGoldCoins(res.data.coins);
        setGameCoins(res.data.gameCoins);
        showToast(
          t('Successfully exchanged') +
          ` ${preset.goldCost} ` +
          t('Coins') +
          ` ➔ ${preset.gameCoins.toLocaleString()} ` +
          t('Game Coins') +
          '!',
          'success'
        );
      } else {
        const errorMsg = res.data?.message || 'Exchange failed';
        if (errorMsg.toLowerCase().includes('insufficient')) {
          showToast(
            t('Insufficient gold coins balance, please recharge first'),
            'error'
          );
          setActiveTab('coins');
        } else {
          showToast(t(errorMsg), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Exchange failed';
      if (msg.toLowerCase().includes('insufficient')) {
        showToast(
          t('Insufficient gold coins balance, please recharge first'),
          'error'
        );
        setActiveTab('coins');
      } else {
        showToast(t(msg), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Custom Exchange Submit
  const handleCustomExchangeSubmit = async () => {
    const amount = parseInt(customAmount, 10);
    if (!amount || isNaN(amount) || amount <= 0) {
      showToast(t('Please enter a valid coin amount'), 'error');
      return;
    }

    if (amount > goldCoins) {
      showToast(
        t('Insufficient gold coins balance, please recharge first'),
        'error'
      );
      setCustomModalVisible(false);
      setActiveTab('coins');
      return;
    }

    try {
      setExchanging(true);
      const res = await api.post('/users/wallet/exchange-game-coins', {
        goldCoins: amount,
      });

      if (res.data?.success) {
        setGoldCoins(res.data.coins);
        setGameCoins(res.data.gameCoins);
        showToast(
          t('Successfully exchanged') +
          ` ${amount} ` +
          t('Coins') +
          ` ➔ ${(amount * 10).toLocaleString()} ` +
          t('Game Coins') +
          '!',
          'success'
        );
        setCustomAmount('');
        setCustomModalVisible(false);
      } else {
        const errorMsg = res.data?.message || 'Exchange failed';
        if (errorMsg.toLowerCase().includes('insufficient')) {
          showToast(
            t('Insufficient gold coins balance, please recharge first'),
            'error'
          );
          setCustomModalVisible(false);
          setActiveTab('coins');
        } else {
          showToast(t(errorMsg), 'error');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Exchange failed';
      if (msg.toLowerCase().includes('insufficient')) {
        showToast(
          t('Insufficient gold coins balance, please recharge first'),
          'error'
        );
        setCustomModalVisible(false);
        setActiveTab('coins');
      } else {
        showToast(t(msg), 'error');
      }
    } finally {
      setExchanging(false);
    }
  };

  // Render Coins Tab (Screenshot 1)
  const renderCoinsTab = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={[styles.tabContentContainer, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Large Coin & Balance */}
      <View style={styles.topBalanceWrap}>
        <Image source={GOLD_COIN_IMG} style={styles.topCoinImg} resizeMode="contain" />
        <Text style={styles.topBalanceText}>{goldCoins.toLocaleString()}</Text>
      </View>

      {/* Refresh Link */}
      <TouchableOpacity
        style={styles.refreshLink}
        activeOpacity={0.75}
        onPress={handleRefreshBalance}
      >
        <Text style={styles.refreshText}>
          <T>Refresh to check coin balance</T>
        </Text>
        <RefreshIcon size={15} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Pending Recharge Notification Banner */}
      {rechargeStatus && rechargeStatus.status === 'pending' && (
        <TouchableOpacity
          style={styles.pendingRechargeBanner}
          activeOpacity={0.85}
          onPress={() => setRechargeModalVisible(true)}
        >
          <Text style={styles.pendingBannerIcon}>⌛</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingBannerTitle}>
              <T>Recharge Pending Confirmation</T>
            </Text>
            <Text style={styles.pendingBannerSub}>
              {rechargeStatus.priceDisplay} • <T>Please wait for confirmation</T>
            </Text>
          </View>
          <ChevronRight size={18} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* 2-Column Grid of Coin Packages */}
      <View style={styles.packagesGrid}>
        {RECHARGE_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={styles.packageCard}
            activeOpacity={0.88}
            onPress={() => handlePackageClick(pkg)}
          >
            <View style={styles.packageCardInner}>
              <Image source={GOLD_COIN_IMG} style={styles.pkgCoinImg} resizeMode="contain" />
              <Text style={styles.pkgCoinsAmount}>{pkg.coins.toLocaleString()}</Text>
              {pkg.bonus > 0 ? (
                <Text style={styles.pkgBonusText}>+{pkg.bonus}</Text>
              ) : (
                <View style={styles.pkgBonusPlaceholder} />
              )}
            </View>

            {/* Bottom Purple Price Strip */}
            <LinearGradient
              colors={['#9333EA', '#7E22CE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pkgPriceButton}
            >
              <Text style={styles.pkgPriceText}>{pkg.price}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Help Center Link */}
      <TouchableOpacity
        style={styles.bottomHelpWrap}
        activeOpacity={0.7}
        onPress={() => showToast(t('Help Center coming soon'), 'info')}
      >
        <QuestionIcon size={15} color="rgba(255,255,255,0.85)" />
        <Text style={styles.bottomHelpText}>
          <T>Help Center</T>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render Diamonds Tab (Screenshot 2)
  const renderDiamondsTab = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={[styles.tabContentContainer, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Large Diamond & Balance */}
      <View style={styles.topBalanceWrap}>
        <Text style={styles.topDiamondEmoji}>💎</Text>
        <Text style={styles.topBalanceText}>{diamonds.toLocaleString()}</Text>
      </View>

      {/* Section 1: How to use Diamonds */}
      <View style={styles.diamondSection}>
        <Text style={styles.sectionHeaderTitle}>
          <T>How to use Diamonds</T>
        </Text>
        <Text style={styles.sectionBulletText}>
          <T>1. You can buy gifts with Diamonds</T>
        </Text>
        <Text style={styles.sectionBulletText}>
          <T>2. You can buy tools with Diamonds</T>
        </Text>

        {/* Store Button Pill */}
        <TouchableOpacity
          style={styles.actionPillButton}
          activeOpacity={0.85}
          onPress={() => showToast(t('Store coming soon'), 'info')}
        >
          <View style={styles.actionPillLeft}>
            <View style={styles.actionIconBox}>
              <StoreIcon size={22} color="#10B981" />
            </View>
            <Text style={styles.actionPillTitle}>
              <T>Store</T>
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Section 2: How to earn Diamond */}
      <View style={[styles.diamondSection, { marginTop: 24 }]}>
        <Text style={styles.sectionHeaderTitle}>
          <T>How to earn Diamond</T>
        </Text>
        <Text style={styles.sectionBulletText}>
          <T>Finish Daily Tasks can earn Diamond</T>
        </Text>

        {/* Earn Button Pill (Opens PersonalTasksModal) */}
        <TouchableOpacity
          style={styles.actionPillButton}
          activeOpacity={0.85}
          onPress={() => setTasksModalVisible(true)}
        >
          <View style={styles.actionPillLeft}>
            <View style={styles.actionIconBox}>
              <Text style={styles.earnDiamondEmoji}>💎</Text>
            </View>
            <Text style={styles.actionPillTitle}>
              <T>Earn</T>
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render Game Coins Tab (Screenshot 3)
  const renderGameCoinsTab = () => (
    <ScrollView
      style={styles.tabContentScroll}
      contentContainerStyle={[styles.tabContentContainer, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Large Green Crown Coin & Balance */}
      <View style={styles.topBalanceWrap}>
        <Image
          source={GREEN_COIN_IMG}
          style={styles.topGameCoinImg}
          resizeMode="contain"
        />
        <Text style={styles.topBalanceText}>{gameCoins.toLocaleString()}</Text>
      </View>

      {/* Rate Banner: 🪙 1 coins= 🟢 10 game coins */}
      <View style={styles.rateBannerRow}>
        <Image source={GOLD_COIN_IMG} style={styles.rateCoinImg} resizeMode="contain" />
        <Text style={styles.rateText}>1 coins= </Text>
        <Image
          source={GREEN_COIN_IMG}
          style={styles.rateCoinImg}
          resizeMode="contain"
        />
        <Text style={styles.rateText}>10 game coins</Text>
      </View>

      {/* Preset Exchange List */}
      <View style={styles.gamePresetsList}>
        {GAME_COIN_PRESETS.map((preset) => (
          <View key={preset.id} style={styles.gamePresetCard}>
            {/* Left: Green Coin + Amount */}
            <View style={styles.presetLeftGroup}>
              <Image
                source={GREEN_COIN_IMG}
                style={styles.presetCoinImg}
                resizeMode="contain"
              />
              <Text style={styles.presetAmountText}>
                {preset.gameCoins.toLocaleString()}
              </Text>
            </View>

            {/* Right: Exchange Button Pill with Gold Coin + Cost */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.presetExchangeBtn}
              onPress={() => handlePresetExchange(preset)}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2DD4BF', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.presetBtnGradient}
              >
                <Image
                  source={GOLD_COIN_IMG}
                  style={styles.presetGoldCostImg}
                  resizeMode="contain"
                />
                <Text style={styles.presetGoldCostText}>
                  {preset.goldCost.toLocaleString()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Custom Exchange Button */}
      <TouchableOpacity
        style={styles.customExchangeButton}
        activeOpacity={0.88}
        onPress={() => {
          setCustomAmount('');
          setCustomModalVisible(true);
        }}
      >
        <Text style={styles.customExchangeBtnText}>
          <T>Custom Exchange</T>
        </Text>
      </TouchableOpacity>

      {/* Bottom Description Link */}
      <TouchableOpacity
        style={styles.bottomHelpWrap}
        activeOpacity={0.7}
        onPress={() =>
          showToast(
            t('Exchange Rate: 1 Gold Coin = 10 Game Coins'),
            'info'
          )
        }
      >
        <QuestionIcon size={15} color="rgba(255,255,255,0.85)" />
        <Text style={styles.bottomHelpText}>
          <T>Description</T>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#42D16A', '#26C785', '#12B8A0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={styles.container}
    >
      {/* ══ HEADER ══ */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackArrowIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <T>Wallet</T>
        </Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => showToast(t('Transaction history coming soon'), 'info')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <HistoryIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ══ TOP TABS ROW (Coins | Diamonds | Game Coins) ══ */}
      <View style={styles.tabsRow}>
        {/* Tab 1: Coins */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('coins')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'coins' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            <T>Coins</T>
          </Text>
          {activeTab === 'coins' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        {/* Tab 2: Diamonds */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('diamonds')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'diamonds' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            <T>Diamonds</T>
          </Text>
          {activeTab === 'diamonds' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        {/* Tab 3: Game Coins */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.8}
          onPress={() => setActiveTab('gameCoins')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'gameCoins' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            <T>Game Coins</T>
          </Text>
          {activeTab === 'gameCoins' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ══ MAIN BODY CONTENT ══ */}
      {activeTab === 'coins' && renderCoinsTab()}
      {activeTab === 'diamonds' && renderDiamondsTab()}
      {activeTab === 'gameCoins' && renderGameCoinsTab()}

      {/* ══ CUSTOM EXCHANGE MODAL (Matching Screenshot 4) ══ */}
      <Modal
        visible={customModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setCustomModalVisible(false)}
          />

          <View style={styles.modalContentCard}>
            {/* Modal Title */}
            <Text style={styles.customModalTitle}>
              <T>Custom Exchange</T>
            </Text>

            {/* Coins Balance Indicator */}
            <Text style={styles.coinsBalanceLabel}>
              <T>Coins Balance:</T> {goldCoins}
            </Text>

            {/* Input Row Container */}
            <View style={styles.customInputRow}>
              <Image source={GOLD_COIN_IMG} style={styles.inputCoinImg} resizeMode="contain" />
              <TextInput
                style={styles.customTextInput}
                placeholder={t('Number of Coins')}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(val) => setCustomAmount(val.replace(/[^0-9]/g, ''))}
                maxLength={9}
              />
            </View>

            {/* Calculated Output Row */}
            <View style={styles.calculatedRow}>
              <Text style={styles.equalSign}>= </Text>
              <Image
                source={GREEN_COIN_IMG}
                style={styles.calculatedCoinImg}
                resizeMode="contain"
              />
              <Text style={styles.calculatedAmountText}>
                {customAmount && parseInt(customAmount, 10) > 0
                  ? (parseInt(customAmount, 10) * 10).toLocaleString()
                  : '0'}
              </Text>
            </View>

            {/* Exchange Action Button */}
            {customAmount && parseInt(customAmount, 10) > 0 ? (
              <TouchableOpacity
                style={styles.exchangeSubmitBtn}
                activeOpacity={0.85}
                onPress={handleCustomExchangeSubmit}
                disabled={exchanging}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.exchangeSubmitGradient}
                >
                  {exchanging ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.exchangeSubmitText}>
                      <T>Exchange</T>
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.exchangeSubmitDisabledBtn}>
                <Text style={styles.exchangeSubmitDisabledText}>
                  <T>Exchange</T>
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ══ PERSONAL TASKS MODAL (Daily Tasks for Diamonds) ══ */}
      <PersonalTasksModal
        visible={tasksModalVisible}
        onClose={() => {
          setTasksModalVisible(false);
          fetchWalletBalances(true);
        }}
        currentUser={currentUser}
        onDiamondsClaimed={(newDiamonds) => {
          if (newDiamonds !== undefined) {
            setDiamonds(newDiamonds);
          }
        }}
      />

      {/* ══ RECHARGE METHODS MODAL (Matching Screenshot 1 & 2 with PhonePe QR) ══ */}
      <Modal
        visible={rechargeModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setRechargeModalVisible(false)}
      >
        <View style={[styles.rechargeModalContainer, { paddingTop: Math.max(16, insets.top) }]}>
          {/* Header */}
          <View style={styles.rechargeModalHeader}>
            <TouchableOpacity
              style={styles.rechargeBackBtn}
              onPress={() => setRechargeModalVisible(false)}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <BackArrowIcon size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.rechargeHeaderTitle}>
              <T>Recharge Methods</T>
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.rechargeScroll}
            contentContainerStyle={[styles.rechargeScrollContent, { paddingBottom: insets.bottom + 30 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Recharge Amount Display (Matching Screenshot 1) */}
            <View style={styles.rechargeAmountSection}>
              <Text style={styles.rechargeAmountLabel}>
                <T>Recharge amount:</T>
              </Text>
              <Text style={styles.rechargeAmountValue}>
                {selectedPackage?.price || '₹22.20'} INR
              </Text>
              <View style={styles.rechargeCoinsBadge}>
                <Image source={GOLD_COIN_IMG} style={{ width: 16, height: 16, marginRight: 6 }} resizeMode="contain" />
                <Text style={styles.rechargeCoinsText}>
                  {selectedPackage?.coins?.toLocaleString() || '200'} <T>Coins</T>
                  {selectedPackage?.bonus > 0 ? ` (+${selectedPackage.bonus})` : ''}
                </Text>
              </View>
            </View>

            {/* CASE 1: Pending Order State */}
            {rechargeStatus && rechargeStatus.status === 'pending' ? (
              <View style={styles.statusBoxPending}>
                <Text style={styles.statusBoxIcon}>⌛</Text>
                <Text style={styles.statusBoxTitle}>
                  <T>Please wait for confirmation</T>
                </Text>
                <Text style={styles.statusBoxSub}>
                  <T>Your payment of</T> {rechargeStatus.priceDisplay} <T>is being verified by admin. You cannot make another purchase until this order is confirmed.</T>
                </Text>

                <View style={styles.statusDetailsCard}>
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Order Amount:</T></Text>
                    <Text style={styles.statusDetailsVal}>₹{rechargeStatus.amount}</Text>
                  </View>
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Payment App:</T></Text>
                    <Text style={styles.statusDetailsVal}>{rechargeStatus.paymentMethod}</Text>
                  </View>
                  {rechargeStatus.utrNumber ? (
                    <View style={styles.statusDetailsRow}>
                      <Text style={styles.statusDetailsLabel}><T>UTR No.:</T></Text>
                      <Text style={[styles.statusDetailsVal, { color: '#38BDF8', letterSpacing: 0.5 }]}>
                        {rechargeStatus.utrNumber}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Status:</T></Text>
                    <Text style={[styles.statusDetailsVal, { color: '#F59E0B' }]}>
                      <T>Pending Approval</T>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.refreshStatusBtn}
                  activeOpacity={0.8}
                  onPress={async () => {
                    await fetchRechargeStatus();
                    showToast(t('Status refreshed'), 'info');
                  }}
                >
                  <Text style={styles.refreshStatusBtnText}>
                    <T>Refresh Status</T>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : rechargeStatus && rechargeStatus.status === 'proof_submitted' ? (
              /* CASE 2: Payment Proof Submitted State (Under Review) */
              <View style={styles.statusBoxProofSubmitted}>
                <Text style={styles.statusBoxIcon}>🧾</Text>
                <Text style={styles.statusBoxTitleProof}>
                  <T>Payment Proof Submitted</T>
                </Text>
                <Text style={styles.statusBoxSubProof}>
                  <T>Your payment receipt is under review by owner. Coins will be credited to your wallet once verified.</T>
                </Text>

                <View style={styles.statusDetailsCard}>
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Order Amount:</T></Text>
                    <Text style={styles.statusDetailsVal}>₹{rechargeStatus.amount}</Text>
                  </View>
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Payment App:</T></Text>
                    <Text style={styles.statusDetailsVal}>{rechargeStatus.paymentMethod}</Text>
                  </View>
                  {rechargeStatus.utrNumber ? (
                    <View style={styles.statusDetailsRow}>
                      <Text style={styles.statusDetailsLabel}><T>UTR No.:</T></Text>
                      <Text style={[styles.statusDetailsVal, { color: '#38BDF8', letterSpacing: 0.5 }]}>
                        {rechargeStatus.utrNumber}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.statusDetailsRow}>
                    <Text style={styles.statusDetailsLabel}><T>Status:</T></Text>
                    <Text style={[styles.statusDetailsVal, { color: '#38BDF8', fontWeight: '800' }]}>
                      <T>Under Review</T>
                    </Text>
                  </View>
                </View>

                {/* Uploaded Payment Proof Thumbnail Preview */}
                {rechargeStatus.paymentProofImage ? (
                  <View style={styles.proofPreviewWrap}>
                    <Image
                      source={{ uri: rechargeStatus.paymentProofImage }}
                      style={styles.proofPreviewImg}
                      resizeMode="contain"
                    />
                    <Text style={styles.proofUploadedNoticeText}>
                      ✓ <T>Receipt uploaded. Please wait for owner confirmation.</T>
                    </Text>
                    <TouchableOpacity
                      style={styles.reuploadBtn}
                      activeOpacity={0.8}
                      onPress={() => handlePickPaymentProof(rechargeStatus._id)}
                      disabled={uploadingPaymentProof}
                    >
                      <Text style={styles.reuploadBtnText}>
                        <T>Change Payment Proof</T>
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.refreshStatusBtn, { marginTop: 14 }]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    await fetchRechargeStatus();
                    showToast(t('Status refreshed'), 'info');
                  }}
                >
                  <Text style={styles.refreshStatusBtnText}>
                    <T>Refresh Status</T>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusDoneBtn, { backgroundColor: '#475569', marginTop: 10 }]}
                  activeOpacity={0.85}
                  onPress={() => setRechargeModalVisible(false)}
                >
                  <Text style={styles.statusDoneBtnText}>
                    <T>Close</T>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : rechargeStatus && rechargeStatus.status === 'approved' && !rechargeStatus.isAcknowledged ? (
              /* CASE 3: Approved Order State */
              <View style={styles.statusBoxApproved}>
                <Text style={styles.statusBoxIcon}>✅</Text>
                <Text style={styles.statusBoxTitleApproved}>
                  <T>Payment approved successfully for amount</T> ₹{rechargeStatus.amount}!
                </Text>
                <Text style={styles.statusBoxSub}>
                  <T>Your gold coins have been added to your wallet balance successfully.</T>
                </Text>

                <TouchableOpacity
                  style={styles.statusDoneBtn}
                  activeOpacity={0.85}
                  onPress={() => handleAcknowledgeRecharge(rechargeStatus._id)}
                >
                  <Text style={styles.statusDoneBtnText}>
                    <T>Got It</T>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : rechargeStatus && rechargeStatus.status === 'rejected' && !rechargeStatus.isAcknowledged ? (
              /* CASE 4: Rejected Order State (with Proof upload & Refund QR upload) */
              <View style={styles.statusBoxRejected}>
                <Text style={styles.statusBoxIcon}>❌</Text>
                <Text style={styles.statusBoxTitleRejected}>
                  <T>Payment rejected for amount</T> ₹{rechargeStatus.amount}
                </Text>

                {/* Rejection Reason Display from Owner */}
                {(rechargeStatus.rejectionReason || rechargeStatus.adminNote) ? (
                  <View style={styles.rejectionReasonCard}>
                    <Text style={styles.rejectionReasonTitle}>
                      ⚠️ <T>Reason for Rejection:</T>
                    </Text>
                    <Text style={styles.rejectionReasonBody}>
                      {rechargeStatus.rejectionReason || rechargeStatus.adminNote}
                    </Text>
                  </View>
                ) : null}

                {/* 1. DISPUTE / PROOF SUBMISSION: If user paid successfully, upload proof */}
                <View style={styles.disputeSectionCard}>
                  <Text style={styles.disputeSectionTitle}>
                    ❓ <T>If you have any query about this rejection then upload payment proof or if you want a refund then upload your refund QR code</T>
                  </Text>
                  <Text style={styles.disputeSectionSub}>
                    <T>Upload your payment screenshot below so owner can verify and approve your coins.</T>
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadPaymentProofBtn}
                    activeOpacity={0.85}
                    onPress={() => handlePickPaymentProof(rechargeStatus._id)}
                    disabled={uploadingPaymentProof}
                  >
                    {uploadingPaymentProof ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.uploadPaymentProofBtnText}>
                        🧾 📷 <T>Upload Payment Proof (Receipt)</T>
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider between Proof and Refund */}
                <Text style={styles.rejectedOrDivider}>
                  ── <T>OR Request Refund Below</T> ──
                </Text>

                {/* 2. REFUND QR: If user agrees with rejection and wants refund */}
                {rechargeStatus.refundQrImage ? (
                  <View style={styles.refundPreviewWrap}>
                    <Image
                      source={{ uri: rechargeStatus.refundQrImage }}
                      style={styles.refundPreviewImg}
                      resizeMode="contain"
                    />
                    <Text style={styles.refundUploadedText}>
                      ✓ <T>Refund QR code uploaded. Admin will refund shortly.</T>
                    </Text>
                    <TouchableOpacity
                      style={styles.reuploadBtn}
                      activeOpacity={0.8}
                      onPress={() => handlePickRefundQr(rechargeStatus._id)}
                      disabled={uploadingRefundQr}
                    >
                      <Text style={styles.reuploadBtnText}>
                        <T>Change QR Code</T>
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadRefundQrBtn}
                    activeOpacity={0.85}
                    onPress={() => handlePickRefundQr(rechargeStatus._id)}
                    disabled={uploadingRefundQr}
                  >
                    {uploadingRefundQr ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.uploadRefundQrBtnText}>
                        📷 <T>Upload Your Refund QR Code</T>
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.statusDoneBtn, { backgroundColor: '#64748B', marginTop: 14 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (rechargeStatus?._id) {
                      handleAcknowledgeRecharge(rechargeStatus._id);
                    } else {
                      setRechargeStatus(null);
                      setRechargeModalVisible(false);
                    }
                  }}
                >
                  <Text style={styles.statusDoneBtnText}>
                    <T>Close</T>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* CASE 4: Normal Direct Mobile Number & UPI Payment Flow */
              <View style={styles.rechargePaymentCard}>
                {/* 1. Recommended Method: Pay via Mobile Number (Zero Error) */}
                <View style={styles.mobilePayCard}>
                  <View style={styles.mobilePayBadgeRow}>
                    <View style={styles.recommendedPill}>
                      <Text style={styles.recommendedPillText}>★ <T>RECOMMENDED • ZERO ERROR</T></Text>
                    </View>
                  </View>

                  <View style={styles.mobilePayMainRow}>
                    <View style={styles.mobilePayLeft}>
                      <Text style={styles.mobilePayLabel}>
                        <T>Official Payment Mobile Number</T>
                      </Text>
                      <Text style={styles.mobilePayNumber}>{OWNER_MOBILE_NUMBER}</Text>
                      <Text style={styles.mobilePayName}>
                        <T>Verified Name:</T> {OWNER_PAYEE_NAME}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyNumberBtn, copiedNumber && styles.copyNumberBtnSuccess]}
                      activeOpacity={0.8}
                      onPress={handleCopyMobileNumber}
                    >
                      <Text style={styles.copyNumberBtnText}>
                        {copiedNumber ? '✓ ' + t('Copied!') : '📋 ' + t('Copy Number')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 2 Simple Steps */}
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionLine}>
                      1️⃣ <T>Copy number above</T>
                    </Text>
                    <Text style={styles.instructionLine}>
                      2️⃣ <T>Open PhonePe or Paytm, select "To Mobile Number", paste 7982720270, and pay. Then enter UTR below.</T>
                    </Text>
                  </View>
                </View>

                {/* Quick App Openers (Copies Mobile Number & Opens Selected App with Authentic Icons) */}
                <View style={styles.quickAppsSection}>
                  <Text style={styles.quickAppsSectionLabel}>
                    <T>Copy Number & Open Payment App:</T>
                  </Text>
                  <View style={styles.quickAppsGrid}>
                    <TouchableOpacity
                      style={styles.quickAppChip}
                      activeOpacity={0.8}
                      onPress={() => handleLaunchPaymentApp('phonepe')}
                    >
                      <PhonePeIcon size={24} />
                      <Text style={styles.quickAppChipText}>PhonePe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickAppChip}
                      activeOpacity={0.8}
                      onPress={() => handleLaunchPaymentApp('gpay')}
                    >
                      <GooglePayIcon size={24} />
                      <Text style={styles.quickAppChipText}>Google Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.quickAppChip}
                      activeOpacity={0.8}
                      onPress={() => handleLaunchPaymentApp('paytm')}
                    >
                      <PaytmIcon size={24} />
                      <Text style={styles.quickAppChipText}>Paytm</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Divider: OR SCAN QR / PAY VIA UPI ID */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orDividerLine} />
                  <Text style={styles.orDividerText}>
                    <T>OR SCAN QR / UPI ID</T>
                  </Text>
                  <View style={styles.orDividerLine} />
                </View>

                {/* QR Code Container */}
                <View style={styles.qrDisplayBox}>
                  <Image
                    source={RECHARGE_QR_IMG}
                    style={styles.rechargeQrImg}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[styles.qrCopyTagBtn, copiedUpi && styles.qrCopyTagBtnSuccess]}
                    activeOpacity={0.8}
                    onPress={handleCopyUpiId}
                  >
                    <Text style={styles.qrCopyTagText}>
                      📋 {OWNER_UPI_ID} {copiedUpi ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.payeeNameHint}>
                    ({OWNER_PAYEE_NAME})
                  </Text>
                </View>

                {/* Mode of Payment Selector with Brand Icons */}
                <View style={styles.paymentMethodSection}>
                  <Text style={styles.paymentMethodLabel}>
                    <T>Select Payment App Used:</T>
                  </Text>
                  <View style={styles.paymentMethodsGrid}>
                    {['PhonePe', 'Google Pay', 'Paytm', 'Amazon Pay', 'Other UPI'].map((mode) => {
                      const isSelected = selectedPaymentMethod === mode;
                      return (
                        <TouchableOpacity
                          key={mode}
                          style={[
                            styles.paymentMethodChip,
                            isSelected && styles.paymentMethodChipActive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedPaymentMethod(mode)}
                        >
                          {mode === 'PhonePe' && <PhonePeIcon size={18} />}
                          {mode === 'Google Pay' && <GooglePayIcon size={18} />}
                          {mode === 'Paytm' && <PaytmIcon size={18} />}
                          {mode === 'Other UPI' && <BhimUpiIcon size={18} />}
                          <Text
                            style={[
                              styles.paymentMethodChipText,
                              isSelected && styles.paymentMethodChipTextActive,
                            ]}
                          >
                            {mode}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Mandatory 12-Digit UTR Input Section */}
                <View style={styles.utrInputSection}>
                  <View style={styles.utrHeaderRow}>
                    <Text style={styles.utrInputLabel}>
                      <T>12-Digit UTR / UPI Ref Number</T> <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <Text style={[styles.utrCounterText, utrNumber.length === 12 && styles.utrCounterTextValid]}>
                      {utrNumber.length}/12
                    </Text>
                  </View>
                  <Text style={styles.utrInputSubHint}>
                    <T>Mandatory: Found in your UPI app receipt after payment</T>
                  </Text>
                  <View style={[styles.utrInputWrap, utrNumber.length === 12 && styles.utrInputWrapValid]}>
                    <Text style={styles.utrIconPrefix}>🔢</Text>
                    <TextInput
                      style={styles.utrTextInput}
                      placeholder={t('Enter 12-digit UTR (e.g. 429182746192)')}
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={utrNumber}
                      onChangeText={(val) => setUtrNumber(val.replace(/[^0-9]/g, ''))}
                      maxLength={12}
                    />
                    {utrNumber.length === 12 && (
                      <Text style={styles.utrCheckmark}>✓</Text>
                    )}
                  </View>
                </View>

                {/* Submit Payment Request Button */}
                <TouchableOpacity
                  style={[
                    styles.submitPaymentBtn,
                    utrNumber.length !== 12 && styles.submitPaymentBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleSubmitRecharge}
                  disabled={submittingRecharge}
                >
                  <LinearGradient
                    colors={utrNumber.length === 12 ? ['#10B981', '#059669'] : ['#94A3B8', '#64748B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitPaymentGradient}
                  >
                    {submittingRecharge ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitPaymentText}>
                        <T>Submit Payment Request</T>
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer Support Info (Exact from Screenshot 1) */}
            <View style={styles.rechargeFooterWrap}>
              <Text style={styles.rechargeFooterText}>
                If you have any problem with recharge, please contact Email recharge@funshareapp.com or WhatsApp +86 18506902526
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  tabLabelInactive: {
    color: '#FFFFFF',
    opacity: 0.72,
  },
  activeTabIndicator: {
    width: 44,
    height: 3.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginTop: 6,
  },
  tabContentScroll: {
    flex: 1,
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  // Top Balance
  topBalanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  topCoinImg: {
    width: 52,
    height: 52,
  },
  topGameCoinImg: {
    width: 54,
    height: 54,
  },
  topDiamondEmoji: {
    fontSize: 52,
    textAlign: 'center',
    lineHeight: 58,
  },
  topBalanceText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Refresh Link
  refreshLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    opacity: 0.95,
  },
  refreshText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Packages Grid
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 14,
  },
  packageCard: {
    width: (SCREEN_WIDTH - 44) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  packageCardInner: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  pkgCoinImg: {
    width: 38,
    height: 38,
    marginBottom: 8,
  },
  pkgCoinsAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pkgBonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  pkgBonusPlaceholder: {
    height: 15,
    marginTop: 2,
  },
  pkgPriceButton: {
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pkgPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Help Center / Description
  bottomHelpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    marginBottom: 16,
  },
  bottomHelpText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.92,
  },
  // Diamonds Tab Section
  diamondSection: {
    width: '100%',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionBulletText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
  },
  actionPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    width: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnDiamondEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  actionPillTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  // Game Coins Tab
  rateBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 14,
    marginLeft: 4,
  },
  rateCoinImg: {
    width: 18,
    height: 18,
  },
  rateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  gamePresetsList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  gamePresetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  presetLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetCoinImg: {
    width: 36,
    height: 36,
  },
  presetAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  presetExchangeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  presetBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 22,
    gap: 6,
    borderRadius: 20,
  },
  presetGoldCostImg: {
    width: 19,
    height: 19,
  },
  presetGoldCostText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  customExchangeButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customExchangeBtnText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Custom Exchange Modal (Screenshot 4)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  coinsBalanceLabel: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 10,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    gap: 8,
  },
  inputCoinImg: {
    width: 24,
    height: 24,
  },
  customTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    paddingVertical: 0,
  },
  calculatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingLeft: 4,
    gap: 8,
  },
  equalSign: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  calculatedCoinImg: {
    width: 26,
    height: 26,
  },
  calculatedAmountText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  exchangeSubmitBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  exchangeSubmitGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  exchangeSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  exchangeSubmitDisabledBtn: {
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeSubmitDisabledText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ══ PENDING RECHARGE BANNER (Coins Tab) ══
  pendingRechargeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 16,
    gap: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pendingBannerIcon: {
    fontSize: 22,
  },
  pendingBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  pendingBannerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 2,
  },

  // ══ RECHARGE METHODS MODAL STYLES (Screenshot 1 & 2) ══
  rechargeModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rechargeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rechargeBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  rechargeScroll: {
    flex: 1,
  },
  rechargeScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    alignItems: 'stretch',
  },

  // Recharge Amount Section (Screenshot 1 top)
  rechargeAmountSection: {
    marginBottom: 20,
  },
  rechargeAmountLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  rechargeAmountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  rechargeCoinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  rechargeCoinsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },

  // Case 1: Status Box Pending
  statusBoxPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBoxIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  statusBoxTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBoxSub: {
    fontSize: 13.5,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusDetailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  statusDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDetailsLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  statusDetailsVal: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  refreshStatusBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  refreshStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Case 2: Status Box Proof Submitted (Under Review)
  statusBoxProofSubmitted: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBoxTitleProof: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0369A1',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusBoxSubProof: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0284C7',
    textAlign: 'center',
    marginBottom: 16,
  },
  proofPreviewWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    width: '100%',
    marginVertical: 12,
  },
  proofPreviewImg: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  proofUploadedNoticeText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Case 3: Status Box Approved
  statusBoxApproved: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBoxTitleApproved: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDoneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    marginTop: 16,
  },
  statusDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Case 3: Status Box Rejected
  statusBoxRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBoxTitleRejected: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 6,
  },
  statusBoxSubRejected: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 16,
  },
  rejectionReasonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectionReasonTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 4,
  },
  rejectionReasonBody: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 19,
  },
  disputeSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  disputeSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#4338CA',
    textAlign: 'center',
    marginBottom: 4,
  },
  disputeSectionSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  uploadPaymentProofBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadPaymentProofBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  rejectedOrDivider: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  refundPreviewWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
  },
  refundPreviewImg: {
    width: 140,
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },
  refundUploadedText: {
    fontSize: 12.5,
    color: '#15803D',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  reuploadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  reuploadBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  uploadRefundQrBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadRefundQrBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Case 4: Normal Direct UPI & QR Card Flow
  rechargePaymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 24,
  },
  // Direct Pay via UPI App Button
  directUpiBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  directUpiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  directUpiIcon: {
    fontSize: 26,
  },
  directUpiTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  directUpiSub: {
    color: '#E0E7FF',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  directUpiArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  // Divider
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
    gap: 10,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  orDividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  // QR Container
  qrDisplayBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: '100%',
    maxWidth: 290,
    marginBottom: 18,
  },
  rechargeQrImg: {
    width: 210,
    height: 210,
    marginBottom: 10,
  },
  // Mobile Pay Card (Recommended)
  mobilePayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  mobilePayBadgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  recommendedPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  recommendedPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  mobilePayMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobilePayLeft: {
    flex: 1,
    marginRight: 10,
  },
  mobilePayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mobilePayNumber: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  mobilePayName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  copyNumberBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  copyNumberBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyNumberBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  instructionLine: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  // Security Tip
  upiSecurityTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
    width: '100%',
  },
  upiSecurityTipIcon: {
    fontSize: 16,
  },
  upiSecurityTipText: {
    fontSize: 11.5,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  // Copy UPI Card
  copyUpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  copyUpiLeft: {
    flex: 1,
    marginRight: 10,
  },
  copyUpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyUpiIdText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  copyUpiNameText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  copyUpiActionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  copyUpiActionBtnSuccess: {
    backgroundColor: '#10B981',
  },
  copyUpiActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Quick Apps Section
  quickAppsSection: {
    width: '100%',
    marginBottom: 12,
  },
  quickAppsSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  quickAppsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  quickAppChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'column',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAppChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  // QR Copy Tag
  qrCopyTagBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginTop: 4,
    marginBottom: 4,
  },
  qrCopyTagBtnSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  qrCopyTagText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  upiIdTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 4,
  },
  upiIdTagLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  upiIdTagValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
  payeeNameHint: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  paymentMethodSection: {
    width: '100%',
    marginBottom: 18,
  },
  paymentMethodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentMethodChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  paymentMethodChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  paymentMethodChipTextActive: {
    color: '#059669',
  },
  // 12-Digit UTR Section
  utrInputSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  utrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  utrInputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  utrCounterText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  utrCounterTextValid: {
    color: '#10B981',
  },
  utrInputSubHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  utrInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  utrInputWrapValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  utrIconPrefix: {
    fontSize: 16,
  },
  utrTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 0,
  },
  utrCheckmark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  // Submit Button
  submitPaymentBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPaymentBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitPaymentGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPaymentText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Footer Support Notice (Screenshot 1 bottom)
  rechargeFooterWrap: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rechargeFooterText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
