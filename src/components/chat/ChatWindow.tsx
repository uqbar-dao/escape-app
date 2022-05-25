import React, { Component } from 'react';
import { Graph, GraphNode, Post } from '@urbit/api';
import bigInt, { BigInteger } from 'big-integer';
import { NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { GraphScroller } from '../scroll/GraphScroller';
import VirtualScroller from '../scroll/VirtualScroller';
import { LinkCollection } from '../../screens/escape-routes/ChatResource';
import { Text, View } from '../Themed';
import { CodeMirrorShim } from './ChatEditor';
import ChatMessage from './ChatMessage';
import UnreadNotice from './UnreadNotice';
import { Col } from '../spacing/Col';

const IDLE_THRESHOLD = 64;

type ChatWindowProps = {
  unreadCount: number;
  graph: Graph;
  graphSize: number;
  station?: unknown;
  inputRef: React.MutableRefObject<CodeMirrorShim | null>;
  scrollTo?: BigInteger;
  pendingSize?: number;
  showOurContact: boolean;
  isAdmin: boolean;
  collections: LinkCollection[];
  onReply: (msg: Post) => void;
  fetchMessages: (newer: boolean) => Promise<boolean>;
  getPermalink: (index: BigInteger) => string | undefined;
  onDelete?: (msg: Post) => void;
  onLike?: (msg: Post) => void;
  onBookmark?: (msg: Post, permalink: string, collection: LinkCollection, add: boolean) => void;
  dismissUnread?: () => void;
  getMostRecent?: () => void;
};

interface ChatWindowState {
  fetchPending: boolean;
  idle: boolean;
  initialized: boolean;
  unreadIndex: BigInteger;
  isAtEnd: boolean;
  scrolledToTarget: boolean;
  scrollTop: number;
}

interface RendererProps {
  index: bigInt.BigInteger;
  scrollWindow: any;
}

const virtScrollerStyle = { height: '100%' };

class ChatWindow extends Component<
  ChatWindowProps,
  ChatWindowState
> {
  private virtualList: VirtualScroller<bigInt.BigInteger, GraphNode> | null;
  private prevSize = 0;
  private unreadSet = false;

  INITIALIZATION_MAX_TIME = 100;

  constructor(props: ChatWindowProps) {
    super(props);

    this.state = {
      fetchPending: false,
      idle: true,
      initialized: true,
      unreadIndex: bigInt.zero,
      isAtEnd: true,
      scrolledToTarget: false,
      scrollTop: 0
    };

    this.scrollToUnread = this.scrollToUnread.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.stayLockedIfActive = this.stayLockedIfActive.bind(this);

    this.virtualList = null;
    this.prevSize = props.graph.size;
  }

  componentDidMount() {
    const unreadIndex = this.calculateUnreadIndex();
    if (this.props.scrollTo && this.props.graph.get(bigInt(this.props.scrollTo))) {
      this.virtualList!.scrollLocked = false;
      this.virtualList!.scrollToIndex(this.props.scrollTo);
      this.setState({ scrolledToTarget: true });
    } else if (unreadIndex && !this.dismissedInitialUnread()) {
      this.virtualList!.scrollLocked = false;
      this.virtualList!.scrollToIndex(unreadIndex);
    } else if (!this.dismissedInitialUnread()) {
      setTimeout(this.scrollToUnread, 1);
    }
  }

  calculateUnreadIndex() {
    const { graph, unreadCount } = this.props;
    const { state } = this;
    if(state.unreadIndex.neq(bigInt.zero)) {
      return;
    }
    let unreadIndex = graph.keys()[unreadCount];
    if (!unreadIndex || unreadCount === 0) {
      if(state.unreadIndex.neq(bigInt.zero)) {
        this.setState({
          unreadIndex: bigInt.zero
        });
      }
      return;
    }
    /* Loop until we can find a index with an actual post */
    let attemptedCount = unreadCount;
    while(attemptedCount > 0 && typeof graph.get(unreadIndex)?.post === 'string') {
      attemptedCount--;
      unreadIndex = graph.keys()[attemptedCount];
    }

    this.setState({
      unreadIndex
    });

    return unreadIndex;
  }

  dismissedInitialUnread(): boolean {
    const { unreadCount, graph } = this.props;

    return this.state.unreadIndex.eq(bigInt.zero)
      ? unreadCount > graph.size
      : this.state.unreadIndex.neq((graph as any).keys()?.[unreadCount]?.[0] ?? bigInt.zero);
  }

  handleWindowBlur(): void {
    this.setState({ idle: true });
  }

  componentDidUpdate(prevProps: ChatWindowProps): void {
    const { unreadCount, graphSize, station } = this.props;
    if (unreadCount === 0 && prevProps.unreadCount !== unreadCount) {
      this.unreadSet = true;
    }

    if (!this.state.scrolledToTarget && this.props.scrollTo && this.props.graph.get(bigInt(this.props.scrollTo))) {
      this.virtualList!.scrollToIndex(this.props.scrollTo);
      this.setState({ scrolledToTarget: true });
    }

    if (this.prevSize !== graphSize) {
      this.prevSize = graphSize;
      if (this.state.unreadIndex.eq(bigInt.zero)) {
        this.calculateUnreadIndex();
      }
      if (this.unreadSet &&
        this.dismissedInitialUnread() &&
        this.virtualList!.startOffset() < 5 &&
        this.props.dismissUnread) {
        this.props.dismissUnread();
      }
    }

    if (unreadCount > prevProps.unreadCount) {
      this.calculateUnreadIndex();
    }

    if (station !== prevProps.station) {
      this.virtualList?.resetScroll();
      this.calculateUnreadIndex();
    }
  }

  stayLockedIfActive(): void {
    if (this.virtualList && !this.state.idle) {
      this.virtualList.resetScroll();
      if (this.props.dismissUnread) {
        this.props.dismissUnread();
      }
    }
  }

  onTopLoaded = () => {
    const { graphSize, unreadCount } = this.props;
    if (graphSize >= unreadCount && this.props.dismissUnread) {
      this.props.dismissUnread();
    }
  };

  onBottomLoaded = () => {
    if(this.state.unreadIndex.eq(bigInt.zero)) {
      this.calculateUnreadIndex();
    }
  }

  scrollToUnread(): void {
    const { unreadIndex } = this.state;
    if (unreadIndex.eq(bigInt.zero)) {
      return;
    }

    this.virtualList?.scrollToIndex(this.state.unreadIndex);
  }

  onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollTop = event?.nativeEvent?.contentOffset?.y;
    if (scrollTop) {
      if (!this.state.idle && scrollTop > IDLE_THRESHOLD) {
        this.setState({ idle: true });
      }
  
      this.setState({ isAtEnd: scrollTop < 80 });
    }
  }

  scrollToEnd = () => {
    if (this.props.getMostRecent) {
      this.props.getMostRecent();
    }
    const [last] = this.props.graph.peekLargest();
    this.virtualList!.scrollToIndex(last);
  }

  renderer = React.forwardRef(({ index, scrollWindow }: RendererProps, ref) => {
    const {
      showOurContact,
      graph,
      inputRef,
      onReply,
      onDelete,
      onLike,
      onBookmark,
      getPermalink,
      dismissUnread,
      isAdmin,
      collections
    } = this.props;
    const permalink = getPermalink(index);
    const messageProps = {
      showOurContact,
      onReply,
      onDelete,
      onLike,
      onBookmark,
      permalink,
      dismissUnread,
      isAdmin,
      collections
    };

    const msg = graph.get(index)?.post;
    if (!msg || typeof msg === 'string') {
      return (
        <Text gray style={{ textAlign: 'center', paddingVertical: 2 }}>
          -
          This message has been deleted.
          -
        </Text>
      );
    }
    const isPending: boolean = 'pending' in msg && Boolean(msg.pending);
    const isLastMessage = index.eq(graph.peekLargest()?.[0] ?? bigInt.zero);
    const highlighted = index.eq(this.props.scrollTo ?? bigInt.zero);
    const keys = graph.keys();
    const graphIdx = keys.findIndex(idx => idx.eq(index));
    const prevIdx = keys[graphIdx - 1];
    const nextIdx = keys[graphIdx + 1];
    const isLastRead: boolean = this.state.unreadIndex.eq(index);
    const props = {
      highlighted,
      scrollWindow,
      isPending,
      isLastRead,
      isLastMessage,
      msg,
      inputRef,
      ...messageProps
    };

    return (
      // @ts-ignore virt typings
      <ChatMessage
        key={index.toString()}
        ref={ref}
        previousMsg={prevIdx && graph.get(prevIdx)?.post}
        nextMsg={nextIdx && graph.get(nextIdx)?.post}
        {...props}
      />
    );
  });

  render() {
    const { unreadCount, graph, pendingSize = 0 } = this.props;
    const unreadMsg = graph.get(this.state.unreadIndex);

    return (
      <Col style={{ overflow: 'hidden', position: 'relative' }}>
        {this.dismissedInitialUnread() &&
         (<UnreadNotice
          unreadCount={unreadCount}
          unreadMsg={
            unreadCount === 1 &&
            unreadMsg &&
            unreadMsg?.post.author === global.ship
              ? false
              : unreadMsg
          }
          dismissUnread={this.props.dismissUnread}
          onClick={this.scrollToUnread}
         />)}
        {!this.state.isAtEnd && (
          <View style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1 }}>
            <TouchableOpacity onPress={this.scrollToEnd}>
              <Ionicons name="chevron-down" />
            </TouchableOpacity>
          </View>
         )}
        <GraphScroller
          ref={(list: any) => {
            this.virtualList = list;
          }}
          offset={unreadCount}
          origin='bottom'
          style={virtScrollerStyle}
          onBottomLoaded={this.onBottomLoaded}
          onTopLoaded={this.onTopLoaded}
          onScroll={this.onScroll}
          data={graph}
          size={graph.size}
          pendingSize={pendingSize}
          averageHeight={22}
          renderer={this.renderer}
          loadRows={this.props.fetchMessages}
        />
      </Col>
    );
  }
}

export default ChatWindow;
