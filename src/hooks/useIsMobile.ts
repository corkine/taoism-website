import { useState, useEffect } from 'react';

/** One-time mobile detection on mount (no resize listener). */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isMobile;
}
