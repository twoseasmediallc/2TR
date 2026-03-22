import { useEffect, useRef } from 'react';

export default function Confetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = [
      'linear-gradient(45deg, #ff0080, #ff8c00)',
      'linear-gradient(45deg, #00ff88, #00d4ff)',
      'linear-gradient(45deg, #8b00ff, #ff00ff)',
      'linear-gradient(45deg, #ffff00, #ffa500)',
      'linear-gradient(45deg, #ff1493, #ff69b4)',
      'linear-gradient(45deg, #00bfff, #1e90ff)',
      'linear-gradient(45deg, #7fff00, #32cd32)',
      'linear-gradient(45deg, #ff4500, #ff6347)',
    ];

    const confettiPieces = 30;

    for (let i = 0; i < confettiPieces; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 6}px;
        height: ${Math.random() * 25 + 20}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -50px;
        border-radius: 2px;
        opacity: 1;
        animation: confetti-fall ${Math.random() * 2 + 3}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
        pointer-events: none;
        z-index: 20;
      `;
      containerRef.current.appendChild(confetti);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20"></div>;
}
