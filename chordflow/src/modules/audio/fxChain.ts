// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: createEPInstrument (Rhodes + cadena de efectos)
// --------------------------------------------------
// Inicializa un instrumento eléctrico tipo Rhodes basado en un Sampler,
// aplicando una cadena de procesamiento orientada a lograr un timbre
// suave, cálido y apto para prácticas educativas de armonía.
//
// La cadena de procesamiento incluye:
// - EQ con recorte leve de graves y agudos.
// - Compresión suave para estabilizar dinámica.
// - Chorus y Tremolo sutiles para dar movimiento.
// - Reverb de habitación corta.
// - Limitador final para evitar clipping.
// - Control general de volumen.
//
// El sampler original se carga desde createRhodesSampler().
// --------------------------------------------------

import * as Tone from "tone";
import { createRhodesSampler } from "./sampler";

export async function createEPInstrument(): Promise<Tone.Sampler> {
  // Carga del sampler principal (instrumento Rhodes)
  const sampler = await createRhodesSampler();

  // ----------------------------
  // Procesadores de la cadena FX
  // ----------------------------

  // Limitador final para prevenir picos digitales
  const limiter = new Tone.Limiter(-1).toDestination();

  // Compresión moderada para suavizar dinámica
  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 2.5,
    attack: 0.01,
    release: 0.25,
  });

  // EQ de tres bandas
  const eq = new Tone.EQ3({
    low: -2,
    mid: 0,
    high: -2,
  });

  // Reverb corta tipo "room"
  const reverb = new Tone.Reverb({
    decay: 1.6,
    preDelay: 0.01,
    wet: 0.18,
  });

  // Chorus suave para ensanchar el campo estéreo
  const chorus = new Tone.Chorus({
    frequency: 1.2,
    depth: 0.3,
    delayTime: 2.5,
    spread: 120,
    wet: 0.15,
  }).start();

  // Tremolo lento y moderado
  const tremolo = new Tone.Tremolo({
    frequency: 5,
    depth: 0.25,
    spread: 180,
    wet: 0.15,
  }).start();

  // Ajuste general de volumen del instrumento
  const volume = new Tone.Volume(-6);

  // --------------------------------------------------
  // Cadena completa:
  // sampler → volume → tremolo → chorus → EQ →
  // compressor → reverb → limiter → salida
  // --------------------------------------------------
  sampler.chain(volume, tremolo, chorus, eq, compressor, reverb, limiter);

  return sampler;
}
