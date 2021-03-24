import { atom } from 'recoil';

export const isLoadingState = atom({
  key: 'isLoadingState',
  default: false,
});

export const notificationAlertState = atom({
  key: 'notificationAlertState',
  default: null,
});

export const viewerSessionState = atom({
  key: 'viewerSessionState',
  default: null,
});

export const showUserLoginState = atom({
  key: 'showUserLoginState',
  default: false,
});
