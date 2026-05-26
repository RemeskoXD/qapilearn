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

  const errors: string[] = [];

  await Promise.all([
    ...toDelete.map((i) => api.delete(`${basePath}/${i.id}`).catch((err) => {
      console.error(`[Sync Delete ${basePath}] Failed to delete item:`, err);
      errors.push(`Smazání se nezdařilo: ${err?.message || err}`);
    })),
    ...toCreate.map((i) => api.post(basePath, i).catch((err) => {
      console.error(`[Sync Create ${basePath}] Failed to create item:`, err);
      errors.push(`Vytvoření se nezdařilo: ${err?.message || err}`);
    })),
    ...toUpdate.map((i) => api.put(`${basePath}/${i.id}`, i).catch((err) => {
      console.error(`[Sync Update ${basePath}] Failed to update item:`, err);
      errors.push(`Aktualizace se nezdařila: ${err?.message || err}`);
    })),
  ]);

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}
