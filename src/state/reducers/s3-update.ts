import _ from 'lodash';
import { StorageState as State } from '../useStorageState';
import { BaseState } from '../base';

export interface S3Credentials {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface S3UpdateCredentials {
  credentials: S3Credentials;
}

interface S3UpdateConfiguration {
  configuration: {
    buckets: string[];
    currentBucket: string;
  }
}

interface S3UpdateCurrentBucket {
  setCurrentBucket: string;
}

interface S3UpdateAddBucket {
  addBucket: string;
}

interface S3UpdateRemoveBucket {
  removeBucket: string;
}

interface S3UpdateEndpoint {
  setEndpoint: string;
}

interface S3UpdateAccessKeyId {
  setAccessKeyId: string;
}

interface S3UpdateSecretAccessKey {
  setSecretAccessKey: string;
}

export type S3Update =
  S3UpdateCredentials
| S3UpdateConfiguration
| S3UpdateCurrentBucket
| S3UpdateAddBucket
| S3UpdateRemoveBucket
| S3UpdateEndpoint
| S3UpdateAccessKeyId
| S3UpdateSecretAccessKey;


type StorageState = State & BaseState<State>;

const credentials = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'credentials', false);
  if (data) {
    state.s3.credentials = data;
  }
  return state;
};

const configuration = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'configuration', false);
  if (data) {
    state.s3.configuration = {
      buckets: new Set(data.buckets),
      currentBucket: data.currentBucket
    };
  }
  return state;
};

const currentBucket = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'setCurrentBucket', false);
  if (data && state.s3) {
    state.s3.configuration.currentBucket = data;
  }
  return state;
};

const addBucket = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'addBucket', false);
  if (data) {
    state.s3.configuration.buckets =
      state.s3.configuration.buckets.add(data);
  }
  return state;
};

const removeBucket = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'removeBucket', false);
  if (data) {
    state.s3.configuration.buckets.delete(data);
  }
  return state;
};

const endpoint = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'setEndpoint', false);
  if (data && state.s3.credentials) {
    state.s3.credentials.endpoint = data;
  }
  return state;
};

const accessKeyId = (json: S3Update , state: StorageState): StorageState => {
  const data = _.get(json, 'setAccessKeyId', false);
  if (data && state.s3.credentials) {
    state.s3.credentials.accessKeyId = data;
  }
  return state;
};

const secretAccessKey = (json: S3Update, state: StorageState): StorageState => {
  const data = _.get(json, 'setSecretAccessKey', false);
  if (data && state.s3.credentials) {
    state.s3.credentials.secretAccessKey = data;
  }
  return state;
};

export const reduce = [
  credentials,
  configuration,
  currentBucket,
  addBucket,
  removeBucket,
  endpoint,
  accessKeyId,
  secretAccessKey
];
