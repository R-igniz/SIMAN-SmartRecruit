# SIMAN SmartRecruit — Fase 4.4 RBAC dinámico

## Instalación
1. Respaldar Supabase y el despliegue actual.
2. Ejecutar `sql/fase4.4-rbac.sql` una vez en SQL Editor, usando un rol propietario. Verificar que no hay errores.
3. Desplegar **todos** los archivos del ZIP, manteniendo la carpeta `js/`.
4. Cerrar sesión, iniciar sesión como Administrador y visitar `/roles.html`.
5. Crear un rol, marcar permisos y guardar. En Usuarios, el selector obtiene los roles desde Supabase.
6. Verificar acceso denegado para roles sin permisos y que Administrador no pueda editarse/desactivarse desde esta pantalla.

## IMPORTANTE: seguridad y asignación de roles
- La autorización del frontend falla cerrada si no se puede cargar la RPC; si se omite el SQL, no habrá acceso.
- Las RPC de administración validan en el servidor que el usuario sea Administrador.
- **La Edge Function `admin-users` existente debe adaptarse para aceptar códigos nuevos**, consultar `rbac_roles` y comprobar permisos mediante `rbac_tiene_permiso`, además de impedir cambios al último Administrador. El frontend ya envía `role_code` dinámico; sin actualizar la función, la asignación de roles personalizados puede ser rechazada. No se incluye código de la función porque no estaba en el ZIP recibido.
- **Las políticas RLS de las tablas de negocio deben auditarse y adaptarse** a `rbac_tiene_permiso(...)` para que el control por acción también se aplique a operaciones directas en Supabase. El RBAC del navegador por sí solo no protege los datos.
- La tabla `profiles.role_code` debe aceptar nuevos códigos. Si tiene CHECK/ENUM de solo cuatro roles, actualizar esa restricción después de revisar el esquema real.
- Las funciones `SECURITY DEFINER` deben ser creadas por el propietario confiable de la BD; revisar privilegios de ejecución y políticas antes de producción.
- Los cuatro roles anteriores se siembran sin eliminar sus asignaciones. Administrador es ineditable y no se desactiva en esta UI.

## Pruebas
1. Admin accede a `/roles.html`, Gerente RH/Reclutadora/Ejecutivo no.
2. Crear rol con solo `ver_dashboard` y comprobar acceso a otras rutas denegado.
3. Modificar permisos, cerrar sesión y volver a entrar; verificar aplicación de cambios.
4. Intentar invocar `rbac_guardar_rol` con usuario no administrador; debe fallar.
5. Validar que `admin-users` y RLS rechacen acciones no autorizadas antes de dar por aprobada producción.
