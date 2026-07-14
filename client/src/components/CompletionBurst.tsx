import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: Math.cos(angle) * 42, y: Math.sin(angle) * 42 };
});

// Lightweight celebratory burst for habit/task completion - no external confetti dependency.
export default function CompletionBurst({ show, color }: { show: boolean; color: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {show && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.01 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
