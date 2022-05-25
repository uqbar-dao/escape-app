/* eslint-disable max-lines-per-function */
import React, { useCallback, useMemo, useState } from 'react';
import { useCopy } from '../../hooks/useCopy';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import useMetadataState from '../../state/useMetaDataState';
import useSettingsState from '../../state/useSettingsState';
import { quoteReply } from '../../util/messages';
import { LinkCollection } from '../../screens/escape-routes/ChatResource';
import { Dropdown } from '../Dropdown';
import { Row } from '../spacing/Row';
import { TouchableOpacity } from 'react-native';
import { Text, View } from '../Themed';
import { Col } from '../spacing/Col';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../state/useStore';

const MessageActionItem = ({ onPress, color, children }: { onPress: () => void; color?: string; children: any }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Row style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
        <Text style={{ fontWeight: '500', color }}>
          {children}
        </Text>
      </Row>
    </TouchableOpacity>
  );
};

const MessageActions = ({ onReply, onDelete, onLike, onBookmark, msg, isAdmin, permalink, collections }: any) => {
  const { associations } = useMetadataState();
  const { theme } = useThemeWatcher();
  const { bookmarks } = useSettingsState.getState();
  const bookmarked = Boolean(bookmarks[permalink]);
  const [bookmarkSuccess, setBookmarkSuccess] = useState(bookmarked);
  const { getCurrentPath } = useStore();

  const isOwn = () => msg.author === global.ship;
  const isDm = getCurrentPath().includes('~landscape/messages/dm');

  const { doCopy, copyDisplay } = useCopy(isDm ? quoteReply(msg) : permalink, `Copy Message ${isDm ? 'Reply' : 'Link'}`);
  const showDelete = (isAdmin || isOwn()) && onDelete;
  const { theme: { colors } } = useThemeWatcher();

  const myBookmarksPath = useMemo(() => Object.keys(associations.graph).find((path) => {
    const assoc = associations.graph[path];
    return assoc.group === path && assoc.metadata.title === 'My Bookmarks' && assoc.metadata.config.graph === 'link';
  }), [associations]);
  const collectionList = [{ title: 'My Bookmarks', path: myBookmarksPath || 'mybookmarks' }, ...collections];

  const toggleBookmark = useCallback((collection?: LinkCollection) => () => {
    onBookmark(msg, permalink, collection || '', !bookmarked);
    setBookmarkSuccess(!bookmarked);
  }, [msg, permalink, bookmarked]);

  const bookmarkStyle = { height: 16, width: 14, color: theme.colors.black };
  const bookmarkIcon = bookmarkSuccess
    ? <Ionicons name="bookmark" style={bookmarkStyle} />
    : <Ionicons name="bookmark-outline" style={bookmarkStyle} />;

  return (
    <View style={{
      borderRadius: 1,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.lightGray,
      position: 'absolute',
      top: -12,
      right: 2,
    }}>
      <Row>
        <TouchableOpacity style={{ padding: 2 }} onPress={() => onReply(msg)}>
          <Ionicons name='chatbox' size={8} />
        </TouchableOpacity>
        {onLike && <TouchableOpacity style={{ padding: 2 }} onPress={() => onLike(msg)}>
          <Ionicons name="checkmark" size={20} style={{ marginLeft: -2, marginTop: -2 }} />
        </TouchableOpacity>}
        {bookmarked ? (
          <TouchableOpacity style={{ padding: 2 }} onPress={toggleBookmark()}>
            {bookmarkIcon}
          </TouchableOpacity>
        ) : collectionList.length === 1 ? (
          <TouchableOpacity style={{ padding: 2 }} onPress={toggleBookmark(collectionList[0])}>
            {bookmarkIcon}
          </TouchableOpacity>
        ) : (
          <View />
          // <Dropdown
          //   dropWidth='250px'
          //   width='auto'
          //   alignY='top'
          //   alignX='right'
          //   flexShrink={0}
          //   offsetY={8}
          //   offsetX={-24}
          //   options={
          //     <Col style={{
          //       paddingVertical: 4,
          //       backgroundColor: 'white',
          //       borderWidth: 1,
          //       borderRadius: 2,
          //       borderColor: 'lightGray',
          //     }}>
          //       {bookmarkSuccess
          //         ? <Text style={{ color: 'black', fontSize: 16, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 4 }}>Bookmarked!</Text>
          //         : collectionList.map(c => <MessageActionItem key={c.path} onPress={toggleBookmark(c)}>
          //           {c.title}
          //         </MessageActionItem>)
          //       }
          //     </Col>
          //   }
          // >
          //   <View style={{ padding: 2 }}>{bookmarkIcon}</View>
          // </Dropdown>
        )}
        {/* <Dropdown
          dropWidth='250px'
          width='auto'
          alignY='top'
          alignX='right'
          flexShrink={0}
          offsetY={8}
          offsetX={-24}
          options={
            <Col style={{
              paddingVertical: 4,
              backgroundColor: 'white',
              borderWidth: 1,
              borderRadius: 2,
              borderColor: 'rgba(0,0,0,0.1)',

            }}>
              <MessageActionItem onPress={() => onReply(msg)}>
                Reply
              </MessageActionItem>
              <MessageActionItem onPress={doCopy}>
                {copyDisplay}
              </MessageActionItem>
              {showDelete && (
                <MessageActionItem onPress={() => onDelete(msg)} color='red'>
                  Delete Message
                </MessageActionItem>
              )}
            </Col>
          }
        >
          <Ionicons name="menu" size={8} style={{ padding: 2 }} />
        </Dropdown> */}
      </Row>
    </View>
  );
};

export default MessageActions;
