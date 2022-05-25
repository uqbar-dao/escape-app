import React, { useCallback } from 'react';
import {
  HarkLid,
  harkLidToId,
  harkBinToId,
  Notification as INotification,
  HarkContent
} from '@urbit/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BigInteger } from 'big-integer';
import { TouchableOpacity } from 'react-native';
import { map, take, uniqBy } from 'lodash';
import { cite, deSig } from '../util/landscape';
import useHarkState from '../state/useHarkState';
import { getNotificationRedirect } from '../util/notificationRedirects';
import { Text } from './Themed';
import { Row } from './spacing/Row';
import { Col } from './spacing/Col';
import useStore from '../state/useStore';
import { useThemeWatcher } from '../hooks/useThemeWatcher';

export interface NotificationProps {
  notification: INotification;
  time: BigInteger;
  unread: boolean;
}

const MAX_CONTENTS = 5;

export function Mention(props: {
  ship: string;
  first?: boolean;
  emphasis?: 'bold' | 'italic';
}) {
  const { ship, first = false, emphasis } = props;
  const { theme: { colors } } = useThemeWatcher();
  return (
    <Text
      style={{
        marginLeft: first? 0 : 2,
        marginRight: 2,
        paddingHorizontal: 2,
        fontWeight: emphasis === 'bold' ? 'bold' : 'normal',
        backgroundColor: colors.washedBlue,
        color: colors.blue,
        fontStyle: emphasis === 'italic' ? 'italic' : undefined,
        fontVariant: ['tabular-nums']
      }}
    >
      {cite(ship)}
    </Text>
  );
}

interface NotificationTextProps {
  contents: HarkContent[];
}
const NotificationText = ({ contents, ...rest }: NotificationTextProps) => {
  return (
    <Row style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {contents.map((content, idx) => {
        if ('ship' in content) {
          return (
            <Mention
              key={idx}
              ship={deSig(content.ship)}
              first={idx === 0}
              {...rest}
            />
          );
        }
        return <Text key={idx} style={{ lineHeight: 24, flex: 1, flexWrap: 'wrap' }}>{content.text}</Text>;
      })}
    </Row>
  );
};

export function Notification(props: {
  goToNotification: (n: string) => () => void;
  lid: HarkLid;
  notification: INotification;
}) {
  const { notification, lid } = props;
  const read = !('unseen' in lid);
  const key = `${harkLidToId(lid)}-${harkBinToId(notification.bin)}`;

  const onArchive = useCallback(() => {
      if (!notification) {
        return;
      }
      useHarkState.getState().archiveNote(notification.bin, lid);
    }, [notification, lid]);

  const dedupedBody = uniqBy(notification.body, item => item.link);
  const contents = map(dedupedBody, 'content').filter(
    c => c.length > 0
  );
  const first = notification.body[0];
  if (!first) {
    // should be unreachable
    return null;
  }

  const onPress = () => {
    const redirect = getNotificationRedirect(first.link);
    if (redirect) {
      props.goToNotification(redirect as string)()
    } else {
      console.warn('no redirect');
    }
  };

  return (
    <Row
      style={{
        backgroundColor: read ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,255,0.03)blue',
        borderRadius: 4,
        padding: 8,
      }}
    >
      <TouchableOpacity onPress={onPress}>
        <Row style={{ marginVertical: contents.length === 0 ? 0 : 4 }}>
          <NotificationText contents={first.title} />
          <Col style={{ marginVertical: 4 }}>
            {take(contents, MAX_CONTENTS).map((content, i) => (
              <NotificationText key={i} contents={content} />
            ))}
          </Col>
          {contents.length > MAX_CONTENTS ? (
            <Text style={{ marginTop: 4, color: 'gray' }}>
              and {contents.length - MAX_CONTENTS} more
            </Text>
          ) : null}
        </Row>
      </TouchableOpacity>
      <Row
        style={{
          marginHorizontal: 2,
        }}
      >
        {!('time' in lid) && (
          <TouchableOpacity
            onPress={onArchive}
            style={{ padding: 4 }}
          >
            <Ionicons name="close" size={16} color='black' />
          </TouchableOpacity>
        )}
      </Row>
    </Row>
  );
}
