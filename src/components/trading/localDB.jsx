// Local storage database - simulation mode runs fully offline (no server needed)

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function getCollection(name) {
  try { return JSON.parse(localStorage.getItem(`simdb_${name}`) || '[]'); } catch { return []; }
}
function saveCollection(name, data) {
  try { localStorage.setItem(`simdb_${name}`, JSON.stringify(data)); } catch {}
}
function applySort(items, sort = '-created_date') {
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '', bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function createLocalEntity(collectionName) {
  return {
    list: (sort = '-created_date', limit = 200) => {
      const items = applySort(getCollection(collectionName), sort);
      return Promise.resolve(items.slice(0, limit));
    },
    filter: (query = {}, sort = '-created_date', limit = 200) => {
      let items = getCollection(collectionName).filter(item =>
        Object.entries(query).every(([k, v]) => item[k] === v)
      );
      return Promise.resolve(applySort(items, sort).slice(0, limit));
    },
    create: (data) => {
      const items = getCollection(collectionName);
      const now = new Date().toISOString();
      const item = { ...data, id: generateId(), created_date: now, updated_date: now };
      items.push(item);
      saveCollection(collectionName, items);
      return Promise.resolve(item);
    },
    update: (id, data) => {
      const items = getCollection(collectionName);
      const idx = items.findIndex(i => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...data, updated_date: new Date().toISOString() };
        saveCollection(collectionName, items);
        return Promise.resolve(items[idx]);
      }
      return Promise.resolve(null);
    },
    delete: (id) => {
      saveCollection(collectionName, getCollection(collectionName).filter(i => i.id !== id));
      return Promise.resolve();
    },
    schema: () => Promise.resolve({}),
  };
}

export const localDB = {
  SimulatedTrade: createLocalEntity('SimulatedTrade'),
  TradeLog: createLocalEntity('TradeLog'),
  TradingSettings: createLocalEntity('TradingSettings'),
};