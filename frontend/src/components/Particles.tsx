import { motion } from 'framer-motion';

export type Particle = {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  emoji: string;
};

export function Particles({ items }: { items: Particle[] }) {
  return (
    <>
      {items.map(p => (
        <motion.div
          key={p.id}
          initial={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            opacity: 1,
            scale: 1,
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            left: p.x + Math.cos(p.angle) * p.distance,
            top: p.y + Math.sin(p.angle) * p.distance + 50,
            opacity: 0,
            scale: 0.4,
            x: '-50%',
            y: '-50%',
          }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="pointer-events-none absolute text-2xl select-none will-change-transform"
        >
          {p.emoji}
        </motion.div>
      ))}
    </>
  );
}