// Edge Function: admin-create-user
// Cria um usuário (consultor/gerente) — somente Admin pode chamar.
// A service_role nunca sai do servidor; o frontend chama com o JWT do admin.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // Identifica quem está chamando
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: uerr,
    } = await userClient.auth.getUser();
    if (uerr || !user) return json({ error: 'Não autenticado.' }, 401);

    // Só admin pode criar usuários
    const { data: profile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return json({ error: 'Apenas administradores podem criar usuários.' }, 403);
    }

    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    const role = String(body.role ?? '');
    const storeId = body.store_id ? String(body.store_id) : '';

    if (!email || !password || !name || !role) {
      return json({ error: 'Preencha e-mail, nome, senha e papel.' }, 400);
    }
    if (password.length < 6) {
      return json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, 400);
    }
    if (!['consultant', 'manager'].includes(role)) {
      return json({ error: 'Papel inválido.' }, 400);
    }
    if (role === 'consultant' && !storeId) {
      return json({ error: 'Consultor precisa estar vinculado a uma loja.' }, 400);
    }

    const admin = createClient(url, service);
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, store_id: role === 'consultant' ? storeId : '' },
    });
    if (error) return json({ error: error.message }, 400);

    return json({ id: data.user?.id, email: data.user?.email }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
