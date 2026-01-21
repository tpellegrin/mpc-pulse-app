import { Dispatch, SetStateAction } from 'react';

export enum RouterType {
  guest,
  user,
  onboarding,
}

export type ContextProps = {
  routerType: RouterType;
  setRouterType: Dispatch<SetStateAction<RouterType>>;
};
