import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import bigInt, { BigInteger } from 'big-integer';
import { Association, Content, Graph, Group, Post } from '@urbit/api';
import { useOurContact } from '../../state/useContactState';
import { useGraphTimesent } from '../../state/useGraphState';
import { useChatStore, useReplyStore } from '../../state/useChatState';
import { LinkCollection } from '../../screens/escape-routes/ChatResource';
import { Col } from '../spacing/Col';
import ChatInput from './ChatInput';
import ChatWindow from './ChatWindow';
import { CodeMirrorShim } from './ChatEditor';
import { Text } from '../Themed';
import useStore from '../../state/useStore';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';

const getMsgText = (msg: Post) => {
  return msg.contents.reduce((acc, { text, url, code, mention }: any) => {
    return acc + (text || '') + (url || '') + (code || '') + (mention || '');
  }, '');
};

interface ChatPaneProps {
  /**
   * A key to uniquely identify a ChatPane instance. Should be either the
   * resource for group chats or the @p for DMs
   */
  id: string;
  /**
   * The graph of the chat to render
   */
  graph: Graph;
  group?: Group;
  association?: Association;
  unreadCount: number;
  /**
   * User able to write to chat
   */
  canWrite: boolean;
  /**
   * Get contents of reply message
   */
  onReply: (msg: Post) => string;
  onDelete?: (msg: Post) => void;
  onLike?: (msg: Post) => void;
  getMostRecent?: () => void;
  onBookmark?: (msg: Post, permalink: string, collection: LinkCollection, add: boolean) => void;
  /**
   * Fetch more messages
   *
   * @param newer Get newer or older backlog
   * @returns Whether backlog is finished loading in that direction
   */
  fetchMessages: (newer: boolean) => Promise<boolean>;
  /**
   * Dismiss unreads for chat
   */
  dismissUnread: () => void;
  /**
   * Get permalink for a node
   */
  getPermalink: (idx: BigInteger) => string;
  isAdmin: boolean;
  /**
   * Post message with contents to channel
   */
  onSubmit: (contents: Content[]) => void;
  /**
   *
   * Users or group we haven't shared our contact with yet
   *
   * string[] - array of ships
   * string - path of group
   */
  promptShare?: string[] | string;
  /**
   *
   * Collections of links in the current group
   *
   * string[] - array of collections with title and path
   */
  collections?: LinkCollection[];
}

export function ChatPane(props: ChatPaneProps): ReactElement {
  const {
    graph,
    group,
    association,
    unreadCount,
    canWrite,
    id,
    getPermalink,
    isAdmin,
    dismissUnread,
    onSubmit,
    onDelete,
    onLike,
    onBookmark,
    fetchMessages,
    getMostRecent = () => null,
    promptShare = [],
    collections = []
  } = props;
  const graphTimesentMap = useGraphTimesent(id);
  const ourContact = useOurContact();
  const [uploadError, setUploadError] = useState<string>('');
  const { theme: { colors } } = useThemeWatcher();

  const handleUploadError = useCallback((err: Error) => {
    setUploadError(err.message);
  }, []);

  const { message, restore } = useChatStore();
  const { reply, restore: restoreReply, setReply } = useReplyStore();
  const inputRef = useRef<CodeMirrorShim>(null);
  const scrollTo = null;
  // const scrollTo = new URLSearchParams(location.search).get('msg');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    restore(id);
    restoreReply(id);
  }, [id]);

  useEffect(() => {
    setShowBanner(promptShare.length > 0);
  }, [promptShare]);

  const onReply = useCallback(
    (msg: Post) => {
      setReply(props.onReply(msg), getMsgText(msg));
      inputRef?.current?.focus();
    },
    [id, message, props.onReply]
  );

  if (!graph) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <Col style={{
      height: '100%',
      position: 'relative',
      backgroundColor: colors.white,
      justifyContent: 'flex-end'
    }}>
      {/* <ShareProfile
        our={ourContact}
        recipients={showBanner ? promptShare : []}
        onShare={() => setShowBanner(false)}
      /> */}
      <ChatWindow
        key={id}
        graphSize={graph.size}
        showOurContact={promptShare.length === 0 && !showBanner}
        pendingSize={Object.keys(graphTimesentMap).length}
        scrollTo={scrollTo ? bigInt(scrollTo) : undefined}
        {...{ graph, unreadCount, onReply, onDelete, onLike, onBookmark, dismissUnread, fetchMessages, isAdmin, getPermalink, collections, inputRef, reply, getMostRecent }}
      />
      {canWrite && (
        <ChatInput
          {...{ onSubmit, isAdmin, group, association }}
          ourContact={(promptShare.length === 0 && ourContact) || undefined}
          placeholder="Message..."
          uploadError={uploadError}
          setUploadError={setUploadError}
          handleUploadError={handleUploadError}
          chatEditor={inputRef}
        />
      )}
    </Col>
  );
}

ChatPane.whyDidYouRender = true;
