import moment, { Moment as MomentType } from 'moment';
import React, { ReactElement } from 'react';
import { View, ViewProps } from 'react-native';
import { Text } from '../Themed';

export const DateFormat = 'YYYY.M.D';
export const TimeFormat = 'HH:mm';

export type TimestampProps = ViewProps & {
  stamp: MomentType;
  date?: boolean;
  time?: boolean;
  relative?: boolean;
  dateNotRelative?: boolean;
  height?: string;
  color?: string;
  fontSize?: number;
};

const Timestamp = (props: TimestampProps): ReactElement | null => {
  const {
    stamp,
    date = false,
    time,
    color,
    relative = false,
    dateNotRelative = false,
    fontSize,
    ...rest
  } = {
    time: true,
    color: 'gray',
    fontSize: 12,
    ...props
  };
  if (!stamp)
return null;
  let datestamp = stamp.format(DateFormat);
  if (!dateNotRelative) {
    if (stamp.format(DateFormat) === moment().format(DateFormat)) {
      datestamp = 'Today';
    } else if (
      stamp.format(DateFormat) === moment().subtract(1, 'day').format(DateFormat)
    ) {
      datestamp = 'Yesterday';
    }
  } else {
    datestamp = `~${datestamp}`;
  }

  let timestamp;
  if (relative) {
    timestamp = stamp.fromNow();
  } else {
    timestamp = stamp.format(TimeFormat);
  }
  return (
    <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' }} {...rest}>
      {time && (
        <Text style={{ flexShrink: 0, color, fontSize }}>
          {timestamp}
        </Text>
      )}
      {date !== false && (!relative) && (
        <Text style={{ flexShrink: 0, color, fontSize }}>
          {time ? '\u00A0' : ''}
          {datestamp}
        </Text>
      )}
    </View>
  );
};

export default Timestamp;
