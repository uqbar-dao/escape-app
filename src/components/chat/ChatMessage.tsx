/* eslint-disable max-lines-per-function */
import { Contact, Post } from '@urbit/api';
import { Ionicons } from '@expo/vector-icons';
import bigInt from 'big-integer';
import moment from 'moment';
import React, { Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, TouchableOpacity, TouchableWithoutFeedback, ViewComponent } from 'react-native';
// import ProfileOverlay from '~/views/components/ProfileOverlay';
// import { Sigil } from '~/logic/lib/sigil';
import { useContact } from '../../state/useContactState';
import usePalsState from '../../state/usePalsState';
import useSettingsState, { selectCalmState, useShowNickname } from '../../state/useSettingsState';

import { GraphContent } from '../graph/GraphContent';
import { LinkCollection } from '../../screens/escape-routes/ChatResource';
import { citeNickname, daToUnix, uxToHex } from '../../util/landscape';
import MessageActions from './MessageActions';
import { Row } from '../spacing/Row';
import VisibilitySensor from '../spacing/VisibilitySensor';
import { CodeMirrorShim } from './ChatEditor';
import { Text, View } from '../Themed';
import Sigil from '../Sigil';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
// import { LikeIndicator } from './LikeIndicator';

export const DATESTAMP_FORMAT = '[~]YYYY.M.D';

interface DayBreakProps {
  when: string | number;
  shimTop?: boolean;
}

export const DayBreak = ({ when, shimTop = false }: DayBreakProps) => (
  <Row style={{
    paddingHorizontal: 4,
    marginBottom: 4,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: shimTop ? -8 : 0,
  }}>
    <View style={{ borderWidth: 1, borderColor: 'lightgray' }} />
    <Text gray style={{
      flexShrink: 0,
      textAlign: 'center',
      fontSize: 12,
      paddingHorizontal: 2,
    }}
    >
      {moment(when).calendar(null, { sameElse: DATESTAMP_FORMAT })}
    </Text>
    <View style={{ borderWidth: 1, borderColor: 'lightgray' }} />
  </Row>
);

export const MessageAuthor = React.memo<any>(({
  timestamp,
  msg,
  showOurContact,
  ...props
}: any) => {
  const { pals } = usePalsState();
  
  let contact: Contact | null = useContact(`~${msg.author}`);

  const date = daToUnix(bigInt(msg.index.split('/').reverse()[0]));
  const [focused, setFocused] = useState(false);

  const datestamp = moment
    .unix(date / 1000)
    .format(DATESTAMP_FORMAT);
  contact =
    ((msg.author === global.ship && showOurContact) ||
      msg.author !== global.ship)
      ? contact
      : null;

  const showNickname = useShowNickname(contact) && (msg.author.trim() !== contact?.nickname?.replace('~', '')?.trim());
  const { hideAvatars } = useSettingsState(selectCalmState);
  const shipName = citeNickname(msg.author, showNickname, contact?.nickname);
  const color = `#${uxToHex(contact?.color || '0x0')}`;

  const nameMono = !showNickname;
  const isPal = Boolean(pals.outgoing[msg.author]?.ack);

  const img =
    contact?.avatar && !hideAvatars ? (
      <Image
        source={{ uri: contact.avatar }}
        height={24}
        width={24}
        borderRadius={1}
      />
    ) : (
      <Sigil
        ship={`~${msg.author}`}
        color={color}
        size={20}
        icon
      />
    );

  return (
    <Row style={{ display: 'flex', paddingBottom: 2, alignItems: 'center', justifyContent: 'flex-start' }}>
      <TouchableWithoutFeedback style={{ flexGrow: 1 }} onPress={() => setFocused(!focused)}>
        <Row style={{ flexShrink: 0, paddingVertical: 2, display: 'flex', alignItems: 'center' }}>
          <View style={{
            height: 24,
            paddingRight: 4,
            marginTop: 1,
            paddingLeft: props.transcluded ? 11 : 12,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* <ProfileOverlay cursor='auto' ship={msg.author}> */}
              <Row style={{ alignItems: 'center' }}>
                {img}
                <Text numberOfLines={1} mono={nameMono} style={{
                  fontSize: 14,
                  marginLeft: 4,
                  marginTop: 2,
                  flexShrink: 1,
                  fontWeight: nameMono ? '400' : '500',
                }}>
                  {shipName}
                </Text>
                {isPal && <Ionicons name="people-outline" size={14} style={{ marginLeft: 4, marginTop: 3 }} />}
              </Row>
            {/* </ProfileOverlay> */}
          </View>
          <Text style={{ flexShrink: 0, fontSize: 12 }} gray>
            {timestamp}
          </Text>
          <Text gray style={{
            flexShrink: 0,
            fontSize: 12,
            marginLeft: 4,
            display: focused ? 'flex' : 'none',
          }}>
            {datestamp}
          </Text>
        </Row>
      </TouchableWithoutFeedback>
    </Row>
  );
});
MessageAuthor.displayName = 'MessageAuthor';

type MessageProps = { timestamp: string; timestampHover: boolean; }
  & Pick<ChatMessageProps, 'msg' | 'transcluded' | 'showOurContact' | 'isReply' | 'onLike'>

export const Message = React.memo(({
  timestamp,
  msg,
  timestampHover,
  transcluded = 0,
  showOurContact,
  isReply = false
}: MessageProps) => {
  const [focused, setFocused] = useState(false);
  // TODO: add an additional check for links-only messages to remove the Triangle icon
  const defaultCollapsed = isReply && transcluded > 0;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <TouchableWithoutFeedback style={{ width: '100%' }} onPress={(e) => {
      if (collapsed) {
        setCollapsed(!collapsed);
      }
    }}>
      <Row style={{ width: "100%" }}>
        {defaultCollapsed && (
          <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
            <Ionicons
              name={collapsed ? 'caret-forward-outline' : 'caret-down-outline'}
              style={{
                padding: 2,
                marginRight: 8,
                marginLeft: 12,
              }}
            />
          </TouchableOpacity>
        )}
        <TouchableWithoutFeedback onPress={() => setFocused(!focused)}>
          <View style={{
            paddingLeft: defaultCollapsed ? 0 : 44,
            paddingRight: 16,
          }}>
            {timestampHover && (
              <Text gray style={{
                display: focused ? undefined : 'none',
                position: 'absolute',
                width: 36,
                textAlign: 'right',
                left: 0,
                top: 2,
                fontSize: 12,
              }}>
                {timestamp}
              </Text>
            )}
            <GraphContent
              contents={msg.contents}
              transcluded={transcluded}
              showOurContact={showOurContact}
              collapsed={collapsed}
            />
          </View>
        </TouchableWithoutFeedback>
      </Row>
    </TouchableWithoutFeedback>
  );
});

Message.displayName = 'Message';

export const UnreadMarker = React.forwardRef(
  ({ dismissUnread }: any, ref: Ref<ViewComponent>) => {
    const [visible, setVisible] = useState(false);
    const { theme: { colors } } = useThemeWatcher();

    useEffect(() => {
      if (visible) {
        dismissUnread();
      }
    }, [visible]);

    return (
      <Row ref={ref} style={{
        position: 'absolute',
        paddingHorizontal: 4,
        height: 5,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}>
        <View style={{ borderWidth: 1, borderColor: colors.lightBlue }} />
        <VisibilitySensor onChange={setVisible}>
          <Text style={{
            color: colors.blue,
            fontSize: 12,
            flexShrink: 0,
            textAlign: 'center',
            paddingHorizontal: 4,
          }}>
            New messages below
          </Text>
        </VisibilitySensor>
        <View style={{ borderWidth: 1, borderColor: colors.lightBlue }} />
      </Row>
    );
  }
);

const MessageWrapper = (props: any) => {
  const { transcluded, hideHover, highlighted, likers, didLike, msg, onLike } = props;
  const [focused, setFocused] = useState(false);
  const showHover = (transcluded === 0) && focused && !hideHover;
  const [isLiked, setIsLiked] = useState(didLike);
  const { theme: { colors } } = useThemeWatcher();

  const likeMessage = useCallback((msg) => {
    if (isLiked && !didLike) {
      return;
    }
    onLike(msg);
    setIsLiked(!isLiked);
  }, [isLiked, didLike, onLike]);

  return (
    <TouchableWithoutFeedback onPress={() => setFocused(!focused)}>
      <View style={{
        paddingVertical: transcluded ? 2 : 1,
        backgroundColor: highlighted
          ? showHover ? colors.lightBlue : colors.washedBlue
          : showHover ? colors.washedGray : 'transparent',
        position: 'relative',
      }}>
        {props.children}
        {/* {onLike && <LikeIndicator {...{ transcluded, isLiked, didLike, dark, likers, showLikers: hovering }} onLike={() => likeMessage(msg)} />} */}
        {showHover ? <MessageActions {...{ ...props, onLike: onLike && likeMessage }} /> : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

interface ChatMessageProps {
  msg: Post;
  previousMsg?: Post;
  nextMsg?: Post;
  isLastRead?: boolean;
  permalink?: string;
  transcluded?: number;
  isAdmin?: boolean;
  isReply?: boolean;
  className?: string;
  isPending?: boolean;
  style?: any;
  isLastMessage?: boolean;
  highlighted?: boolean;
  renderSigil?: boolean;
  hideHover?: boolean;
  showOurContact: boolean;
  dismissUnread?: () => void;
  innerRef: (el: ViewComponent | null) => void;
  onReply?: (msg: Post) => void;
  onDelete?: () => void;
  onLike?: (msg: Post) => void;
  onBookmark?: (msg: Post, permalink: string, collection: LinkCollection, add: boolean) => void,
  inputRef: React.MutableRefObject<CodeMirrorShim>,
  collections: LinkCollection[],
}
const emptyCallback = () => {};

function ChatMessage(props: ChatMessageProps) {
  let { highlighted } = props;
  const {
    msg,
    nextMsg,
    isLastRead = false,
    isPending = false,
    style,
    isLastMessage,
    isAdmin,
    showOurContact,
    hideHover,
    dismissUnread = () => null,
    permalink = '',
    onLike,
    onBookmark,
    isReply = false,
    collections
  } = props;

  if (typeof msg === 'string' || !msg) {
    return (
      <Text gray>This message has been deleted.</Text>
    );
  }

  const onReply = props?.onReply || emptyCallback;
  const onDelete = props?.onDelete; // If missing hide delete action
  const transcluded = props?.transcluded || 0;
  const renderSigil = props.renderSigil || (Boolean(nextMsg && msg.author !== nextMsg.author) ||
        !nextMsg
    );

    const ourMention = msg?.contents?.some((e: any) => {
      return e?.mention && e?.mention === global.ship;
    });

    if (!highlighted) {
      if (ourMention) {
        highlighted = true;
      }
    }

  const date = useMemo(() =>
    daToUnix(bigInt(msg.index.split('/').reverse()[0])),
    [msg.index]
  );
  const nextDate = useMemo(() => nextMsg && typeof nextMsg !== 'string'  ? (
    daToUnix(bigInt(nextMsg.index.split('/').reverse()[0]))
  ) : null,
    [nextMsg]
  );

  const dayBreak = useMemo(() =>
    nextDate &&
    new Date(date).getDate() !==
    new Date(nextDate).getDate()
  , [nextDate, date]);

  const timestamp = useMemo(() => moment
    .unix(date / 1000)
    .format(renderSigil ? 'h:mm A' : 'h:mm'),
    [date, renderSigil]
  );

  const likers = msg.signatures
    .map(({ ship }) => ship)
    .filter((ship, ind, arr) => ship !== msg.author && arr.indexOf(ship) === ind);
  const didLike = Boolean(msg.author !== global.ship && msg.signatures.find(({ ship }) => ship === global.ship));

  const messageProps = {
    msg,
    timestamp,
    isPending,
    showOurContact,
    highlighted,
    hideHover,
    transcluded,
    onReply,
    onDelete,
    onLike,
    onBookmark,
    isAdmin,
    likers,
    didLike,
    collections
  };

  const message = useMemo(() => (
    <Message
      timestampHover={!renderSigil}
      {...{ msg, timestamp, transcluded, showOurContact, isReply }}
    />
  ), [renderSigil, msg, timestamp, transcluded, showOurContact]);

  return (
    <View
      // ref={props.innerRef}
      style={{
        ...style,
        paddingTop: renderSigil ? 4 : 0,
        width: '100%',
        paddingBottom: isLastMessage ? 20 : 0,
      }}
    >
      {dayBreak && !isLastRead ? (
        <DayBreak when={date} shimTop={renderSigil} />
      ) : null}
      <MessageWrapper permalink={permalink} {...messageProps}>
        { renderSigil && <MessageAuthor {...messageProps} />}
        {message}
      </MessageWrapper>
      <View style={{ height: isLastRead ? 32 : 0 }}>
        {isLastRead ? (
          <UnreadMarker dismissUnread={dismissUnread} />
        ) : null}
      </View>
    </View>
  );
}

export default React.memo(React.forwardRef((props: Omit<ChatMessageProps, 'innerRef'>, ref: any) => (
  <ChatMessage {...props} innerRef={ref} />
)));
