import { motion } from 'framer-motion';

export type Floating = {
  id: number;
  x: number;
  y: number;
  text: string;
  crit: boolean;
};

export function FloatingTexts({ items }: { items: Floating[] }) {
  return (
    <>
      {items.map(f => (
        <motion.div
          key={f.id}
          initial={{
            position: 'fixed',
            left: f.x,
            top: f.y,
            opacity: 1,
            scale: f.crit ? 0.7 : 0.9,
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            top: f.y - 80,
            opacity: 0,
            scale: f.crit ? 1.6 : 1.1,
            x: '-50%',
            y: '-50%',
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`pointer-events-none absolute font-extrabold select-none whitespace-nowrap ${
            f.crit
              ? 'text-yellow-300 text-4xl drop-shadow-[0_0_16px_rgba(250,204,21,1)]'
              : 'text-white text-2xl'
          }`}
          style={{ textShadow: '0 3px 12px rgba(0,0,0,.45)' }}
        >
          {f.text}
        </motion.div>
      ))}
    </>
  );
}