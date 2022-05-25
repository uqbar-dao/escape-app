import _ from 'lodash';
import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputFocusEventData } from 'react-native';
import { useDropdown } from '../../hooks/useDropdown';
import { useThemeWatcher } from '../../hooks/useThemeWatcher';
import { PropFunc } from '../graph/GraphContent';
import { View } from '../Themed';

interface DropdownSearchExtraProps<C> {
  // check if entry is exact match
  isExact?: (s: string) => C | undefined;
  // Options for dropdown
  candidates: C[];
  // Present options in dropdown
  renderCandidate: (
    c: C,
    selected: boolean,
    onSelect: (c: C) => void
  ) => React.ReactNode;
  // get a unique key for comparisons/react lists
  getKey: (c: C) => string;
  // search predicate
  search: (s: string, c: C) => boolean;
  onSelect: (c: C) => void;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (e: string) => void;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?:  (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
}

type DropdownSearchProps<C> = PropFunc<typeof View> &
DropdownSearchExtraProps<C>;

export function DropdownSearch<C>(props: DropdownSearchProps<C>): ReactElement {
  const textarea = useRef<TextInput>(null);
  const {
    candidates,
    getKey,
    search: searchPred,
    onSelect,
    isExact,
    renderCandidate,
    disabled,
    placeholder,
    onFocus = (): void => {},
    onChange = (): void => {},
    onBlur = (): void => {},
  } = props;

  const { theme } = useThemeWatcher();
  const [query, setQuery] = useState('');
  const exact = useCallback(
    (s: string) => {
      return isExact ? isExact(s) : undefined;
    },
    [isExact]
  );

  const { next, back, search, selected, options } = useDropdown(
    candidates,
    getKey,
    searchPred,
    exact
  );

  const handleSelect = useCallback(
    (c: C) => {
      setQuery('');
      onSelect(c);
    },
    [setQuery, onSelect]
  );

  const changeCallback = useCallback(
    (value: string) => {
      onChange(value);
      search(value);
      setQuery(value);
    },
    [search, onChange]
  );

  const dropdown = useMemo(() => {
    const first = props.isExact?.(query);
    let opts = options;
    if (first) {
      opts = options.includes(first) ? opts : [first, ...options];
    }
    return _.take(opts, 5).map((o, idx) =>
      props.renderCandidate(
        o,
        !_.isUndefined(selected) && props.getKey(o) === props.getKey(selected),
        handleSelect
      )
    );
  }, [options, props.getKey, props.renderCandidate, selected]);

  return (
    <View style={{ position: 'relative', zIndex: 9 }}>
      <TextInput
        ref={textarea}
        onChangeText={changeCallback}
        value={query}
        autoCompleteType="off"
        keyboardType="visible-password"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.black}
        editable={!disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        style={{ fontSize: 16, color: theme.colors.black }}
      />
      {dropdown.length !== 0 && query.length !== 0 && (
        <View style ={{
          marginTop: 1,
          borderWidth: 1,
          borderRadius: 1,
          borderColor: theme.colors.washedGray,
          backfaceVisibility: 'visible',
          width: '100%',
        }}>
          {dropdown}
        </View>
      )}
    </View>
  );
}
