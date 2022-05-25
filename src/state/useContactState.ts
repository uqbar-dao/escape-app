import { Contact, deSig, Patp, Rolodex, fetchIsAllowed } from '@urbit/api';
import { useCallback } from 'react';
import _ from 'lodash';
import { reduce, reduceNacks } from './reducers/contact-update';
import {
  createState,
  createSubscription,
  reduceStateN
} from './base';
import Urbit from '../api';

export interface ContactState {
  contacts: Rolodex;
  isContactPublic: boolean;
  nackedContacts: Set<Patp>;
}

// @ts-ignore investigate zustand types
const useContactState = createState<ContactState>(
  'Contact',
  {
    contacts: {},
    nackedContacts: new Set(),
    isContactPublic: false
  },
  ['nackedContacts'],
  [
    (set, get) =>
      createSubscription('contact-pull-hook', '/nacks', (e) => {
        const data = e?.resource;
        if (data) {
          reduceStateN(get(), data, [reduceNacks]);
        }
      }),
    (set, get) =>
      createSubscription('contact-store', '/all', (e) => {
        const data = _.get(e, 'contact-update', false);
        if (data) {
          reduceStateN(get(), data, reduce);
        }
      })
  ]
);

export function useContact(ship: string) {
  return useContactState(
    useCallback(s => s.contacts[`~${deSig(ship)}`] as Contact | null, [ship])
  );
}

export function useOurContact() {
  return useContact(`~${global.ship}`);
}

export async function disallowedShipsForOurContact(
  ships: string[],
  api: Urbit,
): Promise<string[]> {
  return _.compact(
    await Promise.all(
      ships.map(async (s) => {
        const ship = `~${s}`;
        if (s === global.ship) {
          return null;
        }
        const allowed = await api.scry(fetchIsAllowed(
          `~${global.ship}`,
          'personal',
          ship,
          true
        ));
        return allowed ? null : ship;
      })
    )
  );
}


export default useContactState;
