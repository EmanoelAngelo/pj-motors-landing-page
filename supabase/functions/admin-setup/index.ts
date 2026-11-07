
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configure apenas no ambiente da função; nunca versione credenciais.
const ADMIN_EMAIL = Deno.env.get("PJ_ADMIN_EMAIL");
const ADMIN_PASSWORD = Deno.env.get("PJ_ADMIN_PASSWORD");

Deno.serve(async (req: Request) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Provisionamento não configurado" }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });
  }
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Tenta criar o usuario admin (ignora erro se ja existe)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some((u: any) => u.email === ADMIN_EMAIL);

    if (!adminExists) {
      await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
});
