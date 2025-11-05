// --------------------------------------------------
// 🎛 ChordFlow — Instrumento + cadena de FX (Rhodes Sampler)
// --------------------------------------------------

import * as Tone from "tone";
import { createRhodesSampler } from "./sampler";

export async function createEPInstrument(): Promise<Tone.Sampler> {
  // 🔹 Carga el sampler de Rhodes
  const sampler = await createRhodesSampler();

  // 🔹 FX básicos: EQ, comp, chorus, tremolo, reverb corta
  const limiter = new Tone.Limiter(-3).toDestination();
  const compressor = new Tone.Compressor({
    threshold: -18,
    ratio: 2.5,
    attack: 0.01,
    release: 0.2,
  });
  const eq = new Tone.EQ3(-1, 0, -2); // recorte sutil de graves/agudos
  const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 });
  const chorus = new Tone.Chorus({
    frequency: 1.5,
    depth: 0.3,
    delayTime: 2.5,
    wet: 0.15,
  }).start();
  const tremolo = new Tone.Tremolo({
    frequency: 5, // 4–6 Hz
    depth: 0.25,
    spread: 180,
    wet: 0.12,
  }).start();
  const volume = new Tone.Volume(-10);

  // 🔗 Cadena de efectos: sampler → volume → tremolo → chorus → eq → reverb → comp → limiter → out
  sampler.chain(volume, tremolo, chorus, eq, reverb, compressor, limiter);

  return sampler;
}
