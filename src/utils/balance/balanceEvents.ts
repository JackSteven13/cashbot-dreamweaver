
import { BalanceEvent } from './types';

export const emitBalanceUpdate = (detail: BalanceEvent) => {
  window.dispatchEvent(new CustomEvent('balance:force-update', { detail }));
};

export const emitBalanceSync = (detail: BalanceEvent) => {
  window.dispatchEvent(new CustomEvent('balance:sync-response', { detail }));
};

export const emitSignificantChange = (
  localBalance: number,
  serverBalance: number,
  resolvedBalance: number
) => {
  window.dispatchEvent(new CustomEvent('balance:significant-change', {
    detail: { localBalance, serverBalance, resolvedBalance }
  }));
};
