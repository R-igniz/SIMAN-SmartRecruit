// ==========================================
// SINCRONIZAR DATOS LOCALES CON SUPABASE
// ==========================================
async function sincronizarConSupabase() {
    console.log('🔄 Iniciando sincronización con Supabase...');
    
    try {
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('danger', '❌ Sin conexión a Internet. No se puede sincronizar.', '#');
            }
            return { error: 'Sin conexión a Internet' };
        }
        
        await initSupabase();
        
        var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
        
        var resultados = {
            usuarios: 0,
            roles: 0,
            comerciales: 0,
            tiendas: 0,
            departamentos: 0,
            estados: 0,
            prioridades: 0,
            motivos: 0,
            tiposContratacion: 0,
            requisiciones: 0,
            errores: 0
        };
        
        // Función auxiliar para guardar con conteo
        async function guardarConteo(tabla, items, contador) {
            if (!items || items.length === 0) return;
            for (var i = 0; i < items.length; i++) {
                var result = await guardarEnSupabase(tabla, items[i]);
                if (result.success) {
                    resultados[contador]++;
                } else {
                    resultados.errores++;
                    console.warn('Error guardando en', tabla, ':', result.error);
                }
            }
        }
        
        // Guardar cada tabla
        await guardarConteo('usuarios', data.usuarios, 'usuarios');
        await guardarConteo('roles', data.roles, 'roles');
        await guardarConteo('comerciales', data.comerciales, 'comerciales');
        await guardarConteo('tiendas', data.tiendas, 'tiendas');
        await guardarConteo('departamentos', data.departamentos, 'departamentos');
        await guardarConteo('estados', data.estados, 'estados');
        await guardarConteo('prioridades', data.prioridades, 'prioridades');
        await guardarConteo('motivos', data.motivos, 'motivos');
        await guardarConteo('tiposContratacion', data.tiposContratacion, 'tiposContratacion');
        await guardarConteo('requisiciones', requisiciones, 'requisiciones');
        
        console.log('✅ Sincronización completada:', resultados);
        
        var mensaje = '✅ Datos sincronizados: ' +
            resultados.usuarios + ' usuarios, ' +
            resultados.roles + ' roles, ' +
            resultados.comerciales + ' comerciales, ' +
            resultados.tiendas + ' tiendas, ' +
            resultados.departamentos + ' departamentos, ' +
            resultados.estados + ' estados, ' +
            resultados.prioridades + ' prioridades, ' +
            resultados.motivos + ' motivos, ' +
            resultados.tiposContratacion + ' tipos de contratación, ' +
            resultados.requisiciones + ' requisiciones';
        
        if (resultados.errores > 0) {
            mensaje += ' ⚠️ ' + resultados.errores + ' errores (ver consola)';
        }
        
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion(resultados.errores > 0 ? 'warning' : 'success', mensaje, '#');
        }
        
        return resultados;
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('danger', '❌ Error al sincronizar: ' + error.message, '#');
        }
        return { error: error.message };
    }
}