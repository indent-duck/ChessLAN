import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ConnectionTypeSelect() {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleWiFiPress = () => {
    navigation.navigate('HomeWiFi' as never);
  };

  const handleHotspotPress = () => {
    navigation.navigate('HomeHotspot' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Connection Type</Text>
        <View style={styles.backButton} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideTranslate }],
          },
        ]}
      >
        <Text style={styles.title}>How do you want to connect?</Text>
        <Text style={styles.subtitle}>
          Select your preferred connection method
        </Text>

        {/* WiFi Network Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleWiFiPress}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.iconText}>📶</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Same WiFi Network</Text>
            <Text style={styles.cardDescription}>
              Both players connect to the same WiFi network
            </Text>
            <Text style={styles.cardSubtext}>Requires existing WiFi router</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Phone Hotspot Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleHotspotPress}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.iconText}>📡</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Phone Hotspot</Text>
            <Text style={styles.cardDescription}>
              Host creates hotspot, guest connects to it
            </Text>
            <Text style={styles.cardSubtext}>Works anywhere, no WiFi needed</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'GoogleSansFlex-Medium',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'GoogleSansFlex-Bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'GoogleSansFlex',
    color: '#666',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'GoogleSansFlex-Bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'GoogleSansFlex',
    color: '#666',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    fontFamily: 'GoogleSansFlex',
    color: '#999',
  },
  cardArrow: {
    fontSize: 32,
    color: '#1e6b40',
    marginLeft: 8,
  },
});
