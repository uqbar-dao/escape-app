interface HarkNotificationSegment {
  text?: string;
  ship?: string;
  url?: string;
}

export const getNotificationValues = (values: HarkNotificationSegment[]) =>
  values.map(({ text, ship, url }) => text || ship || url || '').join(' ');
