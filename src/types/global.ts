import { PatpNoSig } from '@urbit/api';

declare global {
  interface Global {
    ship: PatpNoSig;
    desk: string;
    bootstrapApi: Function;
  }
}
