const prefix = 'optivision.customer.cart.v1:';

export function cartStorageKey(customerId) {
  if (customerId == null) return `${prefix}guest`;
  if (!Number.isSafeInteger(Number(customerId)) || Number(customerId) <= 0)
    throw new Error('Không xác định được tài khoản lưu giỏ hàng.');
  return `${prefix}${Number(customerId)}`;
}

function validItems(items) {
  if (!Array.isArray(items) || items.some(item => !item || typeof item.sku !== 'string' || !item.sku
    || !Number.isInteger(item.quantity) || item.quantity <= 0
    || !Number.isFinite(item.price) || item.price < 0))
    throw new Error('Giỏ hàng đã lưu không hợp lệ.');
  return items;
}

// Each store is tied to one owner, including callbacks from a checkout that finishes after logout.
export function createCustomerCartStore(customerId, storage) {
  const key = cartStorageKey(customerId);
  let snapshot;
  try {
    storage ??= globalThis.localStorage;
    snapshot = { items: validItems(JSON.parse(storage.getItem(key) || '[]')), error: '' };
  }
  catch { snapshot = { items: [], error: 'Không đọc được giỏ đã lưu. Dữ liệu cũ chưa bị xóa.' }; }
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setItems(update) {
      const items = validItems(typeof update === 'function' ? update(snapshot.items) : update);
      let error = '';
      try { storage.setItem(key, JSON.stringify(items)); }
      catch { error = 'Không lưu được giỏ trên thiết bị. Giữ trang này mở để tránh mất thay đổi.'; }
      snapshot = { items, error };
      listeners.forEach(listener => listener());
    },
  };
}

export function claimGuestCart(customerId, merge, storage) {
  const guest = createCustomerCartStore(null, storage);
  if (!guest.getSnapshot().items.length) return '';
  const owner = createCustomerCartStore(customerId, storage);
  if (owner.getSnapshot().error) return 'Giỏ tạm chưa gộp vì không đọc được giỏ của tài khoản.';
  try {
    owner.setItems(items => guest.getSnapshot().items.reduce((next, item) => merge(next, item), items));
    if (owner.getSnapshot().error) return owner.getSnapshot().error;
    guest.setItems([]);
    return guest.getSnapshot().error;
  } catch { return 'Giỏ tạm chưa gộp do khác thông số kính hoặc vượt tồn kho. Giỏ tạm vẫn được giữ trên thiết bị.'; }
}
