import { Content } from '@urbit/api';
import React from 'react';
import { referenceToPermalink } from '../util/permalinks';
import { cite, citeNickname, deSig } from '../util/landscape';
import { useContact } from '../state/useContactState';
import { useShowNickname } from '../state/useSettingsState';
import { PropFunc } from './graph/GraphContent';
import { Text } from './Themed';
import { useThemeWatcher } from '../hooks/useThemeWatcher';

interface MentionTextProps {
  content: Content[];
}
export function MentionText({ content }: MentionTextProps) {
  return (
    <Text>
      {content.reduce((accum, c) => {
        if ('text' in c) {
          return accum + c.text;
        } else if ('mention' in c) {
          return accum + `[~${c.mention}]`;
        } else if ('url' in c) {
          return accum + `\n ${c.url}`;
        } else if ('reference' in c) {
          const { link } = referenceToPermalink(c);
          return accum + `\n [${link}]`;
        }
        return accum;
      }, '')}
    </Text>
  );
}

export function Mention(props: {
  ship: string;
  first?: boolean;
  emphasis?: 'bold' | 'italic';
} & PropFunc<typeof Text>) {
  const { theme: { colors } } = useThemeWatcher();
  const { ship, first = false, emphasis } = props;
  const contact = useContact(`~${deSig(ship)}`);
  const showNickname = useShowNickname(contact);
  const name = citeNickname(ship, showNickname, contact?.nickname);
  return (
    <Text bold={emphasis === 'bold'}
      mono={!showNickname}
      style={{
        marginLeft: first ? 0 : 2,
        marginRight: 2,
        paddingHorizontal: 2,
        color: colors.blue,
        fontStyle: emphasis === 'italic' ? 'italic' : undefined,
        fontSize: showNickname ? 16 : 12,
      }}
    >
      {name}
    </Text>
  );
}
