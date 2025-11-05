// --------------------------------------------------
// 🎹 ChordFlow — Rhodes Sampler (Tone.Sampler)
// --------------------------------------------------
// Carga multisamples de un Rhodes real para uso en fxChain.
// --------------------------------------------------

import * as Tone from "tone";

export async function createRhodesSampler(): Promise<Tone.Sampler> {
  const sampler = new Tone.Sampler({
    urls: {
      C3: "C3.mp3",
      F3: "F3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      F4: "F4.mp3",
    },
    baseUrl: "/samples/rhodes/", // 🔊 tus archivos van en public/samples/rhodes/
    release: 1.2,                // liberación natural
    volume: 2,                  // nivel general
  });

  // Espera a que cargue (Tone.Sampler.load() devuelve Promise)
  await Tone.loaded();

  return sampler;
}
