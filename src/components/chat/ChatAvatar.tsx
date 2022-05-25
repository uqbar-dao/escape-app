import { Contact } from '@urbit/api';
import React from 'react';
import { Image } from 'react-native';
// import { Sigil } from '~/logic/lib/sigil';
import { uxToHex } from '../../util/landscape';
import Sigil from '../Sigil';
import { View } from '../Themed';

interface ChatAvatar {
  hideAvatars: boolean;
  contact?: Contact;
}

export function ChatAvatar({ contact, hideAvatars }: any) {
  const color = contact ? uxToHex(contact.color) : '000000';
  const sigilClass = contact ? '' : 'mix-blend-diff';

  if (contact && contact?.avatar && !hideAvatars) {
    return (
      <Image
        source={{ uri: contact.avatar }}
        style={{
          flexShrink: 0,
          height: 24,
          width: 24,
          borderRadius: 1,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: 24,
        height: 24,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: `#${color}`,
        borderRadius: 1,
      }}
    >
      <Sigil
        ship={global.ship}
        size={16}
        color={`#${color}`}
        icon
        padding={2}
      />
    </View>
  );
}
