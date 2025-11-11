// src/modules/audio/usePlayback.ts
// --------------------------------------------------
// 🎧 usePlayback — Control del transporte y audio
// --------------------------------------------------

import { useState, useCallback } from "react";
import { play, stop, scheduleProgression, rescheduleAtNextDownbeat } from "./player";
import type { ChordBlock } from "../progression/types";

/**
 * Hook que controla el estado de reproducción global.
 * Encapsula play/stop y el reschedule al próximo downbeat.
 */
export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Inicia reproducción con el estado actual (progresión + bpm + key)
  const playFromState = useCallback(
    async (progression: ChordBlock[], bpm: number, key: string) => {
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
  };
}
