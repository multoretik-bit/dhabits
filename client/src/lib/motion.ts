// Shared motion tokens for the "Refined Dark Glass" design system.
// Keep every animation in the app pulling from here so duration/easing stay unified.
import type { Transition, Variants } from "framer-motion";

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as Transition,
  soft: { type: "spring", stiffness: 260, damping: 26 } as Transition,
  bouncy: { type: "spring", stiffness: 420, damping: 18 } as Transition,
};

export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  fluid: 0.55,
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: durations.fast, ease: ease.out } },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: spring.soft },
  exit: { opacity: 0, scale: 0.92, transition: { duration: durations.fast } },
};

export const listStagger: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.soft },
  exit: { opacity: 0, scale: 0.96, transition: { duration: durations.fast } },
};
