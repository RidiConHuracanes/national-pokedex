// Sintetizador Web Audio API y Reproductor de Gritos Oficiales
class AudioPokedex {
  constructor() {
    this.contextoAudio = null;
    this.audioActual = null;
  }

  // Inicializar contexto de audio al interactuar
  inicializarContexto() {
    if (!this.contextoAudio) {
      const ContextoClase = window.AudioContext || window.webkitAudioContext;
      if (ContextoClase) {
        this.contextoAudio = new ContextoClase();
      }
    }
    if (this.contextoAudio && this.contextoAudio.state === 'suspended') {
      this.contextoAudio.resume();
    }
  }

  // Efecto de sonido futurista al hacer clic en botones
  reproducirSonidoClick() {
    try {
      this.inicializarContexto();
      if (!this.contextoAudio) return;

      const oscilador = this.contextoAudio.createOscillator();
      const ganancia = this.contextoAudio.createGain();

      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(800, this.contextoAudio.currentTime);
      oscilador.frequency.exponentialRampToValueAtTime(400, this.contextoAudio.currentTime + 0.05);

      ganancia.gain.setValueAtTime(0.15, this.contextoAudio.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.01, this.contextoAudio.currentTime + 0.05);

      oscilador.connect(ganancia);
      ganancia.connect(this.contextoAudio.destination);

      oscilador.start();
      oscilador.stop(this.contextoAudio.currentTime + 0.05);
    } catch (error) {
      console.warn('Error reproduciendo sonido de clic:', error);
    }
  }

  // Sonido especial al abrir el modal de detalles
  reproducirSonidoAbrir() {
    try {
      this.inicializarContexto();
      if (!this.contextoAudio) return;

      const oscilador = this.contextoAudio.createOscillator();
      const ganancia = this.contextoAudio.createGain();

      oscilador.type = 'triangle';
      oscilador.frequency.setValueAtTime(300, this.contextoAudio.currentTime);
      oscilador.frequency.exponentialRampToValueAtTime(900, this.contextoAudio.currentTime + 0.12);

      ganancia.gain.setValueAtTime(0.2, this.contextoAudio.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.01, this.contextoAudio.currentTime + 0.12);

      oscilador.connect(ganancia);
      ganancia.connect(this.contextoAudio.destination);

      oscilador.start();
      oscilador.stop(this.contextoAudio.currentTime + 0.12);
    } catch (error) {
      console.warn('Error reproduciendo sonido de apertura:', error);
    }
  }

  // Reproducir grito oficial del Pokémon en formato OGG
  reproducirGrito(idPokemon) {
    if (this.audioActual) {
      this.audioActual.pause();
      this.audioActual = null;
    }

    const urlGrito = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${idPokemon}.ogg`;
    const reproductor = new Audio(urlGrito);
    reproductor.volume = 0.6;
    
    this.audioActual = reproductor;
    reproductor.play().catch(error => {
      console.warn('Intentando grito clásico alternativo...', error);
      const urlAlternativa = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${idPokemon}.ogg`;
      const reproductorAlternativo = new Audio(urlAlternativa);
      reproductorAlternativo.volume = 0.6;
      reproductorAlternativo.play().catch(e => console.error('No se pudo reproducir el grito:', e));
    });
  }

  // Reproducir la voz auténtica del anime de Pikachu ("Pika-Pikachu!" interpretada por Ikue Ōtani)
  reproducirVozAnimePikachu() {
    if (this.audioActual) {
      this.audioActual.pause();
      this.audioActual = null;
    }

    // Audio oficial de Ikue Ōtani de Pokémon Showdown (Gen 6-8)
    const urlVozAnime = 'https://play.pokemonshowdown.com/audio/cries/pikachu.ogg';
    const reproductor = new Audio(urlVozAnime);
    reproductor.volume = 0.75;

    this.audioActual = reproductor;
    reproductor.play().catch(e => console.error('Error al reproducir voz de Pikachu anime:', e));
  }
}

window.audioPokedex = new AudioPokedex();
