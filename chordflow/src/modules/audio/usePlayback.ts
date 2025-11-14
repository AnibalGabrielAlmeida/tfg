// src/modules/audio/usePlayback.ts
// --------------------------------------------------
// 🎧 usePlayback — Control del transporte y audio
// --------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import {
  play,
  stop,
  scheduleProgression,
  rescheduleAtNextDownbeat,
  subscribeActiveBlock,          // 👈 nuevo
} from "./player";
import type { ChordBlock } from "../progression/types";

/**
 * Hook que controla el estado de reproducción global.
 * Encapsula play/stop, highlight del bloque y reschedule.
 */
export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // 🔥 Nos suscribimos una sola vez a los cambios de bloque activo
  useEffect(() => {
    subscribeActiveBlock((id) => setActiveBlockId(id));
  }, []);

  // Inicia reproducción con el estado actual (progresión + bpm + key)
  const playFromState = useCallback(
    async (progression: ChordBlock[], bpm: number, key: string) => {
      setActiveBlockId(null);                   // limpiar antes de arrancar
      scheduleProgression(progression, bpm, key);
      await play();
      setIsPlaying(true);
    },
    []
  );

  // Detiene reproducción
  const stopPlayback = useCallback(() => {
    stop();
    setIsPlaying(false);
    setActiveBlockId(null);                    // limpiar highlight
  }, []);

  // Reprograma al próximo downbeat si está sonando
  const rescheduleOnChange = useCallback(
    (progression: ChordBlock[], bpm: number, key: string) => {
      if (!isPlaying) return;
      rescheduleAtNextDownbeat(progression, bpm, key);
    },
    [isPlaying]
  );

  return {
    isPlaying,
    playFromState,
    stopPlayback,
    rescheduleOnChange,
    activeBlockId,          // 👈 esto va a ProgressionList
  };
}
