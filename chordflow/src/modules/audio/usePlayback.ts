// --------------------------------------------------
// Plataforma Web Interactiva Para La Creación y Exploración De Progresiones Armónicas
// Módulo: usePlayback (hook de control de transporte y audio)
// --------------------------------------------------
// Este hook centraliza todas las operaciones relacionadas con la
// reproducción de la progresión:
//
// - Iniciar y detener la reproducción (play/stop).
// - Programar la progresión completa según el tempo y la tonalidad.
// - Reprogramar la progresión en el próximo downbeat cuando hay cambios.
// - Mantener y exponer el bloque activo, para sincronizar el
//   resaltado visual en la interfaz.
//
// El módulo player.ts se encarga del manejo completo del motor de audio.
// Este hook funciona como una capa de integración entre React y Tone.js.
// --------------------------------------------------

import { useState, useCallback, useEffect } from "react";
import {
  play,
  stop,
  scheduleProgression,
  rescheduleAtNextDownbeat,
  subscribeActiveBlock,
} from "./player";
import type { ChordBlock } from "../progression/types";

/**
 * Hook que gestiona el estado de reproducción global del sistema.
 * Expone métodos para iniciar, detener y reprogramar la progresión,
 * además de informar qué bloque está activo en cada momento.
 */
export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Se suscribe una sola vez a los eventos del motor de audio
  // que informan qué bloque está entrando en reproducción.
  useEffect(() => {
    subscribeActiveBlock((id) => setActiveBlockId(id));
  }, []);

  /**
   * Inicia la reproducción con la progresión, bpm y tonalidad actuales.
   * Limpia el bloque activo previo, programa la progresión
   * y luego arranca el transporte.
   */
  const playFromState = useCallback(
    async (progression: ChordBlock[], bpm: number, key: string) => {
      setActiveBlockId(null);
      scheduleProgression(progression, bpm, key);
      await play();
      setIsPlaying(true);
    },
    []
  );

  /**
   * Detiene completamente la reproducción y limpia el estado visual.
   */
  const stopPlayback = useCallback(() => {
    stop();
    setIsPlaying(false);
    setActiveBlockId(null);
  }, []);

  /**
   * Si la reproducción está corriendo, reprograma la progresión en el
   * próximo downbeat para evitar cortes abruptos.
   */
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
    activeBlockId, // Enviado a ProgressionList para resaltar el bloque activo
  };
}
