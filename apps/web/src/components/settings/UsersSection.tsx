/**
 * UsersSection — gestão de usuários (Configurações / Admin).
 *
 * Lista usuários (consultores/gerentes/admin) e permite criar novos via
 * Edge Function admin-create-user (Admin define a senha inicial).
 */
import { useState } from 'react';
import { useUsers, useCreateUser } from '../../hooks/useUsers.js';
import { useStores } from '../../hooks/useStores.js';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gerente',
  consultant: 'Consultor',
};

export default function UsersSection() {
  const { data: users, isLoading, isError } = useUsers();
  const { data: stores } = useStores(false);
  const createUser = useCreateUser();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'consultant' | 'manager'>('consultant');
  const [storeId, setStoreId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('consultant');
    setStoreId('');
    setError(null);
  }

  async function handleCreate() {
    setError(null);
    setSuccess(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (role === 'consultant' && !storeId) {
      setError('Consultor precisa estar vinculado a uma loja.');
      return;
    }
    try {
      await createUser.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        store_id: role === 'consultant' ? Number(storeId) : null,
      });
      setSuccess(`Usuário ${email.trim()} criado com sucesso.`);
      resetForm();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar usuário.');
    }
  }

  return (
    <section className="mt-8" aria-labelledby="users-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="users-heading" className="text-base font-semibold text-gray-800">
          Usuários
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            resetForm();
            setSuccess(null);
          }}
          className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          <span aria-hidden="true">+</span>
          Adicionar
        </button>
      </div>

      <div className="mb-4 h-px bg-gray-200" />

      {success && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {open && (
        <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Senha inicial</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Papel</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'consultant' | 'manager')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="consultant">Consultor (uma loja)</option>
              <option value="manager">Gerente (todas as lojas)</option>
            </select>
          </div>

          {role === 'consultant' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Loja</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">Selecione…</option>
                {stores?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={createUser.isPending}
            className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {createUser.isPending ? 'Criando…' : 'Criar usuário'}
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
          Erro ao carregar usuários.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-2">
          {(users ?? []).map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{u.name}</p>
                <p className="truncate text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-brand-red">
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {u.store_name && (
                  <span className="text-[10px] text-gray-400">{u.store_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
