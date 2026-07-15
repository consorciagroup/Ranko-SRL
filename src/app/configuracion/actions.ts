"use server";

// Placeholder: no hay Supabase Auth ni tabla de usuarios todavía (ver
// comentario de RLS en supabase/migrations/20260702000001_modelo_inicial.sql,
// que deja la introducción de auth para una futura "Etapa 2"). Estas acciones
// no tocan la base de datos: solo simulan latencia de red para que los
// botones de guardado (useFormStatus) muestren su estado pending real. Al
// llegar la Etapa 2, reemplazar el cuerpo de cada función por la llamada
// real a Supabase Auth — la UI no necesita cambios.

async function simularLatencia() {
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export async function actualizarPerfil() {
  await simularLatencia();
  // TODO(Etapa 2): update en tabla de perfiles / supabase.auth.updateUser({ data: { nombre } })
}

export async function cambiarEmail() {
  await simularLatencia();
  // TODO(Etapa 2): supabase.auth.updateUser({ email })
}

export async function cambiarPassword() {
  await simularLatencia();
  // TODO(Etapa 2): supabase.auth.updateUser({ password })
}

export async function actualizarNotificaciones() {
  await simularLatencia();
  // TODO(Etapa 2): persistir en una tabla propia de preferencias (no depende de Auth)
}

export async function cerrarSesion() {
  await simularLatencia();
  // TODO(Etapa 2): supabase.auth.signOut() + redirect("/login")
}

export async function eliminarCuenta() {
  await simularLatencia();
  // TODO(Etapa 2): supabase.auth.admin.deleteUser(id) + redirect("/login")
}
