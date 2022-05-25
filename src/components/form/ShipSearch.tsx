import { Groups, Rolodex } from '@urbit/api';
import _ from 'lodash';
import React, { ReactElement, useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, ScrollView, TouchableOpacity } from 'react-native';
import ob from 'urbit-ob';
import { Ionicons } from '@expo/vector-icons';
import { cite, deSig } from '../../util/landscape';
import useContactState from '../../state/useContactState';
import useGroupState from '../../state/useGroupState';
import usePalsState from '../../state/usePalsState';
import { Col } from '../spacing/Col';
import { Text } from '../Themed';
import { DropdownSearch } from './DropdownSearch';
import { Row } from '../spacing/Row';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { H4 } from '../html/Headers';

interface InviteSearchProps<I extends string> {
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
  caption?: string;
  id: I;
  hideSelection?: boolean;
  maxLength?: number;
  excluded?: string[];
  selected: string[];
  setSelected: (invited: string[]) => void;
}

const getNicknameForShips = (groups: Groups, contacts: Rolodex, selected: string[]): readonly [string[], Map<string, string[]>] => {
  const peerSet = new Set<string>();
  const nicknames = new Map<string, string[]>();
  _.forEach(groups, (group, path) => {
    if (group.members.size > 0) {
      const groupEntries = group.members.values();
      for (const member of groupEntries) {
        if(!selected.includes(member)) {
          peerSet.add(member);
        }
      }
    }

    const groupContacts = contacts;

    if (groupContacts) {
      const groupEntries = group.members.values();
      for (const member of groupEntries) {
        if (groupContacts[`~${member}`]) {
          if (nicknames.has(member)) {
            nicknames.get(member)?.push(groupContacts[`~${member}`].nickname);
          } else {
            nicknames.set(member, [groupContacts[`~${member}`].nickname]);
          }
        }
      }
    }
  });
  return [Array.from(peerSet), nicknames] as const;
};

const Candidate = (
  { title, detail, selected, onPress, theme }:
  { title: string; detail: string; selected: boolean; onPress: () => void; theme: any }
): ReactElement => (
  <TouchableOpacity onPress={onPress}>
    <Row style={{
      justifyContent: 'space-between',
      alignItems: 'center',
      borderColor: theme.colors.washedGray,
      backgroundColor: selected ? theme.colors.washedGray : theme.colors.white,
      color: theme.colors.black,
      fontSize: 14,
      padding: 2,
      width: '100%',
    }}>
      <Text mono>{cite(title)}</Text>
      <Text style={{ maxWidth: '50%' }}>{detail}</Text>
    </Row>
  </TouchableOpacity>
);

type Value<I extends string> = {
  [k in I]: string[];
};

// const shipItemSchema = Yup.string().test(
//   'is-patp',
//   '${value} is not a valid @p',
//   x => ob.isValidPatp(`~${x}`)
// );

export function ShipSearch<I extends string, V extends Value<I>>(
  props: InviteSearchProps<I>
): ReactElement {
  const { id, label, excluded = [], selected, setSelected } = props;
  const { theme } = useThemeWatcher();

  const { contacts } = useContactState();
  const { groups } = useGroupState();
  const { pals } = usePalsState();
  const palsList = Object.keys(pals.outgoing).filter(p => !excluded.includes(p));

  const [peers, nicknames] = useMemo(
    () => getNicknameForShips(groups, contacts, selected),
    [contacts, groups, selected]
  );

  const renderCandidate = useCallback(
    (s: string, selected: boolean, onSelect: (s: string) => void) => {
      const detail = _.uniq(nicknames.get(s)).join(', ');
      const onPress = () => {
        onSelect(s);
      };

      return (
        <Candidate
          key={s}
          title={s}
          detail={detail}
          selected={selected}
          onPress={onPress}
          theme={theme}
        />
      );
    },
    [nicknames]
  );

  const onChange = (text: string) => {
    // const newValue = text?.length > 0 ? `~${deSig(text)}` : '';
    // setSelected(selected.concat([newValue]));
  };

  const isExact = useCallback((s: string) => {
    const ship = `~${deSig(s)}`;
    const result = ob.isValidPatp(ship);
    return (result && !selected.includes(deSig(s)))
      ? deSig(s) ?? undefined
      : undefined;
  }, [selected]);

  const onAdd = (ship: string) => {
    if (!selected.includes(ship)) {
      setSelected(selected.concat([ship]));
    }
  };

  const onRemove = (ship: string) => {
    setSelected(selected.filter((s) => s !== ship));
  };

  return (
    <Col style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 18, marginVertical: 16 }}>{label}</Text>
      <DropdownSearch<string>
        isExact={isExact}
        placeholder="Search for ships"
        candidates={peers}
        renderCandidate={renderCandidate}
        disabled={
          props.maxLength ? selected.length >= props.maxLength : false
        }
        search={(s: string, t: string) =>
          (t || '').toLowerCase().startsWith(s.toLowerCase())
        }
        getKey={(s: string) => s}
        onChange={onChange}
        onSelect={onAdd}
      />
      <Row style={{ marginTop: 8, minHeight: 34, flexWrap: 'wrap' }} >
        {selected.map((s) => (
          <Row key={s}
            style={{
              alignItems: 'center',
              paddingVertical: 2,
              paddingHorizontal: 4,
              color: theme.colors.black,
              borderRadius: 2,
              bg: theme.colors.washedGray,
              fontSize: 0,
              marginTop: 4,
              marginRight: 4,
            }}
          >
            <Text mono>{cite(s)}</Text>
            <TouchableOpacity onPress={() => onRemove(s)}>
              <Ionicons size={16} style={{ marginLeft: 6 }} name="close" />
            </TouchableOpacity>
          </Row>
        ))}
      </Row>
      {palsList.length > 0 && (
        <>
          <Text style={{ marginTop: 4 }}>Your pals</Text>
          <ScrollView style={{ height: 200, marginTop: 4 }}>
            {palsList.map(p => (
              <TouchableOpacity key={p} style={{ padding: 2, paddingHorizontal: 4 }} onPress={() => onAdd(p)}>
                <Text>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </Col>
  );
}
