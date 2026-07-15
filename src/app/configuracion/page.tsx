import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Avatar } from "@/components/ui/Avatar";
import {
  actualizarPerfil,
  cambiarEmail,
  cambiarPassword,
  actualizarNotificaciones,
  cerrarSesion,
  eliminarCuenta,
} from "./actions";

// Placeholder: sin Supabase Auth todavía, no hay usuario real que leer.
// Reemplazar por el usuario autenticado (Etapa 2).
const USUARIO_EJEMPLO = {
  nombre: "Facundo Ponce",
  email: "faponce@itba.edu.ar",
};

const inputClass = "w-full rounded-md border border-hairline bg-surface px-3 py-2";

export default function ConfiguracionPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Configuración">
        Datos de tu cuenta, seguridad y preferencias del panel.
      </PageHeader>

      <div className="flex flex-col gap-6">
        <SettingsSection title="Perfil" description="Tu nombre visible dentro del panel.">
          <form action={actualizarPerfil} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar nombre={USUARIO_EJEMPLO.nombre} size={48} />
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-medium">Nombre</span>
                <input name="nombre" required defaultValue={USUARIO_EJEMPLO.nombre} className={inputClass} />
              </label>
            </div>
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection title="Email" description="Usado para acceder al panel y recibir avisos.">
          <form action={cambiarEmail} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="email"
                required
                defaultValue={USUARIO_EJEMPLO.email}
                className={inputClass}
              />
            </label>
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection title="Contraseña" description="Elegí una contraseña que no uses en otro lado.">
          <form action={cambiarPassword} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Contraseña actual</span>
              <input type="password" name="passwordActual" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Contraseña nueva</span>
              <input type="password" name="passwordNueva" required className={inputClass} />
            </label>
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Notificaciones"
          description="Qué avisos querés recibir sobre la actividad del panel."
        >
          <form action={actualizarNotificaciones} className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="avisoTrabajoNuevo" defaultChecked />
              <span>Avisarme cuando se asigna un trabajo nuevo</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="avisoSinAcceso" defaultChecked />
              <span>Avisarme ante un &quot;sin acceso&quot; en una visita</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="resumenSemanal" />
              <span>Resumen semanal de reportes por email</span>
            </label>
            <div className="flex justify-end">
              <SubmitButton pendingText="Guardando…">Guardar preferencias</SubmitButton>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection title="Sesión" description="Cerrá tu sesión en este dispositivo.">
          <form action={cerrarSesion} className="flex justify-end">
            <SubmitButton variant="secondary" pendingText="Cerrando sesión…">
              Cerrar sesión
            </SubmitButton>
          </form>
        </SettingsSection>

        <section className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-[inset_0_0_0_1px_var(--color-ranko)]">
          <div>
            <h2 className="font-display text-lg font-bold text-ranko">Eliminar cuenta</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Esta acción es permanente: perdés el acceso al panel y no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end">
            <ConfirmDeleteButton
              action={eliminarCuenta}
              id="self"
              trigger="Eliminar mi cuenta"
              titulo="¿Eliminar tu cuenta?"
              mensaje="Perdés el acceso al panel de forma permanente. Esta acción no se puede deshacer."
              confirmLabel="Eliminar cuenta"
              pendingLabel="Eliminando…"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
