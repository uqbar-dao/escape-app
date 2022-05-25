import React from 'react';
import { LayoutChangeEvent, TouchableWithoutFeedback, ViewProps } from 'react-native';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { Row } from '../spacing/Row';
import { Text } from '../Themed';

interface AutocompletePatpProps extends ViewProps {
  suggestions: string[];
  isAdmin: boolean;
  mentionCursor: number;
  enteredUser: string;
  selectMember: (member: string) => () => void;
  inviteMissingUser: () => Promise<void>;
  scrollViewRef: any
}

interface AutocompleteSuggestionRowProps extends ViewProps {
  onPress?: () => void;
  backgroundColor?: string;
}

function AutocompleteSuggestionRow({ children, backgroundColor, onPress }: AutocompleteSuggestionRowProps) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Row style={{
        height: 28,
        paddingVertical: 6,
        paddingHorizontal: 45,
        backgroundColor,
      }}>
        {children}
      </Row>
    </TouchableWithoutFeedback>
  );  
}

export function AutocompletePatp({
  suggestions,
  isAdmin,
  mentionCursor,
  enteredUser,
  selectMember,
  inviteMissingUser,
  scrollViewRef,
}: AutocompletePatpProps) {
  const { theme: { colors } } = useThemeWatcher();

  if (suggestions.length) {
    return <>
      {suggestions.map((suggestion, i) => (
        <AutocompleteSuggestionRow
          key={suggestion}
          onPress={selectMember(suggestion)}
          backgroundColor={mentionCursor === i ? colors.washedGray : undefined}
          onLayout={(event: LayoutChangeEvent) => scrollViewRef?.scrollTo({ y: event.nativeEvent.layout, animated: true })}
        >
          <Text mono style={{ color: "rgba(33,157,255,1)" }}>{suggestion}</Text>
        </AutocompleteSuggestionRow>
      ))}
    </>;
  } else if (isAdmin) {
    return <AutocompleteSuggestionRow onPress={inviteMissingUser}>
      <Text>
        Invite <Text mono style={{ color: "rgba(33,157,255,1)" }}>{enteredUser}</Text> to group
      </Text>
    </AutocompleteSuggestionRow>;
  }

  // TODO?: if group is public and mention is not in group, give option to share group with user
  return <AutocompleteSuggestionRow>
    <Text mono style={{ color: "rgba(33,157,255,1)" }}>{enteredUser + ' '}</Text>
    <Text>is not in this group</Text>
  </AutocompleteSuggestionRow>;
}
