import moment from 'moment';
import React, { ReactElement } from 'react';
import Timestamp from './Timestamp';
import { Text, View } from '../Themed';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';

const UnreadNotice = (props: any): ReactElement | null => {
  const { unreadCount, unreadMsg, dismissUnread, onPress } = props;
  const { theme: { colors } } = useThemeWatcher();

  if (unreadCount === 0) {
    return null;
  }

  const stamp = unreadMsg && moment.unix(unreadMsg.post['time-sent'] / 1000);

  return (
    <View style={{ alignSelf: 'center', top: 0, padding: 12, position: 'absolute', zIndex: 1 }}>
      <View style={{ backgroundColor: colors.white, borderRadius: 3, overflow: 'hidden', minWidth: 300 }}>
        <View style={{
          backgroundColor: colors.washedBlue,
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          justifyContent: 'space-between',
          borderRadius: 3,
          borderWidth: 1,
          borderColor: colors.lightBlue,
        }}>
          <TouchableOpacity onPress={onPress}>
            <Text numberOfLines={1} style={{
              overflow: 'hidden',
              display: 'flex',
            }}>
              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
              {unreadMsg && (
                <>
                {' '}since{' '}
                <Timestamp stamp={stamp} color='black' date={true} fontSize={16} />
                </>
              )}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismissUnread}>
            <Ionicons
              name='close'
              color='black'
              style={{ marginLeft: unreadMsg ? 16 : 1, textAlign: 'right' }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default UnreadNotice;
