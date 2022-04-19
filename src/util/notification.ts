import * as Notifications from 'expo-notifications';

interface HarkNotificationSegment {
  text?: string;
  ship?: string;
  url?: string;
}

export const getNotificationValues = (values: HarkNotificationSegment[]) =>
  values.map(({ text, ship, url }) => text || ship || url || '').join(' ');

export const getPushNotificationToken = async () => {
  let token;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
  
    if (existingStatus !== 'denied') {
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
  } catch (err) {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

export const getNotificationData = (notification?: Notifications.Notification) => {
  const redirect = notification?.request?.content?.data?.redirect as string;
  const targetShip = notification?.request?.content?.data?.ship as string;
  return { redirect, targetShip };
}
