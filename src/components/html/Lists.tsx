import React from 'react';
import { FlatList } from 'react-native';
import { Row } from '../spacing/Row';
import { Text } from '../Themed';

export const Ul = ({ children }: any) => {

  if (!children || !children.length) {
    return null;
  }

  return (
    <FlatList
      data={children.map((element, index) => ({ element, index }))}
      renderItem={({ element, index }) => (
        <Row key={index}>
          <Text style={{  }}>{'\u2B24' + ' '}</Text>
          {element}
        </Row>
      )}
    />
  );
}

export const Ol = ({ children }: any) => {

  if (!children || !children.length) {
    return null;
  }

  return (
    <FlatList
      data={children.map((element, index) => ({ element, index }))}
      renderItem={({ element, index }) => (
        <Row key={index}>
          <Text style={{  }}>{`${index}. `}</Text>
          {element}
        </Row>
      )}
    />
  );
}

