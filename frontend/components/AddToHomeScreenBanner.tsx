import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function AddToHomeScreenBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we should show the banner
    const shouldShowBanner = () => {
      // Only show on iOS
      if (Platform.OS !== 'web') return false;
      
      // Check if running in browser
      if (typeof window === 'undefined') return false;
      
      // Check if already in standalone mode (already added to home screen)
      const isStandalone = (window.navigator as any).standalone === true;
      if (isStandalone) return false;
      
      // Check if iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (!isIOS) return false;
      
      // Check if Safari (not Chrome or other browsers on iOS)
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
      if (!isSafari) return false;
      
      return true;
    };

    if (shouldShowBanner()) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.message}>
            Add to Home Screen for the best experience: tap the Share icon below, then "Add to Home Screen"
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => setIsVisible(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    color: theme.colors.white,
    lineHeight: 18,
  },
  dismissButton: {
    flexShrink: 0,
    padding: theme.spacing.xs,
  },
});
