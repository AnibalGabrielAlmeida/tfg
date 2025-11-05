// --------------------------------------------------
// 🎛 ChordFlow — Instrumento + cadena de FX (EP/Rhodes)
// --------------------------------------------------

import * as Tone from "tone";

export function createEPInstrument() {
  // synth → volume → tremolo → chorus → reverb → comp → limiter → out

  const limiter = new Tone.Limiter(-3).toDestination();
  const compressor = new Tone.Compressor({
    threshold: -16,
    ratio: 3,
    attack: 0.01,
    release: 0.2,
  });
  const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.12 });
  const chorus = new Tone.Chorus({
    frequency: 0.8,
    depth: 0.5,
    delayTime: 2.5,
    wet: 0.18,
  }).start();
  const tremolo = new Tone.Tremolo({
    frequency: 4,
    depth: 0.22,
    spread: 180,
    wet: 0.12,
  }).start();
  const volume = new Tone.Volume(-12);

  // cadena de FX
  reverb.connect(compressor);
  compressor.connect(limiter);
  chorus.connect(reverb);
  tremolo.connect(chorus);
  volume.connect(tremolo);

  // EP simple con ADSR “amable”
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.012, decay: 0.18, sustain: 0.55, release: 0.7 },
  }).connect(volume);

  // Límite de polifonía
  (synth as any).maxPolyphony = 8;

  // Atenuación extra del instrumento (por si el preset suma ganancia)
  if ((synth as any).volume?.value !== undefined) {
    (synth as any).volume.value = -4;
  }

  return synth;
}
