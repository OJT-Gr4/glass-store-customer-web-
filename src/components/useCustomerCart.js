import { useMemo, useSyncExternalStore } from 'react';
import { createCustomerCartStore } from './customerCartStore.js';

export function useCustomerCart(customerId) {
  const store = useMemo(() => createCustomerCartStore(customerId), [customerId]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return [state.items, store.setItems, state.error];
}
