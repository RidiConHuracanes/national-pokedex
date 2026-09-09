/**
 * Motor Principal de la Pokédex Nacional
 * Desarrollado con JavaScript ES6+ y PokéAPI v2
 */

// Rangos de ID por Generación
const RANGOS_GENERACIONES = {
  '1': { inicio: 1, fin: 151 },
  '2': { inicio: 152, fin: 251 },
  '3': { inicio: 252, fin: 386 },
  '4': { inicio: 387, fin: 493 },
  '5': { inicio: 494, fin: 649 },
  '6': { inicio: 650, fin: 721 },
  '7': { inicio: 722, fin: 809 },
  '8': { inicio: 810, fin: 905 },
  '9': { inicio: 906, fin: 1025 }
};

// Traducción de Tipos de Pokémon al Español
const TRADUCCION_TIPOS = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada'
};

// Estado Global de la Aplicación
const estado = {
  listaTodosPokemon: [],
  listaFiltrada: [],
  cachePokemon: new Map(),
  cacheEspecies: new Map(),
  
  busquedaTexto: '',
  generacionSeleccionada: 'todas',
  tipoSeleccionado: 'todos',
  ordenSeleccionado: 'id-asc',

  indiceRenderizado: 0,
  tamanoLote: 24,
  estaCargando: false,

  idPokemonModalActual: null,
  esVariocolor: false
};

// Elementos de la Interfaz (DOM)
const ELEMENTOS = {
  rejilla: document.getElementById('rejilla-pokedex'),
  campoBusqueda: document.getElementById('campo-busqueda'),
  botonLimpiarBusqueda: document.getElementById('boton-limpiar-busqueda'),
  filtroGeneracion: document.getElementById('filtro-generacion'),
  filtroTipo: document.getElementById('filtro-tipo'),
  selectorOrden: document.getElementById('selector-orden'),
  contadorCargados: document.getElementById('contador-cargados'),

  // Elementos del Modal
  modal: document.getElementById('modal-detalle'),
  botonCerrarModal: document.getElementById('boton-cerrar-modal'),
  modalImagen: document.getElementById('modal-imagen'),
  modalNumeroId: document.getElementById('modal-numero-id'),
  modalNombrePokemon: document.getElementById('modal-nombre-pokemon'),
  modalCategoria: document.getElementById('modal-categoria'),
  modalTiposContenedor: document.getElementById('modal-tipos-contenedor'),
  modalDescripcionTexto: document.getElementById('modal-descripcion-texto'),
  modalAltura: document.getElementById('modal-altura'),
  modalPeso: document.getElementById('modal-peso'),
  modalHabilidades: document.getElementById('modal-habilidades'),
  modalGruposHuevo: document.getElementById('modal-grupos-huevo'),
  botonShiny: document.getElementById('boton-shiny'),
  botonGrito: document.getElementById('boton-grito'),
  botonVozAnime: document.getElementById('boton-voz-anime'),

  // Pestañas del Modal
  botonesPestanas: document.querySelectorAll('.tab-btn'),
  contenidosPestanas: document.querySelectorAll('.tab-content'),
  contenedorEstadisticas: document.getElementById('contenedor-estadisticas'),
  cadenaEvolutiva: document.getElementById('cadena-evolutiva'),
  contenedorMovimientos: document.getElementById('contenedor-movimientos')
};

// Inicialización de la Aplicación
async function inicializarAplicacion() {
  renderizarEsqueletosCarga();
  configurarEventos();

  try {
    const respuesta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
    const datos = await respuesta.json();

    estado.listaTodosPokemon = datos.results.map((item, indice) => {
      const id = indice + 1;
      return {
        id: id,
        nombre: item.name,
        url: item.url,
        idFormateado: String(id).padStart(4, '0')
      };
    });

    aplicarFiltrosYOrden();
  } catch (error) {
    console.error('Error al inicializar la Pokédex:', error);
    ELEMENTOS.rejilla.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent-red); padding: 3rem;">
      <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 1rem;"></i>
      <h3>Error de conexión con PokéAPI</h3>
      <p>Verifica tu conexión a internet e intenta recargar la página.</p>
    </div>`;
  }
}

// Renderizar tarjetas de carga preliminar (Skeletons)
function renderizarEsqueletosCarga() {
  let htmlEsqueletos = '';
  for (let i = 0; i < 16; i++) {
    htmlEsqueletos += `
      <div class="skeleton-card">
        <div class="skeleton-pulse skeleton-circle"></div>
        <div class="skeleton-pulse skeleton-title"></div>
        <div class="skeleton-pulse skeleton-subtitle"></div>
      </div>
    `;
  }
  ELEMENTOS.rejilla.innerHTML = htmlEsqueletos;
}

// Aplicar Filtros y Ordenamiento
function aplicarFiltrosYOrden() {
  let lista = [...estado.listaTodosPokemon];

  if (estado.generacionSeleccionada !== 'todas') {
    const rango = RANGOS_GENERACIONES[estado.generacionSeleccionada];
    if (rango) {
      lista = lista.filter(p => p.id >= rango.inicio && p.id <= rango.fin);
    }
  }

  if (estado.busquedaTexto.trim() !== '') {
    const consulta = estado.busquedaTexto.toLowerCase().trim();
    lista = lista.filter(p => p.nombre.includes(consulta) || String(p.id) === consulta || p.idFormateado.includes(consulta));
  }

  if (estado.tipoSeleccionado !== 'todos') {
    lista = lista.filter(p => {
      const enCache = estado.cachePokemon.get(p.id);
      if (enCache) {
        return enCache.tipos.some(t => t.type.name === estado.tipoSeleccionado);
      }
      return true;
    });
  }

  lista.sort((a, b) => {
    switch (estado.ordenSeleccionado) {
      case 'id-asc':
        return a.id - b.id;
      case 'id-desc':
        return b.id - a.id;
      case 'nombre-asc':
        return a.nombre.localeCompare(b.nombre);
      case 'nombre-desc':
        return b.nombre.localeCompare(a.nombre);
      case 'stat-desc':
        const statA = estado.cachePokemon.get(a.id)?.totalEstadisticas || 0;
        const statB = estado.cachePokemon.get(b.id)?.totalEstadisticas || 0;
        return statB - statA;
      default:
        return a.id - b.id;
    }
  });

  estado.listaFiltrada = lista;
  estado.indiceRenderizado = 0;
  ELEMENTOS.rejilla.innerHTML = '';
  ELEMENTOS.contadorCargados.textContent = lista.length;

  if (lista.length === 0) {
    ELEMENTOS.rejilla.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem;">
      <i class="fa-solid fa-ghost" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
      <h3>No se encontraron Pokémon</h3>
      <p>Intenta ajustar los términos de búsqueda o los filtros seleccionados.</p>
    </div>`;
    return;
  }

  renderizarSiguienteLote();
}

// Renderizado por lotes
async function renderizarSiguienteLote() {
  if (estado.estaCargando) return;
  estado.estaCargando = true;

  const siguienteLote = estado.listaFiltrada.slice(estado.indiceRenderizado, estado.indiceRenderizado + estado.tamanoLote);
  if (siguienteLote.length === 0) {
    estado.estaCargando = false;
    return;
  }

  const promesasLote = siguienteLote.map(item => obtenerDetallePokemon(item.id));
  const pokemonesDetallados = await Promise.all(promesasLote);

  const fragmento = document.createDocumentFragment();

  pokemonesDetallados.forEach(pokemon => {
    if (!pokemon) return;
    const elementoTarjeta = crearElementoTarjetaPokemon(pokemon);
    fragmento.appendChild(elementoTarjeta);
  });

  ELEMENTOS.rejilla.appendChild(fragmento);
  estado.indiceRenderizado += siguienteLote.length;
  estado.estaCargando = false;
}

// Obtener datos detallados de un Pokémon con Memoria Caché
async function obtenerDetallePokemon(id) {
  if (estado.cachePokemon.has(id)) {
    return estado.cachePokemon.get(id);
  }

  try {
    const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const datos = await respuesta.json();

    const tipoPrimario = datos.types[0].type.name;
    const totalEstadisticas = datos.stats.reduce((acumulado, actual) => acumulado + actual.base_stat, 0);

    const datosFormateados = {
      id: datos.id,
      nombre: datos.name,
      idEtiqueta: `#${String(datos.id).padStart(4, '0')}`,
      alturaMetros: (datos.height / 10).toFixed(1),
      pesoKilos: (datos.weight / 10).toFixed(1),
      tipos: datos.types,
      tipoPrimario: tipoPrimario,
      estadisticas: datos.stats,
      totalEstadisticas: totalEstadisticas,
      habilidades: datos.abilities,
      movimientos: datos.moves,
      imagenOficial: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${datos.id}.png`,
      imagenVariocolor: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${datos.id}.png`,
      urlEspecie: datos.species.url
    };

    estado.cachePokemon.set(id, datosFormateados);
    return datosFormateados;
  } catch (error) {
    console.warn(`Error obteniendo detalles del Pokémon #${id}:`, error);
    return null;
  }
}

// Crear Elemento HTML para cada Tarjeta de Pokémon
function crearElementoTarjetaPokemon(pokemon) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'pokemon-card';
  tarjeta.setAttribute('data-id', pokemon.id);

  tarjeta.style.setProperty('--card-glow', `var(--type-${pokemon.tipoPrimario})`);
  tarjeta.style.setProperty('--card-border', `var(--type-${pokemon.tipoPrimario})`);

  const htmlTipos = pokemon.tipos.map(t => {
    const nombreTipo = t.type.name;
    const tipoEspanol = TRADUCCION_TIPOS[nombreTipo] || nombreTipo;
    return `<span class="type-badge" style="background-color: var(--type-${nombreTipo});">${tipoEspanol}</span>`;
  }).join('');

  tarjeta.innerHTML = `
    <span class="card-number">${pokemon.idEtiqueta}</span>
    <div class="card-img-wrapper">
      <img src="${pokemon.imagenOficial}" alt="${pokemon.nombre}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'">
    </div>
    <h3 class="card-name">${pokemon.nombre}</h3>
    <div class="types-container">
      ${htmlTipos}
    </div>
  `;

  tarjeta.addEventListener('click', () => {
    if (window.audioPokedex) window.audioPokedex.reproducirSonidoAbrir();
    abrirModalDetalle(pokemon.id);
  });

  return tarjeta;
}

// Obtener datos de la Especie (Descripciones en Español y Cadena de Evolución)
async function obtenerInformacionEspecie(id, urlEspecie) {
  if (estado.cacheEspecies.has(id)) {
    return estado.cacheEspecies.get(id);
  }

  try {
    const respuesta = await fetch(urlEspecie);
    const datos = await respuesta.json();

    let descripcion = 'Sin descripción disponible en español.';
    const entradaEspanol = datos.flavor_text_entries.find(e => e.language.name === 'es');
    if (entradaEspanol) {
      descripcion = entradaEspanol.flavor_text.replace(/[\n\f\r]/g, ' ');
    } else {
      const entradaIngles = datos.flavor_text_entries.find(e => e.language.name === 'en');
      if (entradaIngles) descripcion = entradaIngles.flavor_text.replace(/[\n\f\r]/g, ' ');
    }

    let categoria = 'Pokémon';
    const generoEspanol = datos.genera.find(g => g.language.name === 'es');
    if (generoEspanol) categoria = generoEspanol.genus;

    let nombreEspanol = null;
    const nombreEs = datos.names.find(n => n.language.name === 'es');
    if (nombreEs) nombreEspanol = nombreEs.name;

    const infoEspecie = {
      descripcion: descripcion,
      categoria: categoria,
      nombreEspanol: nombreEspanol,
      gruposHuevo: datos.egg_groups.map(g => g.name).join(', '),
      urlCadenaEvolutiva: datos.evolution_chain?.url
    };

    estado.cacheEspecies.set(id, infoEspecie);
    return infoEspecie;
  } catch (error) {
    console.warn(`Error al cargar datos de especie #${id}:`, error);
    return { descripcion: 'Información Pokédex.', categoria: 'Pokémon', gruposHuevo: 'Desconocido' };
  }
}

// Abrir Modal de Detalles del Pokémon
async function abrirModalDetalle(id) {
  const pokemon = await obtenerDetallePokemon(id);
  if (!pokemon) return;

  estado.idPokemonModalActual = id;
  estado.esVariocolor = false;

  ELEMENTOS.botonShiny.classList.remove('active');

  // Si el Pokémon es Pikachu (#25), mostrar el botón especial de Voz Anime
  if (id === 25) {
    ELEMENTOS.botonVozAnime.style.display = 'inline-flex';
  } else {
    ELEMENTOS.botonVozAnime.style.display = 'none';
  }

  ELEMENTOS.modalNumeroId.textContent = pokemon.idEtiqueta;
  ELEMENTOS.modalNombrePokemon.textContent = pokemon.nombre;
  ELEMENTOS.modalImagen.src = pokemon.imagenOficial;

  ELEMENTOS.modalTiposContenedor.innerHTML = pokemon.tipos.map(t => {
    const nombreTipo = t.type.name;
    const tipoEspanol = TRADUCCION_TIPOS[nombreTipo] || nombreTipo;
    return `<span class="type-badge" style="background-color: var(--type-${nombreTipo});">${tipoEspanol}</span>`;
  }).join('');

  ELEMENTOS.modal.style.setProperty('--modal-theme-border', `var(--type-${pokemon.tipoPrimario})`);
  ELEMENTOS.modal.style.setProperty('--modal-theme-glow', `var(--type-${pokemon.tipoPrimario})`);

  ELEMENTOS.modalAltura.textContent = `${pokemon.alturaMetros} m`;
  ELEMENTOS.modalPeso.textContent = `${pokemon.pesoKilos} kg`;
  ELEMENTOS.modalHabilidades.textContent = pokemon.habilidades.map(a => a.ability.name.replace('-', ' ')).join(', ');

  renderizarEstadisticas(pokemon.estadisticas);
  renderizarMovimientos(pokemon.movimientos);

  const especie = await obtenerInformacionEspecie(id, pokemon.urlEspecie);
  ELEMENTOS.modalDescripcionTexto.textContent = especie.descripcion;
  ELEMENTOS.modalCategoria.textContent = especie.nombreEspanol ? `${especie.nombreEspanol} (${especie.categoria})` : especie.categoria;
  ELEMENTOS.modalGruposHuevo.textContent = especie.gruposHuevo;

  if (especie.urlCadenaEvolutiva) {
    renderizarCadenaEvolutiva(especie.urlCadenaEvolutiva);
  } else {
    ELEMENTOS.cadenaEvolutiva.innerHTML = '<p style="color: var(--text-muted);">No tiene evoluciones registradas.</p>';
  }

  ELEMENTOS.modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Renderizar Barras de Estadísticas Base
function renderizarEstadisticas(estadisticas) {
  const mapaNombresEstadisticas = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'At. Esp.',
    'special-defense': 'Def. Esp.',
    'speed': 'Velocidad'
  };

  const mapaColoresEstadisticas = {
    'hp': '#4ade80',
    'attack': '#f87171',
    'defense': '#fb923c',
    'special-attack': '#60a5fa',
    'special-defense': '#a78bfa',
    'speed': '#f472b6'
  };

  ELEMENTOS.contenedorEstadisticas.innerHTML = estadisticas.map(s => {
    const nombre = mapaNombresEstadisticas[s.stat.name] || s.stat.name;
    const valor = s.base_stat;
    const porcentaje = Math.min(100, Math.round((valor / 255) * 100));
    const color = mapaColoresEstadisticas[s.stat.name] || '#3b82f6';

    return `
      <div class="stat-row">
        <div class="stat-name">${nombre}</div>
        <div class="stat-value">${valor}</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${porcentaje}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar Movimientos Destacados
function renderizarMovimientos(movimientos) {
  const primerosMovimientos = movimientos.slice(0, 30);
  ELEMENTOS.contenedorMovimientos.innerHTML = primerosMovimientos.map(m => `
    <span style="background: rgba(255,255,255,0.06); border: 1px solid var(--border-glass); padding: 0.3rem 0.7rem; border-radius: 8px; font-size: 0.8rem; text-transform: capitalize;">
      ${m.move.name.replace('-', ' ')}
    </span>
  `).join('');
}

// Renderizar Cadena Evolutiva Visual
async function renderizarCadenaEvolutiva(urlCadena) {
  ELEMENTOS.cadenaEvolutiva.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Cargando evoluciones...</p>';
  try {
    const respuesta = await fetch(urlCadena);
    const datos = await respuesta.json();

    const etapasEvolutivas = [];
    let actual = datos.chain;

    while (actual) {
      const nombreEspecie = actual.species.name;
      const idPokemon = parseInt(actual.species.url.split('/').filter(Boolean).pop());

      etapasEvolutivas.push({
        id: idPokemon,
        nombre: nombreEspecie,
        nivelMinimo: actual.evolution_details[0]?.min_level || null,
        objeto: actual.evolution_details[0]?.item?.name || null
      });

      actual = actual.evolves_to[0];
    }

    if (etapasEvolutivas.length <= 1) {
      ELEMENTOS.cadenaEvolutiva.innerHTML = '<p style="color: var(--text-muted);">Este Pokémon no posee formas evolutivas.</p>';
      return;
    }

    let htmlEvolucion = '';
    etapasEvolutivas.forEach((etapa, indice) => {
      const imagenOficial = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${etapa.id}.png`;
      htmlEvolucion += `
        <div class="evo-stage" onclick="abrirModalDetalle(${etapa.id})">
          <div class="evo-img-wrapper">
            <img src="${imagenOficial}" alt="${etapa.nombre}">
          </div>
          <div class="evo-name">${etapa.nombre}</div>
        </div>
      `;

      if (indice < etapasEvolutivas.length - 1) {
        const siguienteEtapa = etapasEvolutivas[indice + 1];
        let textoRequisito = 'Evolución';
        if (siguienteEtapa.nivelMinimo) textoRequisito = `Nv. ${siguienteEtapa.nivelMinimo}`;
        else if (siguienteEtapa.objeto) textoRequisito = siguienteEtapa.objeto.replace('-', ' ');

        htmlEvolucion += `
          <div class="evo-arrow">
            <i class="fa-solid fa-arrow-right"></i>
            <span>${textoRequisito}</span>
          </div>
        `;
      }
    });

    ELEMENTOS.cadenaEvolutiva.innerHTML = htmlEvolucion;
  } catch (error) {
    console.warn('Error al cargar la cadena evolutiva:', error);
    ELEMENTOS.cadenaEvolutiva.innerHTML = '<p style="color: var(--text-muted);">No fue posible cargar las evoluciones.</p>';
  }
}

// Configuración de Eventos de la Interfaz
function configurarEventos() {
  ELEMENTOS.campoBusqueda.addEventListener('input', (e) => {
    estado.busquedaTexto = e.target.value;
    ELEMENTOS.botonLimpiarBusqueda.style.display = estado.busquedaTexto ? 'block' : 'none';
    aplicarFiltrosYOrden();
  });

  ELEMENTOS.botonLimpiarBusqueda.addEventListener('click', () => {
    ELEMENTOS.campoBusqueda.value = '';
    estado.busquedaTexto = '';
    ELEMENTOS.botonLimpiarBusqueda.style.display = 'none';
    aplicarFiltrosYOrden();
  });

  ELEMENTOS.filtroGeneracion.addEventListener('change', (e) => {
    if (window.audioPokedex) window.audioPokedex.reproducirSonidoClick();
    estado.generacionSeleccionada = e.target.value;
    aplicarFiltrosYOrden();
  });

  ELEMENTOS.filtroTipo.addEventListener('change', (e) => {
    if (window.audioPokedex) window.audioPokedex.reproducirSonidoClick();
    estado.tipoSeleccionado = e.target.value;
    aplicarFiltrosYOrden();
  });

  ELEMENTOS.selectorOrden.addEventListener('change', (e) => {
    if (window.audioPokedex) window.audioPokedex.reproducirSonidoClick();
    estado.ordenSeleccionado = e.target.value;
    aplicarFiltrosYOrden();
  });

  window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 600) {
      renderizarSiguienteLote();
    }
  });

  ELEMENTOS.botonCerrarModal.addEventListener('click', () => {
    ELEMENTOS.modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  ELEMENTOS.modal.addEventListener('click', (e) => {
    if (e.target === ELEMENTOS.modal) {
      ELEMENTOS.modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ELEMENTOS.modal.classList.contains('active')) {
      ELEMENTOS.modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });

  ELEMENTOS.botonShiny.addEventListener('click', () => {
    if (!estado.idPokemonModalActual) return;
    if (window.audioPokedex) window.audioPokedex.reproducirSonidoClick();
    const pokemon = estado.cachePokemon.get(estado.idPokemonModalActual);
    if (!pokemon) return;

    estado.esVariocolor = !estado.esVariocolor;
    if (estado.esVariocolor) {
      ELEMENTOS.modalImagen.src = pokemon.imagenVariocolor;
      ELEMENTOS.botonShiny.classList.add('active');
    } else {
      ELEMENTOS.modalImagen.src = pokemon.imagenOficial;
      ELEMENTOS.botonShiny.classList.remove('active');
    }
  });

  // Botón de Grito Clásico
  ELEMENTOS.botonGrito.addEventListener('click', () => {
    if (estado.idPokemonModalActual && window.audioPokedex) {
      window.audioPokedex.reproducirGrito(estado.idPokemonModalActual);
    }
  });

  // Botón de Voz Anime para Pikachu (#25)
  ELEMENTOS.botonVozAnime.addEventListener('click', () => {
    if (window.audioPokedex) {
      window.audioPokedex.reproducirVozAnimePikachu();
    }
  });

  ELEMENTOS.botonesPestanas.forEach(boton => {
    boton.addEventListener('click', () => {
      if (window.audioPokedex) window.audioPokedex.reproducirSonidoClick();
      const pestanaDestino = boton.getAttribute('data-tab');

      ELEMENTOS.botonesPestanas.forEach(b => b.classList.remove('active'));
      ELEMENTOS.contenidosPestanas.forEach(c => c.classList.remove('active'));

      boton.classList.add('active');
      document.getElementById(pestanaDestino).classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', inicializarAplicacion);
