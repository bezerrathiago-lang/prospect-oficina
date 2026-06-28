/**
 * StoresSection — gestão de lojas (Configurações / Admin).
 *
 * Lista lojas ativas/inativas, permite cadastrar, renomear e ativar/desativar.
 */
import { useState } from 'react';
import { useStores, useCreateStore, useUpdateStore } from '../../hooks/useStores.js';
import type { Store } from '../../services/stores.service.js';

export default function StoresSection() {
  const { data: stores, isLoading, isError } = useStores(true);
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const active = stores?.filter((s) => s.is_active) ?? [];
  const inactive = stores?.filter((s) => !s.is_active) ?? [];

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createStore.mutateAsync({ name });
      setNewName('');
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar loja.');
    }
  }

  function startEdit(store: Store) {
    setEditingId(store.id);
    setEditName(store.name);
  }

  async function handleRename(id: number) {
    const name = editName.trim();
    if (!name) return;
    setError(null);
    try {
      await updateStore.mutateAsync({ id, data: { name } });
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar loja.');
    }
  }

  async function toggleActive(store: Store) {
    setError(null);
    try {
      await updateStore.mutateAsync({ id: store.id, data: { is_active: !store.is_active } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar loja.');
    }
  }

  return (
    <section className="mt-8" aria-labelledby="stores-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="stores-heading" className="text-base font-semibold text-gray-800">
          Lojas
        </h2>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setNewName('');
          }}
          className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          <span aria-hidden="true">+</span>
          Adicionar
        </button>
      </div>

      <div className="mb-4 h-px bg-gray-200" />

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {adding && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
            placeholder="Nome da loja"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={createStore.isPending || !newName.trim()}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar lojas.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2">
          {active.length === 0 && !adding && (
            <p className="py-4 text-center text-sm text-gray-500">Nenhuma loja cadastrada.</p>
          )}
          {active.map((store) => (
            <div
              key={store.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              {editingId === store.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleRename(store.id)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => void handleRename(store.id)}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800">{store.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(store)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(store)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Desativar
                  </button>
                </>
              )}
            </div>
          ))}

          {inactive.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium text-gray-400">Inativas</p>
              {inactive.map((store) => (
                <div
                  key={store.id}
                  className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <span className="flex-1 text-sm text-gray-500">{store.name}</span>
                  <button
                    type="button"
                    onClick={() => void toggleActive(store)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-brand-red hover:bg-red-50"
                  >
                    Reativar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
