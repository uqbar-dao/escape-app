import { ContactUpdate, GroupUpdate, InviteUpdate, MetadataUpdate, SettingsUpdate } from '@urbit/api';

export const leapCategories = ['mychannel', 'messages', 'updates', 'profile', 'settings', 'logout'];

export type LeapCategories = typeof leapCategories[number];

interface LocalUpdateSetDark {
  setDark: boolean;
}

interface LocalUpdateBaseHash {
  baseHash: string;
}

interface LocalUpdateRuntimeLag {
  runtimeLag: boolean;
}

interface LocalUpdateBackgroundConfig {
  backgroundConfig: BackgroundConfig;
}

interface LocalUpdateHideAvatars {
  hideAvatars: boolean;
}

interface LocalUpdateHideNicknames {
  hideNicknames: boolean;
}

interface LocalUpdateSetOmniboxShown {
  omniboxShown: boolean;
}

export interface RemoteContentPolicy {
  imageShown: boolean;
  audioShown: boolean;
  videoShown: boolean;
  oembedShown: boolean;
}

interface BackgroundConfigUrl {
  type: 'url';
  url: string;
}

interface BackgroundConfigColor {
  type: 'color';
  color: string;
}

export type BackgroundConfig = BackgroundConfigUrl | BackgroundConfigColor | undefined;

export type LocalUpdate =
| LocalUpdateSetDark
| LocalUpdateBaseHash
| LocalUpdateRuntimeLag
| LocalUpdateBackgroundConfig
| LocalUpdateHideAvatars
| LocalUpdateHideNicknames
| LocalUpdateSetOmniboxShown
| RemoteContentPolicy;

export type LaunchUpdate =
  LaunchUpdateInitial
| LaunchUpdateFirstTime
| LaunchUpdateOrder
| LaunchUpdateIsShown;

interface LaunchUpdateInitial {
  initial: LaunchState;
}

interface LaunchUpdateFirstTime {
  changeFirstTime: boolean;
}

interface LaunchUpdateOrder {
  changeOrder: string[];
}

interface LaunchUpdateIsShown {
  changeIsShown: {
    name: string;
    isShown: boolean;
  }
}

export interface LaunchState {
  firstTime: boolean;
  tileOrdering: string[];
  tiles: {
    [app: string]: Tile;
  }
}

export interface Tile {
  isShown: boolean;
  type: TileType;
}

type TileType = TileTypeBasic | TileTypeCustom;

export interface TileTypeBasic {
  basic: {
    iconUrl: string;
    linkedUrl: string;
    title: string;
  }
}

interface TileTypeCustom {
  custom: any;
}

interface WeatherDay {
  apparentTemperature: number;
  cloudCover: number;
  dewPoint: number;
  humidity: number;
  icon: string;
  ozone: number;
  precipIntensity: number;
  precipProbability: number;
  precipType: string;
  pressure: number;
  summary: string;
  temperature: number;
  time: number;
  uvIndex: number;
  visibility: number;
  windBearing: number;
  windGust: number;
  windSpeed: number;
}

export interface WeatherState {
  currently: WeatherDay;
  daily: {
    data: WeatherDay[];
    icon: string;
    summary: string;
  }
}


export type ConnectionStatus = 'reconnecting' | 'disconnected' | 'connected';

interface MarksToTypes {
  readonly json: any;
  readonly 'contact-update': ContactUpdate;
  readonly 'invite-update': InviteUpdate;
  readonly 'metadata-update': MetadataUpdate;
  readonly groupUpdate: GroupUpdate;
  readonly 'launch-update': LaunchUpdate;
  readonly 'settings-event': SettingsUpdate;
  // not really marks but w/e
  readonly 'local': LocalUpdate;
  readonly 'weather': WeatherState | {};
  readonly 'location': string;
  readonly 'connection': ConnectionStatus;
}

export type Cage = Partial<MarksToTypes>;

export type Mark = keyof MarksToTypes;
