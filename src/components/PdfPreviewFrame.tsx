import React, { useEffect, useRef, useState } from 'react';

const BASE_WIDTH = 595;
const BASE_HEIGHT = 842;

interface PdfPreviewFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const PdfPreviewFrame: React.FC<PdfPreviewFrameProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      const width = node.clientWidth || BASE_WIDTH;
      const nextScale = Math.min(1, width / BASE_WIDTH);
      setScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    updateScale();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateScale);
      observer.observe(node);
    }

    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`w-full ${className || ''}`}>
      <div
        className="mx-auto"
        style={{ width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale }}
      >
        <div
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
