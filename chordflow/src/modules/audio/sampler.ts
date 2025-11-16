// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: Rhodes Sampler (Tone.Sampler)
// --------------------------------------------------
// Carga un conjunto de multisamples de un piano eléctrico tipo Rhodes.
// Este sampler es utilizado por el módulo fxChain, que aplica la
// cadena de efectos completa para generar el instrumento principal
// de la plataforma.
// --------------------------------------------------

import * as Tone from "tone";

/**
 * Inicializa y carga un Tone.Sampler basado en muestras reales de Rhodes.
 * El instrumento se construye a partir de varias notas base, permitiendo
 * interpolación tonal interna de Tone.js para cubrir el resto del teclado.
 */
export async function createRhodesSampler(): Promise<Tone.Sampler> {
  const sampler = new Tone.Sampler({
    urls: {
      C3: "C3.mp3",
      F3: "F3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      F4: "F4.mp3",
    },

    // Las muestras deben ubicarse en public/samples/rhodes/
    baseUrl: "/samples/rhodes/",

    // Release natural del instrumento
    release: 1.2,

    // Nivel general del sampler
    volume: 2,
  });

  // Espera a que todas las muestras se encuentren cargadas
  await Tone.loaded();

  return sampler;
}
