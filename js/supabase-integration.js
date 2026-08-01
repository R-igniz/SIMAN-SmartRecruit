// ==========================================
// SUPABASE INTEGRATION
// ==========================================
// Configuración - REEMPLAZAR CON TUS DATOS
var SUPABASE_URL = 'https://tu-proyecto.supabase.co';
var SUPABASE_KEY = 'tu-api-key-public';

var supabaseInitialized = false;

function initSupabase() {
  if (supabaseInitialized) return;
  
  // Cargar script de Supabase
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = function() {
    const { createClient } = supabase;
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    supabaseInitialized = true;
    console.log('✅ Supabase inicializado');
  };
  document.head.appendChild(script);
}

// ==========================================
// FUNCIONES CRUD PARA SUPABASE
// ==========================================
async function guardarEnSupabase(tabla, datos) {
  if (!supabaseInitialized) await initSupabase();
  
  try {
    const { data, error } = await supabaseClient
      .from(tabla)
      .upsert(datos, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, data: data };
  } catch (error) {
    console.error('Error guardando en Supabase:', error);
    return { success: false, error: error };
  }
}

async function obtenerDeSupabase(tabla, filtros) {
  if (!supabaseInitialized) await initSupabase();
  
  try {
    let query = supabaseClient.from(tabla).select('*');
    if (filtros) {
      Object.keys(filtros).forEach(function(key) {
        query = query.eq(key, filtros[key]);
      });
    }
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data };
  } catch (error) {
    console.error('Error obteniendo de Supabase:', error);
    return { success: false, error: error };
  }
}

async function eliminarDeSupabase(tabla, id) {
  if (!supabaseInitialized) await initSupabase();
  
  try {
    const { data, error } = await supabaseClient
      .from(tabla)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true, data: data };
  } catch (error) {
    console.error('Error eliminando de Supabase:', error);
    return { success: false, error: error };
  }
}

// ==========================================
// SINCRONIZAR DATOS LOCALES CON SUPABASE
// ==========================================
async function sincronizarConSupabase() {
  var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
  
  // Sincronizar usuarios
  if (data.usuarios) {
    for (var i = 0; i < data.usuarios.length; i++) {
      await guardarEnSupabase('usuarios', data.usuarios[i]);
    }
  }
  
  // Sincronizar roles
  if (data.roles) {
    for (var i = 0; i < data.roles.length; i++) {
      await guardarEnSupabase('roles', data.roles[i]);
    }
  }
  
  // Sincronizar cartas oferta
  if (data.cartasOferta) {
    for (var i = 0; i < data.cartasOferta.length; i++) {
      await guardarEnSupabase('cartas_oferta', data.cartasOferta[i]);
    }
  }
  
  console.log('✅ Datos sincronizados con Supabase');
}

// ==========================================
// ESCUCHAR CAMBIOS EN TIEMPO REAL
// ==========================================
function escucharCambiosSupabase(tabla, callback) {
  if (!supabaseInitialized) {
    initSupabase();
    setTimeout(function() {
      escucharCambiosSupabase(tabla, callback);
    }, 1000);
    return;
  }
  
  supabaseClient
    .channel('tabla_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tabla
      },
      function(payload) {
        callback(payload);
      }
    )
    .subscribe();
}