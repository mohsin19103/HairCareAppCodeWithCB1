import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationService from '../Services/NotificationService';

const NotificationBell = ({ onPress, size = 26, color = '#2e7d32' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listen for notification count updates
    const unsubscribe = NotificationService.addListener('bell', (notification) => {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        
        // Animate the bell icon
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
        ]).start();

        // Animate badge with bounce effect
        Animated.sequence([
          Animated.timing(badgeAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(badgeAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();

        return newCount;
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle press with animation
  const handlePress = () => {
    // Add a subtle scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the provided onPress function
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={styles.container}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons 
          name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
          size={size} 
          color={unreadCount > 0 ? "#FF3B30" : color}
        />
      </Animated.View>
      
      {unreadCount > 0 && (
        <Animated.View 
          style={[
            styles.badge,
            { transform: [{ scale: badgeAnim }] }
          ]}
        >
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default NotificationBell;