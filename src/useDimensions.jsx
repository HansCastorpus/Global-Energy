import { useRef, useState, useEffect } from "react";

/**
 * useDimensions
 * Attaches a ResizeObserver to a DOM element and returns its live dimensions.
 *
 * Usage:
 *   const [ref, { width, height }] = useDimensions();
 *   return <div ref={ref}>...</div>
 *
 * Returns:
 *   [ref, { width, height }]
 */
export default function useDimensions() {
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    observer.observe(ref.current);

    // Seed initial size before first ResizeObserver callback
    const { width, height } = ref.current.getBoundingClientRect();
    setDimensions({ width: Math.floor(width), height: Math.floor(height) });

    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}