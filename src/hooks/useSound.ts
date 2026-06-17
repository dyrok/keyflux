import { useEffect } from 'react'
import { audio } from '../lib/audio'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

/** Keep the Web-Audio engine in sync with sound preferences. */
export function useSound() {
  const sound = useKeyFluxStore((s) => s.prefs.sound)
  const volume = useKeyFluxStore((s) => s.prefs.soundVolume)
  useEffect(() => {
    audio.setEnabled(sound)
  }, [sound])
  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])
}
