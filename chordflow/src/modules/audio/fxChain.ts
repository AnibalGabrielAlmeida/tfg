// --------------------------------------------------
// 🎛 ChordFlow — Instrumento + cadena de FX (Rhodes)
// --------------------------------------------------
// Sampler Rhodes real + EQ sutil, Comp suave, Chorus leve,
// Tremolo 4–6 Hz y Reverb corta tipo habitación.
// --------------------------------------------------

import * as Tone from "tone";
import { createRhodesSampler } from "./sampler";

export async function createEPInstrument(): Promise<Tone.Sampler> {
  // 🔹 Cargar sampler de Rhodes
  const sampler = await createRhodesSampler();

  // 🔹 FX: EQ, Comp, Chorus, Tremolo, Reverb, Limiter, Volume
  const limiter = new Tone.Limiter(-1).toDestination();

  const compressor = new Tone.Compressor({
    threshold: -20, // compresión suave
    ratio: 2.5,
    attack: 0.01,
    release: 0.25,
  });

  // EQ3: low / mid / high (dB)
  const eq = new Tone.EQ3({
    low: -2,    // recorte leve de graves
    mid: 0,     // neutro en medios
    high: -2,   // recorte leve de agudos chillones
  });

  const reverb = new Tone.Reverb({
    decay: 1.6, // reverb corta
    preDelay: 0.01,
    wet: 0.18,  // 18% de mezcla
  });

  const chorus = new Tone.Chorus({
    frequency: 1.2, // movimiento lento
    depth: 0.3,     // leve
    delayTime: 2.5,
    spread: 120,
    wet: 0.15,      // 15% mezcla
  }).start();

  const tremolo = new Tone.Tremolo({
    frequency: 5,   // 4–6 Hz
    depth: 0.25,    // moderado
    spread: 180,
    wet: 0.15,      // 15% mezcla
  }).start();

  const volume = new Tone.Volume(-6); // nivel general del instrumento

  // 🔗 Cadena: sampler → volume → tremolo → chorus → eq → comp → reverb → limiter → out
  sampler.chain(volume, tremolo, chorus, eq, compressor, reverb, limiter);

  return sampler;
}
