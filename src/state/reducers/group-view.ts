import { BaseState } from '../base';
import useGroupState, { GroupState as State } from '../useGroupState';

type GroupState = State & BaseState<State>;

const initial = (json: any, state: GroupState): GroupState => {
  const data = json.initial;
  if(data) {
    state.pendingJoin = data;
  }
  return state;
};

const started = (json: any, state: GroupState): GroupState => {
  const data = json.started;
  if(data) {
    const { resource, request } = data;
    state.pendingJoin[resource] = request;
  }
  return state;
};

const progress = (json: any, state: GroupState): GroupState => {
  const data = json.progress;
  if(data) {
    try {
      const { progress, resource } = data;
      state.pendingJoin[resource].progress = progress;
      if(progress === 'done') {
        setTimeout(() => {
          useGroupState.getState().set((state) => {
            delete state.pendingJoin[resource];
          });
        }, 10000);
      }
    } catch (e) {
      console.warn('ERROR SETTING GROUP PROGRESS');
    }
  }
  return state;
};

const hide = (json: any, state: GroupState) => {
  const data = json.hide;
  if(data) {
    state.pendingJoin[data].hidden = true;
  }
  return state;
};

export const reduce = [
  progress,
  hide,
  started,
  initial
];
