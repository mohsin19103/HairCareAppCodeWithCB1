import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

class NotificationService {
  navigationRef = null;

  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  async requestUserPermission() {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('📱 iOS Permission Status:', authStatus);
        return enabled;
      } else {
        // For Android 13+ (API level 33+)
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('📱 Android 13+ Permission:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        console.log('📱 Android <13: Permission granted by default');
        return true;
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      console.log('🔑 FCM Token:', token);
      console.log('📋 Copy this token to test notifications!');
      
      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  async createNotificationChannels() {
    try {
      const channels = [
        {
          id: 'default',
          name: 'General Notifications',
          description: 'General app notifications and updates',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#218b21ff',
        },
        {
          id: 'hair_analysis',
          name: 'Hair Analysis Results',
          description: 'Notifications for completed hair analysis',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#218b21ff',
        },
        {
          id: 'reports',
          name: 'Reports & Insights',
          description: 'New reports and personalized insights',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#f59e0b',
        },
        {
          id: 'reminders',
          name: 'Care Reminders',
          description: 'Hair care routine reminders',
          importance: AndroidImportance.DEFAULT,
          sound: 'default',
          vibration: true,
        }
      ];

      for (const channel of channels) {
        await notifee.createChannel(channel);
        console.log(`📢 Channel created: ${channel.name}`);
      }
    } catch (error) {
      console.error('❌ Error creating channels:', error);
    }
  }

  async displayNotification(title, body, data = {}, channelId = 'default') {
    try {
      await notifee.requestPermission();

      // Convert all data values to strings (Notifee requirement)
      const stringData = {};
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          stringData[key] = String(data[key]);
        });
      }

      await notifee.displayNotification({
        title,
        body,
        data: stringData,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_launcher',
          color: '#218b21ff',
          style: {
            type: 1, // BigTextStyle
            text: body,
          },
          vibrationPattern: [300, 500],
          showTimestamp: true,
          lights: ['#218b21ff', 300, 600],
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
      
      console.log('✅ Notification displayed:', title);
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
    }
  }

  handleNotificationNavigation(remoteMessage) {
    if (!this.navigationRef || !remoteMessage?.data) {
      console.log('⚠️ Navigation ref or data missing');
      return;
    }

    const { screen, ...params } = remoteMessage.data;
    console.log('🧭 Navigating to:', screen, params);

    if (screen && this.navigationRef.isReady()) {
      try {
        // Parse any stringified data back to proper types
        const parsedParams = {};
        Object.keys(params).forEach(key => {
          try {
            parsedParams[key] = JSON.parse(params[key]);
          } catch {
            parsedParams[key] = params[key];
          }
        });
        
        this.navigationRef.navigate(screen, parsedParams);
        console.log('✅ Navigation successful');
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    }
  }

  async subscribeToTopics() {
    try {
      // Subscribe to topics (make sure these match your backend topics)
      const topics = ['all_users', 'hair_analysis', 'reports'];
      
      for (const topic of topics) {
        await messaging().subscribeToTopic(topic);
        console.log(`📬 Subscribed to topic: ${topic}`);
      }
    } catch (error) {
      console.error('❌ Error subscribing to topics:', error);
    }
  }

  setupNotificationListeners() {
    console.log('🎧 Setting up notification listeners...');

    // FOREGROUND - App is open and in use
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📨 FOREGROUND notification received:', JSON.stringify(remoteMessage, null, 2));
      
      if (remoteMessage.notification) {
        await this.displayNotification(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || '',
          remoteMessage.data || {},
          remoteMessage.data?.channelId || 'default'
        );
      }
    });

    // BACKGROUND - App is in background
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📨 BACKGROUND notification received:', JSON.stringify(remoteMessage, null, 2));
      
      if (remoteMessage.notification) {
        await this.displayNotification(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || '',
          remoteMessage.data || {},
          remoteMessage.data?.channelId || 'default'
        );
      }
      
      return Promise.resolve();
    });

    // QUIT STATE - App was completely closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📨 QUIT STATE notification opened app:', JSON.stringify(remoteMessage, null, 2));
          setTimeout(() => {
            this.handleNotificationNavigation(remoteMessage);
          }, 1000);
        }
      });

    // BACKGROUND STATE - App was in background
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📨 BACKGROUND STATE notification opened app:', JSON.stringify(remoteMessage, null, 2));
      this.handleNotificationNavigation(remoteMessage);
    });

    // Notifee events (for local notifications)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('🔔 Notifee event:', type, detail);
      
      if (type === EventType.PRESS && detail?.notification?.data) {
        this.handleNotificationNavigation({ data: detail.notification.data });
      }
    });

    // Notifee background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('🔔 Notifee background event:', type, detail);
      
      if (type === EventType.PRESS && detail?.notification?.data) {
        this.handleNotificationNavigation({ data: detail.notification.data });
      }
    });

    console.log('✅ All notification listeners registered');

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeNotifee();
    };
  }

  async checkNotificationSettings() {
    try {
      const settings = await notifee.getNotificationSettings();
      console.log('⚙️ Notification Settings:', settings);
      
      if (settings.android.alarm === -1) {
        console.log('⚠️ Alarm permission not granted');
      }
      
      return settings;
    } catch (error) {
      console.error('❌ Error checking settings:', error);
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Notification Service...');
      
      // Step 1: Request permissions
      const hasPermission = await this.requestUserPermission();
      console.log('✅ Permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ Notification permission denied');
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Step 2: Create notification channels (Android)
      await this.createNotificationChannels();
      
      // Step 3: Get FCM token
      const token = await this.getFCMToken();
      
      if (!token) {
        console.log('❌ Failed to get FCM token');
        return;
      }
      
      // Step 4: Subscribe to topics
      await this.subscribeToTopics();
      
      // Step 5: Setup listeners
      this.setupNotificationListeners();
      
      // Step 6: Check notification settings
      await this.checkNotificationSettings();
      
      // Step 7: Listen for token refresh
      messaging().onTokenRefresh(newToken => {
        console.log('🔄 FCM Token refreshed:', newToken);
        // TODO: Send updated token to your server
      });
      
      console.log('✅ Notification Service initialized successfully!');
      
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  }
}

export default new NotificationService();