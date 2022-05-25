import React, { useCallback, useContext, useEffect, useState } from 'react';
import usePreviousValue from '../hooks/usePreviousValue';
import { Primitive } from '../types/primitive';

export interface VirtualContextProps {
  save: () => void;
  restore: () => void;
}
const fallback: VirtualContextProps = {
  save: () => {},
  restore: () => {}
};

export const VirtualContext = React.createContext(fallback);

export function useVirtual() {
  return useContext(VirtualContext);
}

export const withVirtual = <P extends {}>(Component: React.ComponentType<P>) =>
  React.forwardRef((props: P, ref) => (
    <VirtualContext.Consumer>
      {context => <Component ref={ref} {...props} {...context} />}
    </VirtualContext.Consumer>
  ));

export function useVirtualResizeState(s: boolean) {
  const [state, _setState] = useState(s);
  const { save, restore } = useVirtual();

  const setState = useCallback(
    (sta: boolean) => {
      save();
      _setState(sta);
    },
    [_setState, save]
  );

  useEffect(() => {
    requestAnimationFrame(restore);
  }, [state]);

  return [state, setState] as const;
}

export function useVirtualResizeProp(prop: Primitive) {
  const { save, restore } = useVirtual();
  const oldProp = usePreviousValue(prop);

  if(prop !== oldProp) {
    save();
  }

  useEffect(() => {
    requestAnimationFrame(restore);
  }, [prop]);
}
