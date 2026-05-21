import { api } from './api';

/**
 * Synchronizuje stará a nová data – pošle POST pro nové, PUT pro změněné,
 * DELETE pro odebrané. Vrací slib, který se vyřeší až po všech operacích.
 */
export async function syncCollection<T extends { id: string }>(
  basePath: string,
  oldItems: T[],
  newItems: T[]
): Promise<void> {
  const oldMap = new Map(oldItems.map((i) => [i.id, i]));
  const newMap = new Map(newItems.map((i) => [i.id, i]));

  const toDelete = oldItems.filter((i) => !newMap.has(i.id));
  const toCreate = newItems.filter((i) => !oldMap.has(i.id));
  const toUpdate = newItems.filter((i) => {
    const old = oldMap.get(i.id);
    if (!old) return false;
    return JSON.stringify(old) !== JSON.stringify(i);
  });

  await Promise.all([
    ...toDelete.map((i) => api.delete(`${basePath}/${i.id}`).catch(() => {})),
    ...toCreate.map((i) => api.post(basePath, i).catch(() => {})),
    ...toUpdate.map((i) => api.put(`${basePath}/${i.id}`, i).catch(() => {})),
  ]);
}
