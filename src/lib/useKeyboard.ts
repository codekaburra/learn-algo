import { useEffect } from 'react';
import { usePlayer, SPEEDS, type Speed } from '../engine/player';

// Global playback shortcuts — active only when focus is outside inputs/textareas/editor.
export function usePlaybackKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable ||
          el.classList.contains('monaco-editor'))
      ) {
        return;
      }
      const p = usePlayer.getState();
      switch (e.key) {
        case ' ':
          e.preventDefault();
          p.toggle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          p.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          p.prev();
          break;
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const i = SPEEDS.indexOf(p.speed);
          const ni = e.key === 'ArrowUp' ? Math.min(i + 1, SPEEDS.length - 1) : Math.max(i - 1, 0);
          p.setSpeed(SPEEDS[ni] as Speed);
          break;
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
