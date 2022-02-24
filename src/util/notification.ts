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
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (err) {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
