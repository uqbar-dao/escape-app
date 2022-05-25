import React, { FC, PropsWithChildren, ReactNode, useCallback, useState, useImperativeHandle, useMemo, useRef, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Association, Contact, Content, evalCord, Group } from '@urbit/api';

import { IuseStorage } from '../../hooks/useStorage';
import { FileUploadSource, useFileUpload } from '../../hooks/useFileUpload';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { useApi } from '../../hooks/useApi';

import { useChatStore, useReplyStore } from '../../state/useChatState';
import useLocalState from '../../state/useLocalState';
import { parseEmojis } from '../graph/parse';

import tokenizeMessage from '../../util/tokenizeMessage';
import ChatEditor, { CodeMirrorShim } from './ChatEditor';
import { ChatAvatar } from './ChatAvatar';

import { Text } from '../Themed';
import { Row } from '../spacing/Row';
import { Col } from '../spacing/Col';
import useStore from '../../state/useStore';

type ChatInputProps = PropsWithChildren<
  IuseStorage & {
    hideAvatars: boolean;
    ourContact?: Contact;
    placeholder: string;
    onSubmit: (contents: Content[]) => void;
    uploadError: string;
    setUploadError: (val: string) => void;
    handleUploadError: (err: Error) => void;
    isAdmin: boolean;
    group: Group;
    association: Association;
    chatEditor: React.RefObject<CodeMirrorShim>
  }
>;

const InputBox = ({ isReply, children }: { isReply: boolean; children?: ReactNode }) => (
  <Col
    style={{
      flexGrow: 1,
      flexShrink: 0,
      borderTopWidth: 1,
      borderTopColor: 'lightgray',
      height: isReply ? 100 : 'auto',
    }}
  >
    { children }
  </Col>
);

const IconBox = ({ children, ...props }: any) => (
  <View
    {...props}
    style={{
      ...(props.style || {}),
      marginLeft: 12,
      marginTop: 8,
      flexShrink: 0,
      height: 24,
      width: 24,
    }}
  >
    {children}
  </View>
);

const MobileSubmitButton = ({ enabled, onSubmit, colors }: any) => (
  <TouchableOpacity onPress={onSubmit} style={{
    marginLeft: 4,
    marginRight: 12,
    marginTop: 8,
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: enabled ? colors.blue : colors.gray,
    zIndex: 1,
  }}>
    <Ionicons name="arrow-forward" color="white" />
  </TouchableOpacity>
);

export const ChatInput = React.forwardRef(({
  ourContact,
  placeholder,
  onSubmit,
  isAdmin,
  group,
  association,
  uploadError,
  setUploadError,
  handleUploadError,
  chatEditor
}: ChatInputProps, ref) => {
  // const chatEditor = useRef<CodeMirrorShim>(null);
  const { theme: { colors } } = useThemeWatcher();

  useImperativeHandle(ref, () => chatEditor.current);
  const [inCodeMode, setInCodeMode] = useState(false);
  const outerRef = useRef<View>(null);
  const { api } = useApi();

  useEffect(() => {
    if (uploadError) {
      // TODO: show an alert here: 'Please check your S3 settings'
    }
  }, [uploadError]);

  const { message, setMessage } = useChatStore();
  const { reply, setReply } = useReplyStore();
  const { canUpload, uploading, promptUpload, onPaste } = useFileUpload({
    onSuccess: uploadSuccess,
    onError: handleUploadError
  });

  function uploadSuccess(url: string, source: FileUploadSource) {
    if (source === 'paste') {
      setMessage(url);
    } else {
      onSubmit([{ url }]);
    }
    setUploadError('');
  }

  function toggleCode() {
    setInCodeMode(!inCodeMode);
  }

  const submit = useCallback(async () => {
    const text = reply.link && message.slice(0,3) === '```'
      ? `${reply.link}\n${message}`
      : `${reply.link}${message || ''}`;

    if (text === '')
      return;

      console.log(2)
    if (inCodeMode) {
      const output: string[] = await api.thread(evalCord(text));
      onSubmit([{ code: { output, expression: text } }]);
    } else {
      console.log(3)
      onSubmit(tokenizeMessage(parseEmojis(text)));
    }
    console.log(4)

    setInCodeMode(false);
    setMessage('');
    setReply();
    chatEditor?.current?.focus();
  }, [message, reply, inCodeMode]);

  const isReply = Boolean(reply.link);
  const [, patp] = reply.link.split('\n');

  return (
    <View ref={outerRef}>
      <InputBox isReply={isReply}>
        {(isReply) && (
          <TouchableOpacity onPress={() => setReply('')}>
            <Row style={{
              marginTop: 4,
              marginLeft: 12,
              padding: 2,
              paddingHorizontal: 6,
              marginRight: 12,
              borderRadius: 3,
              backgroundColor: colors.washedGray,
              display: 'flex',
            }}>
              <Ionicons name="close" size={18} style={{ marginRight: 2 }} />
              <Text numberOfLines={1} style={{ maxWidth: "100%", overflow: "hidden" }}>
                Replying to <Text mono>{patp}</Text> {`"${reply.content}"`}
              </Text>
            </Row>
          </TouchableOpacity>
        )}
        <Row style={{
          alignItems: 'flex-start',
          position: 'relative',
          flexShrink: 0,
          flexGrow: 1,
        }}>
          <Row style={{
            padding: 12,
            paddingRight: 4,
            flexShrink: 0,
            alignItems: 'center',
          }}>
            {/* <ChatAvatar contact={ourContact} hideAvatars={hideAvatars} /> */}
          </Row>
          <ChatEditor
            ref={chatEditor}
            inCodeMode={inCodeMode}
            onPaste={(cm, e) => onPaste(e)}
            {...{ submit, placeholder, isAdmin, group, association }}
          />
          <IconBox style={{ marginRight: canUpload ? 12 : 8 }}>
            <TouchableOpacity onPress={toggleCode}>
              <Ionicons
                name="terminal-outline"
                color={inCodeMode ? colors.blue : colors.black}
                size={24}
              />
            </TouchableOpacity>
          </IconBox>
          {canUpload && (
            <IconBox>
              {uploadError == '' && uploading && <ActivityIndicator size='large' />}
              {uploadError == '' && !uploading && (
                <TouchableOpacity onPress={() =>
                  promptUpload().then((url: string) =>
                    uploadSuccess(url, 'direct')
                  )
                }>
                  <Ionicons name="attach-outline" size={16} />
                </TouchableOpacity>
              )}
            </IconBox>
          )}
          <MobileSubmitButton enabled={message !== ''} onSubmit={submit} colors={colors} />
        </Row>
      </InputBox>
    </View>
  );
});

export default ChatInput;
