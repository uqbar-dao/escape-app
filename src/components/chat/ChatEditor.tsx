/* eslint-disable max-lines-per-function */
import React, { useRef, useState, ClipboardEvent, useEffect, useImperativeHandle, useCallback, useMemo } from 'react';
import { Platform, TouchableOpacity, Dimensions } from 'react-native';
import { Association, Group, invite, resourceFromPath } from '@urbit/api';
import * as ob from 'urbit-ob';
import useSettingsState from '../../state/useSettingsState';
import { useChatStore, useReplyStore } from '../../state/useChatState';
import { AutocompletePatp } from './AutocompletePatp';
import { useApi } from '../../hooks/useApi';
import { parseEmojis } from '../graph/parse';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { TextInput } from 'react-native';
import { Row } from '../spacing/Row';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import useStore from '../../state/useStore';

export const SIG_REGEX = /(?:^|\s)(~)$/;
export const MENTION_REGEX = /(?:^|\s)(~)(?![a-z]{6}\-[a-z]{6}[?=\s|$])(?![a-z]{6}[?=\s|$])([a-z\-]+)$/;

const MARKDOWN_CONFIG = {
  name: 'markdown',
  tokenTypeOverrides: {
    header: 'presentation',
    quote: 'quote',
    list1: 'presentation',
    list2: 'presentation',
    list3: 'presentation',
    hr: 'presentation',
    image: 'presentation',
    imageAltText: 'presentation',
    imageMarker: 'presentation',
    formatting: 'presentation',
    linkInline: 'presentation',
    linkEmail: 'presentation',
    linkText: 'presentation',
    linkHref: 'presentation'
  }
};

const defaultOptions = {
  mode: MARKDOWN_CONFIG,
  lineNumbers: false,
  lineWrapping: true,
  scrollbarStyle: 'native',
  cursorHeight: 0.85,
  // The below will ony work once codemirror's bug is fixed
  spellcheck: true,
  autocorrect: true,
  autocapitalize: true
};

// Until CodeMirror supports options.inputStyle = 'textarea' on mobile,
// we need to hack this into a regular input that has some funny behaviors
// const inputProxy = (input: TextInput) => new Proxy(input, {
//   get(target, property) {
//     if(property === 'focus') {
//       return () => {
//         target.focus();
//       };
//     }
//     if (property in target) {
//       return target[property];
//     }
//     if (property === 'execCommand') {
//       return () => {
//         target.setSelectionRange(target.value.length, target.value.length);
//         input.blur();
//         input.focus();
//       };
//     }
//     if (property === 'setOption') {
//       return () => {};
//     }
//     if (property === 'getValue') {
//       return () => target.value;
//     }
//     if (property === 'setValue') {
//       return (val: string) => {
//         target.value = val;
//       };
//     }
//     if (property === 'element') {
//       return input;
//     }
//     if (property === 'getCursor') {
//       return () => target.selectionStart;
//     }
//   }
// });

interface ChatEditorProps {
  inCodeMode: boolean;
  placeholder: string;
  submit: () => void;
  onPaste: (codemirrorInstance: CodeMirrorShim, event: ClipboardEvent) => void;
  isAdmin: boolean;
  group: Group;
  association: Association;
}

export interface CodeMirrorShim {
  setValue: (value: string) => void;
  setOption: (option: string, property: any) => void;
  focus: () => void;
  execCommand: (command: string) => void;
  getValue: () => string;
  getInputField: () => HTMLInputElement;
  getCursor: () => number;
  getDoc: () => any;
  element: HTMLElement;
}

const ChatEditor = React.forwardRef<CodeMirrorShim, ChatEditorProps>(({
  inCodeMode,
  placeholder,
  submit,
  onPaste,
  isAdmin,
  group,
  association
}, ref) => {
  const { ship } = useStore();
  const { theme } = useThemeWatcher();
  const editorRef = useRef<CodeMirrorShim | null>(null);
  const scrollViewRef = useRef();
  useImperativeHandle(ref, () => editorRef.current);
  const editor = editorRef.current;
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([]);
  const [enteredUser, setEnteredUser] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [mentionCursor, setMentionCursor] = useState(0);
  const [lastKeyPress, setLastKeyPress] = useState(new Date().getTime());
  const [disableAutocomplete, setDisableAutocomplete] = useState(false);
  const memberArray = useMemo(() => [...(group?.members || [])], [group]);
  const { api } = useApi();
  const disableSpellcheck = useSettingsState(s => s.calm.disableSpellcheck);
  const { message, setMessage } = useChatStore();

  const selectMember = useCallback((patp: string) => () => {
    const replaceText = (text: string, regex: RegExp, set: any) => {
      const matches = text.match(regex);
      const newMention = matches?.find(m => !ob.isValidPatp(m.trim()));
      if (newMention)
        set(text.replace(regex, newMention[0] === ' ' ? ` ${patp}` : patp));
    };

    if (SIG_REGEX.test(message)) {
      replaceText(message, SIG_REGEX, setMessage);
    } else if (MENTION_REGEX.test(message)) {
      replaceText(message, MENTION_REGEX, setMessage);
    }

    setShowAutocomplete(false);
    editor?.focus();
  }, [editor, message, setMessage, mentionedUsers, setMentionedUsers, memberArray]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (inCodeMode) {
      editor.setOption('mode', null);
      editor.setOption('placeholder', 'Code...');
    } else {
      editor.setOption('mode', MARKDOWN_CONFIG);
      editor.setOption('placeholder', placeholder);
    }

    // Force redraw of placeholder
    const value = editor.getValue();
    if(value.length === 0) {
      editor.setValue(' ');
      editor.setValue('');
    }
  }, [inCodeMode, placeholder]);

  const setAutocompleteValues = (show: boolean, suggestions: string[], user: string) => {
    setShowAutocomplete(show);
    setAutoCompleteSuggestions(suggestions.map(s => `~${s}`));
    setEnteredUser(user);
    if (!show && !suggestions.length && !user) {
      setDisableAutocomplete(false);
    }
  };

  const onSubmit = useCallback(() => {
    submit();
    setAutocompleteValues(false, [], '');
  }, [setAutocompleteValues, submit]);

  const messageChange = (editor: CodeMirrorShim | null, data: any, value: string) => {
    if (message !== '' && value == '') {
      setMessage(value);
      setAutocompleteValues(false, [], '');
    }
    if (value == message || value == '' || value == ' ')
      return;

    setLastKeyPress(new Date().getTime());

    if (new Date().getTime() - 100 < lastKeyPress) {
      setMessage(value);
      return;
    }


    setMessage(parseEmojis(value));


    if (!group || memberArray.length > 500 || !value.includes('~'))
      return;

    // test both of these against value.slice of the cursor position
    const cursor = editorRef?.current?.getCursor();
    if (cursor) {
      const testValue = value.slice(0, cursor)

      const sigMatch = SIG_REGEX.test(testValue);
      const mentionMatch = MENTION_REGEX.test(testValue);

      if (sigMatch || mentionMatch) {
        const valueWithoutMembers = memberArray.reduce((cleaned, m) => cleaned.replace(`~${m}`, ''), testValue);

        if (sigMatch && SIG_REGEX.test(valueWithoutMembers)) {
          setAutocompleteValues(true, memberArray.filter(m => !testValue.includes(m)), '');
        } else if (mentionMatch && MENTION_REGEX.test(valueWithoutMembers)) {
          const [patp] = valueWithoutMembers.match(MENTION_REGEX) || [''];
          const ship = patp.replace(/\s*?~/, '');
          const isValid = ob.isValidPatp(patp.replace(' ', ''));

          const matchingMembers = memberArray.filter(m => m.includes(ship) && !testValue.includes(m));
          const includesMember = matchingMembers.includes(ship);
          if (!matchingMembers.length || includesMember) {
            setAutocompleteValues(isValid, [], patp);
          } else {
            setAutocompleteValues(Boolean(matchingMembers.length), matchingMembers, '');
          }
        } else {
          setAutocompleteValues(false, [], '');
        }
      } else {
        setAutocompleteValues(false, [], '');
      }

      setMentionCursor(0);
    }
  };

  const inviteMissingUser = useCallback(async () => {
    try {
      const { ship, name }  = resourceFromPath(association.group);
      await api.thread(invite(
        ship, name,
        [enteredUser],
        `You are invited to ${association.group}`
      ));
      setInvitedUsers([...invitedUsers, enteredUser]);
    } catch (e) {
      console.error(e);
    }
  }, [enteredUser, invitedUsers, setInvitedUsers]);


  return (
    <Row
      style={{
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        maxHeight: 224,
        display: 'flex',
        marginHorizontal: 4,
        overflow: showAutocomplete ? 'visible' : 'scroll',
        position: 'relative',
        width: Dimensions.get('window').width - 128,
      }}
    >
      {(showAutocomplete && !invitedUsers.includes(enteredUser) && !disableAutocomplete) && <ScrollView
        ref={scrollViewRef}
        style={{
          position: "absolute",
          top: Math.min((autocompleteSuggestions.length || 1) * 28 + 11, 95),
          left: -40,
          height: Math.min((autocompleteSuggestions.length || 1) * 28 + 10, 94),
          backgroundColor: theme.colors.black,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.colors.black,
        }}
      >
        {<AutocompletePatp
          scrollViewRef={scrollViewRef}
          isAdmin={isAdmin}
          suggestions={autocompleteSuggestions}
          enteredUser={enteredUser}
          inviteMissingUser={inviteMissingUser}
          mentionCursor={mentionCursor}
          selectMember={selectMember}
        />}
        <TouchableOpacity onPress={() => setDisableAutocomplete(true)}
          style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}>
          <Ionicons name="close" style={{ paddingVertical: 6, paddingHorizontal: 4 }} />
        </TouchableOpacity>
      </ScrollView>}
      <TextInput
        spellCheck={!disableSpellcheck}
        value={message}
        multiline
        style={{
          width: '100%',
          color: theme.colors.black,
          height: '100%',
          minHeight: 44,
          fontFamily: inCodeMode ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : undefined,
          zIndex: 0,
        }}
        placeholderTextColor={theme.colors.black}
        placeholder={inCodeMode ? 'Code...' : 'Message...'}
        onChangeText={text =>
          messageChange(null, null, text)
        }
      />
    </Row>
  );
});

export default ChatEditor;
