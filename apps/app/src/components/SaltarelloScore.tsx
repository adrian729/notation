import { useCallback, useEffect, useRef, useState } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { NotationHandle, PlaybackView } from '@polyhymnia/notation-react';
import type { MnxDocument } from '@polyhymnia/mnx';
import { eventsFromTimeMap } from '@polyhymnia/audio';
import type { Playback } from '@polyhymnia/audio/webaudio';
import { createSound } from '@/lib/sound';

const CURSOR_VIEW: PlaybackView = { mode: 'cursor', highlightActive: true };
const OFF_VIEW: PlaybackView = { mode: 'off' };

export function SaltarelloScore({ score }: { score: MnxDocument }) {
  const handleRef = useRef<NotationHandle>(null);
  const frameRef = useRef(0);
  const playbackRef = useRef<Playback | null>(null);
  const [sound] = useState(createSound);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    const playback = playbackRef.current;
    playbackRef.current = null;
    playback?.stop();
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const timeMap = handle.getTimeMap();
    const clip = eventsFromTimeMap(timeMap);
    const playback = sound.playEvents(clip.events);
    playbackRef.current = playback;
    setPlaying(true);
    const tick = () => {
      const current = handleRef.current;
      if (playbackRef.current !== playback || !current || current.getTimeMap() !== timeMap) {
        if (playbackRef.current === playback) stop();
        return;
      }
      current.setPlaybackTick(clip.tickAtSeconds(playback.time()));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    void playback.finished.then(() => {
      if (playbackRef.current === playback) stop();
    });
  }, [sound, stop]);

  useEffect(() => stop, [stop]);

  return (
    <button
      type="button"
      onClick={playing ? stop : play}
      aria-label={playing ? 'Stop the Saltarello' : 'Play the Saltarello'}
      className="w-full cursor-pointer appearance-none rounded-sm border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Notation score={score} ref={handleRef}>
        <Notation.Playback view={playing ? CURSOR_VIEW : OFF_VIEW} />
      </Notation>
    </button>
  );
}
