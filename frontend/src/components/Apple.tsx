import { forwardRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { SkinId } from '../store/useGameStore';

type Props = {
  skin: SkinId | null;
  bananaBoostActive: boolean;
  onTap: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export const Apple = forwardRef<HTMLDivElement, Props>(function Apple(
  { skin, bananaBoostActive, onTap }, ref,
) {
  const controls = useAnimationControls();

  const handlePointer = async (e: React.PointerEvent<HTMLDivElement>) => {
    controls.start({
      scaleX: [1, 0.86, 1.07, 1],
      scaleY: [1, 1.14, 0.93, 1],
      transition: { duration: 0.3, times: [0, 0.25, 0.6, 1] },
    });
    onTap(e);
  };

  const sizeClass = skin === 'pear' ? 'w-80 h-80' : 'w-72 h-72';

  return (
    <div className="relative w-80 h-80 flex items-center justify-center select-none">
      <div
        className="absolute inset-8 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.14) 45%, transparent 75%)',
          filter: 'blur(14px)',
          transform: 'translateY(24px)',
        }}
      />

      {bananaBoostActive && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, rgba(250,204,21,0), rgba(250,204,21,0.7), rgba(250,204,21,0))',
            filter: 'blur(28px)',
          }}
        />
      )}

      <motion.div
        animate={controls}
        onPointerDown={handlePointer}
        className={`tap-target relative ${sizeClass} cursor-pointer z-10`}
        style={{ willChange: 'transform', lineHeight: 0 }}
      >
        {skin === 'orange' && <OrangeSVG />}
        {skin === 'pear' && <PearSVG />}
        {skin === 'banana' && <BananaSVG />}
        {skin === 'grape' && <GrapeSVG />}
        {skin === 'strawberry' && <StrawberrySVG />}
        {skin === 'cherry' && <CherrySVG />}
        {skin === 'kiwi' && <KiwiSVG />}
        {skin === 'peach' && <PeachSVG />}
        {skin === 'pineapple' && <PineappleSVG />}
        {skin === 'mango' && <MangoSVG />}
        {skin === 'lemon' && <LemonSVG />}
        {skin === 'avocado' && <AvocadoSVG />}
        {skin === 'blueberry' && <BlueberrySVG />}
        {skin === 'coconut' && <CoconutSVG />}
        {skin === 'dragonfruit' && <DragonfruitSVG />}
        {!skin && <AppleSVG />}
      </motion.div>
    </div>
  );
});

function Eyes({ cx1, cx2, cy, small = false }: { cx1: number; cx2: number; cy: number; small?: boolean }) {
  const rx = small ? 9 : 11;
  const ry = small ? 11 : 14;
  const hr = small ? 3 : 4;
  return (
    <>
      <ellipse cx={cx1} cy={cy} rx={rx} ry={ry} fill="#0f172a" />
      <ellipse cx={cx2} cy={cy} rx={rx} ry={ry} fill="#0f172a" />
      <ellipse cx={cx1 + 3} cy={cy - 5} rx={hr} ry={hr + 1} fill="#ffffff" />
      <ellipse cx={cx2 + 3} cy={cy - 5} rx={hr} ry={hr + 1} fill="#ffffff" />
      <circle cx={cx1 - 3} cy={cy + 3} r={1.5} fill="#ffffff" opacity="0.75" />
      <circle cx={cx2 - 3} cy={cy + 3} r={1.5} fill="#ffffff" opacity="0.75" />
    </>
  );
}

function Smile({ x1, x2, y, color }: { x1: number; x2: number; y: number; color: string }) {
  const mx = (x1 + x2) / 2;
  return (
    <path
      d={`M${x1} ${y} Q${mx} ${y + 20} ${x2} ${y}`}
      stroke={color}
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Blush({ cx, cy, rx = 16, ry = 9 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fb7185" opacity="0.7" />
      <ellipse cx={cx - rx * 0.4} cy={cy - ry * 0.4} rx={rx * 0.5} ry={ry * 0.6} fill="#ffffff" opacity="0.5" />
    </>
  );
}

/** Сочный блик — большой эллипс + точка */
function Shine({ cx, cy, rx = 22, ry = 32, rotate = -22 }: { cx: number; cy: number; rx?: number; ry?: number; rotate?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity="0.55" transform={`rotate(${rotate} ${cx} ${cy})`} />
      <ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.3} rx={rx * 0.55} ry={ry * 0.5} fill="#ffffff" opacity="0.95" transform={`rotate(${rotate} ${cx} ${cy})`} />
    </>
  );
}

/* ============================ Фрукты ============================ */

function AppleSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="appleBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffd0d0" />
          <stop offset="15%" stopColor="#ff7878" />
          <stop offset="45%" stopColor="#ec1c24" />
          <stop offset="78%" stopColor="#a80008" />
          <stop offset="100%" stopColor="#5b0006" />
        </radialGradient>
      </defs>
      <path d="M120 46 Q128 22 148 14" stroke="#5b2e12" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M148 28 Q172 4 194 22 Q174 46 148 28 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M150 26 Q170 16 186 22" stroke="#14532d" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path
        d="M120 56 C 70 48 32 84 32 138 C 32 188 72 218 120 218 C 168 218 208 188 208 138 C 208 84 170 48 120 56 Z"
        fill="url(#appleBody)" stroke="#7f1d1d" strokeWidth="3"
      />
      <Shine cx={84} cy={94} rx={24} ry={34} />
      <ellipse cx="176" cy="180" rx="14" ry="10" fill="#ffffff" opacity="0.25" transform="rotate(30 176 180)" />
      <Blush cx={68} cy={168} />
      <Blush cx={172} cy={168} />
      <Eyes cx1={94} cx2={146} cy={128} />
      <Smile x1={100} x2={140} y={158} color="#7f1d1d" />
    </svg>
  );
}

function OrangeSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="orangeBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffe7b5" />
          <stop offset="18%" stopColor="#fdc253" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="78%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
      <path d="M120 50 Q126 26 142 18" stroke="#4b2106" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M142 32 Q166 8 188 24 Q170 44 142 32 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="120" cy="140" r="86" fill="url(#orangeBody)" stroke="#7c2d12" strokeWidth="3" />
      <g fill="#7c2d12" opacity="0.22">
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const r = 40 + (i % 4) * 12;
          const x = 120 + Math.cos(a) * r;
          const y = 140 + Math.sin(a) * r;
          return <circle key={i} cx={x} cy={y} r="1.6" />;
        })}
      </g>
      <Shine cx={86} cy={102} rx={22} ry={32} />
      <Blush cx={70} cy={170} />
      <Blush cx={170} cy={170} />
      <Eyes cx1={94} cx2={146} cy={132} />
      <Smile x1={100} x2={140} y={160} color="#7c2d12" />
    </svg>
  );
}

function PearSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="pearBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#f2ffb8" />
          <stop offset="18%" stopColor="#d4f16a" />
          <stop offset="50%" stopColor="#84cc16" />
          <stop offset="80%" stopColor="#4d7c0f" />
          <stop offset="100%" stopColor="#1a2e05" />
        </radialGradient>
      </defs>
      <path d="M118 60 Q114 34 106 20" stroke="#4b2106" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M108 28 Q132 4 152 22 Q130 42 108 28 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M120 62 C 100 66 92 84 92 104 C 92 118 98 128 92 146 C 84 172 72 210 120 214 C 168 210 156 172 148 146 C 142 128 148 118 148 104 C 148 84 140 66 120 62 Z"
        fill="url(#pearBody)" stroke="#365314" strokeWidth="3"
      />
      <ellipse cx="108" cy="110" rx="12" ry="22" fill="#ffffff" opacity="0.65" transform="rotate(-15 108 110)" />
      <Blush cx={86} cy={166} rx={14} ry={8} />
      <Blush cx={156} cy={166} rx={14} ry={8} />
      <Eyes cx1={104} cx2={136} cy={128} small />
      <Smile x1={108} x2={132} y={156} color="#365314" />
    </svg>
  );
}

function BananaSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <linearGradient id="bananaBody" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fffde3" />
          <stop offset="30%" stopColor="#ffe95c" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M56 132 C 50 88 92 56 138 62 C 182 68 208 108 202 152 C 198 182 176 204 148 208 C 130 210 118 202 118 190 C 118 180 128 174 138 174 C 160 172 174 156 174 138 C 174 118 156 100 138 98 C 118 96 100 110 96 132 C 94 146 96 158 104 170 C 96 168 88 162 80 154 C 62 148 56 142 56 132 Z"
        fill="url(#bananaBody)" stroke="#78350f" strokeWidth="3" strokeLinejoin="round"
      />
      <ellipse cx="56" cy="132" rx="10" ry="8" fill="#4b2106" transform="rotate(30 56 132)" />
      <ellipse cx="148" cy="204" rx="10" ry="7" fill="#4b2106" transform="rotate(-30 148 204)" />
      <path d="M110 82 Q140 66 168 86" stroke="#ffffff" strokeWidth="10" opacity="0.6" fill="none" strokeLinecap="round" />
      <path d="M116 88 Q140 76 162 88" stroke="#ffffff" strokeWidth="4" opacity="0.9" fill="none" strokeLinecap="round" />
      <Eyes cx1={118} cx2={152} cy={124} />
      <ellipse cx="104" cy="144" rx="12" ry="7" fill="#fb7185" opacity="0.75" />
      <ellipse cx="168" cy="140" rx="12" ry="7" fill="#fb7185" opacity="0.75" />
      <path d="M120 148 Q136 164 154 148" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function GrapeSVG() {
  const grapes: [number, number, number][] = [
    [86, 90, 22], [120, 82, 24], [154, 90, 22],
    [70, 126, 22], [105, 120, 24], [140, 120, 24], [170, 126, 22],
    [88, 158, 22], [122, 158, 24], [156, 158, 22],
    [105, 190, 22], [138, 190, 22],
    [120, 216, 20],
  ];
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="grapeBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#f3e0ff" />
          <stop offset="18%" stopColor="#d6a0ff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="80%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#2e1065" />
        </radialGradient>
      </defs>
      <path d="M120 50 Q118 24 108 12" stroke="#4b2106" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M108 20 Q132 4 148 20 Q128 38 108 20 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" strokeLinejoin="round" />
      {grapes.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="url(#grapeBody)" stroke="#4c1d95" strokeWidth="2" />
          <ellipse cx={x - r * 0.4} cy={y - r * 0.35} rx={r * 0.35} ry={r * 0.45} fill="#ffffff" opacity="0.7" />
        </g>
      ))}
      <Eyes cx1={100} cx2={140} cy={126} />
      <Smile x1={106} x2={136} y={150} color="#4c1d95" />
    </svg>
  );
}

function StrawberrySVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="strawBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffc6c6" />
          <stop offset="18%" stopColor="#ff6b6b" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="80%" stopColor="#a11212" />
          <stop offset="100%" stopColor="#500808" />
        </radialGradient>
      </defs>
      <path
        d="M120 46 C 56 56 34 110 56 168 C 76 214 120 228 120 228 C 120 228 164 214 184 168 C 206 110 184 56 120 46 Z"
        fill="url(#strawBody)" stroke="#7f1d1d" strokeWidth="3"
      />
      <path d="M120 40 Q102 18 78 24 Q92 40 106 44 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
      <path d="M120 40 Q138 18 162 24 Q148 40 134 44 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
      <path d="M120 40 Q100 6 82 16 Q98 34 112 44" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
      <path d="M120 40 Q140 6 158 16 Q142 34 128 44" fill="#16a34a" stroke="#14532d" strokeWidth="1.5" />
      <path d="M120 40 L120 14" stroke="#14532d" strokeWidth="4" strokeLinecap="round" />
      <g fill="#fde68a" stroke="#f59e0b" strokeWidth="0.7">
        {[
          [90, 110], [140, 108], [110, 140], [155, 140],
          [80, 148], [160, 150], [100, 175], [140, 178],
          [120, 200], [90, 200], [150, 200],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="3" ry="4.5" />
        ))}
      </g>
      <Shine cx={84} cy={90} rx={16} ry={24} />
      <Eyes cx1={100} cx2={140} cy={118} />
      <Smile x1={106} x2={134} y={148} color="#7f1d1d" />
    </svg>
  );
}

function CherrySVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="cherryBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffc0cd" />
          <stop offset="20%" stopColor="#f43f5e" />
          <stop offset="55%" stopColor="#be123c" />
          <stop offset="85%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#4c0519" />
        </radialGradient>
      </defs>

      <path d="M100 130 Q104 60 140 22" stroke="#4b2106" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M140 130 Q142 60 172 26" stroke="#4b2106" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M136 26 Q160 4 182 18 Q162 34 136 26 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" strokeLinejoin="round" />

      <g>
        <circle cx="94" cy="168" r="46" fill="url(#cherryBody)" stroke="#881337" strokeWidth="3" />
        <ellipse cx="76" cy="148" rx="14" ry="20" fill="#ffffff" opacity="0.7" transform="rotate(-25 76 148)" />
        <ellipse cx="72" cy="142" rx="6" ry="9" fill="#ffffff" opacity="0.95" transform="rotate(-25 72 142)" />
        <ellipse cx="78" cy="186" rx="11" ry="6" fill="#fb7185" opacity="0.85" />
        <ellipse cx="112" cy="186" rx="11" ry="6" fill="#fb7185" opacity="0.85" />
        <ellipse cx="84" cy="164" rx="6" ry="8.5" fill="#0f172a" />
        <ellipse cx="104" cy="164" rx="6" ry="8.5" fill="#0f172a" />
        <ellipse cx="86" cy="161" rx="2.2" ry="3" fill="#ffffff" />
        <ellipse cx="106" cy="161" rx="2.2" ry="3" fill="#ffffff" />
        <path d="M85 180 Q94 192 103 180" stroke="#7f1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      <g>
        <circle cx="156" cy="174" r="42" fill="url(#cherryBody)" stroke="#881337" strokeWidth="3" />
        <ellipse cx="140" cy="156" rx="12" ry="18" fill="#ffffff" opacity="0.7" transform="rotate(-25 140 156)" />
        <ellipse cx="137" cy="150" rx="5" ry="8" fill="#ffffff" opacity="0.95" transform="rotate(-25 137 150)" />
        <ellipse cx="142" cy="190" rx="10" ry="5.5" fill="#fb7185" opacity="0.85" />
        <ellipse cx="172" cy="190" rx="10" ry="5.5" fill="#fb7185" opacity="0.85" />
        <ellipse cx="147" cy="170" rx="5.5" ry="8" fill="#0f172a" />
        <ellipse cx="165" cy="170" rx="5.5" ry="8" fill="#0f172a" />
        <ellipse cx="149" cy="167" rx="2" ry="2.8" fill="#ffffff" />
        <ellipse cx="167" cy="167" rx="2" ry="2.8" fill="#ffffff" />
        <path d="M148 186 Q156 196 164 186" stroke="#7f1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function KiwiSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="kiwiFur" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#c49a63" />
          <stop offset="55%" stopColor="#8b5a2b" />
          <stop offset="100%" stopColor="#2e1a08" />
        </radialGradient>
        <radialGradient id="kiwiFlesh" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#f7ffd9" />
          <stop offset="35%" stopColor="#bef264" />
          <stop offset="75%" stopColor="#65a30d" />
          <stop offset="100%" stopColor="#365314" />
        </radialGradient>
        <radialGradient id="kiwiCore" cx="45%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ecfccb" />
        </radialGradient>
      </defs>

      <circle cx="120" cy="130" r="94" fill="url(#kiwiFur)" stroke="#3f2410" strokeWidth="3" />
      <g stroke="#3f2410" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const x1 = 120 + Math.cos(a) * 88;
          const y1 = 130 + Math.sin(a) * 88;
          const x2 = 120 + Math.cos(a) * 102;
          const y2 = 130 + Math.sin(a) * 102;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      <circle cx="120" cy="130" r="80" fill="url(#kiwiFlesh)" stroke="#3f6212" strokeWidth="2" />

      <g stroke="#a3e635" strokeWidth="2.5" opacity="0.85">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 120 + Math.cos(a) * 46;
          const y1 = 130 + Math.sin(a) * 46;
          const x2 = 120 + Math.cos(a) * 72;
          const y2 = 130 + Math.sin(a) * 72;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      <g fill="#0f172a">
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const x = 120 + Math.cos(a) * 56;
          const y = 130 + Math.sin(a) * 56;
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="2.8"
              ry="4.2"
              transform={`rotate(${a * 180 / Math.PI + 90} ${x} ${y})`}
            />
          );
        })}
      </g>

      <ellipse cx="120" cy="130" rx="42" ry="36" fill="url(#kiwiCore)" />

      <ellipse cx="104" cy="126" rx="10" ry="13" fill="#0f172a" />
      <ellipse cx="136" cy="126" rx="10" ry="13" fill="#0f172a" />
      <ellipse cx="107" cy="121" rx="3.5" ry="4.5" fill="#ffffff" />
      <ellipse cx="139" cy="121" rx="3.5" ry="4.5" fill="#ffffff" />

      <ellipse cx="92" cy="148" rx="10" ry="5.5" fill="#fb7185" opacity="0.75" />
      <ellipse cx="148" cy="148" rx="10" ry="5.5" fill="#fb7185" opacity="0.75" />

      <path d="M108 152 Q120 168 132 152" stroke="#3f6212" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PeachSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="peachBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#fff0e6" />
          <stop offset="18%" stopColor="#ffc9a3" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="80%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
      <path d="M120 44 Q130 22 148 18" stroke="#4b2106" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M148 26 Q172 4 194 22 Q174 46 148 26 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M120 60 C 68 54 36 92 38 140 C 40 188 82 218 120 218 C 158 218 200 188 202 140 C 204 92 172 54 120 60 Z"
        fill="url(#peachBody)" stroke="#9a3412" strokeWidth="3"
      />
      <path d="M120 60 Q110 130 120 218" stroke="#9a3412" strokeWidth="2" opacity="0.45" fill="none" />
      <Shine cx={84} cy={106} rx={22} ry={30} />
      <Blush cx={70} cy={166} />
      <Blush cx={170} cy={166} />
      <Eyes cx1={94} cx2={146} cy={132} />
      <Smile x1={100} x2={140} y={160} color="#9a3412" />
    </svg>
  );
}

function PineappleSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <linearGradient id="pineBody" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#fff5cc" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id="pineLeaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>

      <path d="M120 66 L110 4 L124 32 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L80 10 L108 36 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L160 10 L132 36 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L56 30 L98 46 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L184 30 L142 46 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L42 60 L92 56 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 66 L198 60 L148 56 Z" fill="url(#pineLeaf)" stroke="#0f3d1e" strokeWidth="2" strokeLinejoin="round" />

      <ellipse cx="120" cy="152" rx="72" ry="82" fill="url(#pineBody)" stroke="#7c2d12" strokeWidth="3" />

      <g stroke="#7c2d12" strokeWidth="1.7" fill="none" opacity="0.85">
        {[0, 1, 2, 3, 4].map(i => {
          const y = 78 + i * 30;
          return (
            <path key={i} d={`M${48 + 8 * i} ${y} L120 ${y - 18} L${192 - 8 * i} ${y} L120 ${y + 18} Z`} />
          );
        })}
      </g>
      <g fill="#7c2d12" opacity="0.6">
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={i} cx="120" cy={78 + i * 30} r="2.4" />
        ))}
      </g>

      <Shine cx={84} cy={118} rx={14} ry={22} rotate={-15} />

      <ellipse cx="98" cy="146" rx="11" ry="14" fill="#0f172a" />
      <ellipse cx="142" cy="146" rx="11" ry="14" fill="#0f172a" />
      <ellipse cx="101" cy="141" rx="4" ry="5" fill="#ffffff" />
      <ellipse cx="145" cy="141" rx="4" ry="5" fill="#ffffff" />

      <ellipse cx="82" cy="172" rx="12" ry="6" fill="#fb7185" opacity="0.85" />
      <ellipse cx="158" cy="172" rx="12" ry="6" fill="#fb7185" opacity="0.85" />

      <path d="M104 178 Q120 196 136 178" stroke="#7c2d12" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MangoSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="mangoBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#fffbd1" />
          <stop offset="18%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
      <path d="M120 44 Q128 20 148 16" stroke="#4b2106" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M148 24 Q172 2 192 18 Q172 40 148 24 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M120 58 C 64 54 30 96 36 148 C 42 196 82 220 130 214 C 180 208 210 172 206 122 C 202 76 172 62 120 58 Z"
        fill="url(#mangoBody)" stroke="#7c2d12" strokeWidth="3"
      />
      <Shine cx={84} cy={108} rx={22} ry={30} />
      <Blush cx={70} cy={166} />
      <Blush cx={170} cy={166} />
      <Eyes cx1={94} cx2={146} cy={134} />
      <Smile x1={100} x2={140} y={162} color="#7c2d12" />
    </svg>
  );
}

function LemonSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="lemonBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#fffde0" />
          <stop offset="20%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#eab308" />
          <stop offset="82%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#422006" />
        </radialGradient>
      </defs>
      <path d="M118 50 Q116 24 108 12" stroke="#4b2106" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M110 22 Q134 4 152 20 Q132 38 110 22 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="120" cy="140" rx="86" ry="70" fill="url(#lemonBody)" stroke="#713f12" strokeWidth="3" />
      <ellipse cx="46" cy="140" rx="10" ry="7" fill="#facc15" stroke="#713f12" strokeWidth="2" />
      <ellipse cx="194" cy="140" rx="10" ry="7" fill="#facc15" stroke="#713f12" strokeWidth="2" />
      <g fill="#713f12" opacity="0.22">
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          const r = 40 + (i % 5) * 9;
          const x = 120 + Math.cos(a) * r * 1.15;
          const y = 140 + Math.sin(a) * r * 0.85;
          return <circle key={i} cx={x} cy={y} r="1.6" />;
        })}
      </g>
      <Shine cx={88} cy={106} rx={18} ry={26} rotate={-20} />
      <Blush cx={72} cy={164} />
      <Blush cx={168} cy={164} />
      <Eyes cx1={96} cx2={144} cy={132} />
      <Smile x1={102} x2={138} y={160} color="#713f12" />
    </svg>
  );
}

function AvocadoSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="avoOuter" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#4d7c0f" />
          <stop offset="35%" stopColor="#365314" />
          <stop offset="75%" stopColor="#1a2e05" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id="avoFlesh" cx="42%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="45%" stopColor="#ecfccb" />
          <stop offset="80%" stopColor="#bef264" />
          <stop offset="100%" stopColor="#a3e635" />
        </radialGradient>
        <radialGradient id="avoPit" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#451a03" />
        </radialGradient>
      </defs>
      <path d="M120 42 Q116 22 108 12" stroke="#4b2106" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M110 22 Q132 4 150 18 Q132 36 110 22 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round" />
      <path
        d="M120 58 C 82 66 62 108 66 152 C 70 196 94 220 120 220 C 146 220 170 196 174 152 C 178 108 158 66 120 58 Z"
        fill="url(#avoOuter)" stroke="#0a0a0a" strokeWidth="3"
      />
      <path
        d="M120 74 C 94 82 80 116 84 152 C 88 186 104 206 120 206 C 136 206 152 186 156 152 C 160 116 146 82 120 74 Z"
        fill="url(#avoFlesh)" stroke="#365314" strokeWidth="2"
      />
      <ellipse cx="120" cy="158" rx="34" ry="36" fill="url(#avoPit)" stroke="#451a03" strokeWidth="2.5" />
      <ellipse cx="110" cy="146" rx="10" ry="13" fill="#ffffff" opacity="0.7" transform="rotate(-20 110 146)" />
      <ellipse cx="96" cy="106" rx="10" ry="16" fill="#ffffff" opacity="0.5" transform="rotate(-20 96 106)" />
      <ellipse cx="88" cy="124" rx="8" ry="5" fill="#fb7185" opacity="0.7" />
      <ellipse cx="152" cy="124" rx="8" ry="5" fill="#fb7185" opacity="0.7" />
      <ellipse cx="104" cy="112" rx="9" ry="12" fill="#0f172a" />
      <ellipse cx="136" cy="112" rx="9" ry="12" fill="#0f172a" />
      <ellipse cx="107" cy="107" rx="3" ry="4" fill="#ffffff" />
      <ellipse cx="139" cy="107" rx="3" ry="4" fill="#ffffff" />
      <path d="M108 132 Q120 146 132 132" stroke="#365314" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BlueberrySVG() {
  const berries: [number, number, number][] = [
    [86, 96, 30], [120, 88, 32], [154, 96, 30],
    [72, 138, 30], [106, 130, 32], [140, 130, 32], [170, 138, 30],
    [88, 174, 30], [122, 172, 32], [156, 174, 30],
    [106, 206, 28], [140, 206, 28],
  ];
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="bbBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="18%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="80%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0c1445" />
        </radialGradient>
      </defs>
      <path d="M120 50 Q118 24 108 12" stroke="#4b2106" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M108 20 Q132 4 148 20 Q128 38 108 20 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" strokeLinejoin="round" />
      {berries.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="url(#bbBody)" stroke="#1e3a8a" strokeWidth="2" />
          <ellipse cx={x - r * 0.4} cy={y - r * 0.35} rx={r * 0.32} ry={r * 0.42} fill="#ffffff" opacity="0.7" />
          <path
            d={`M${x - r * 0.35} ${y - r * 0.85} L${x} ${y - r * 0.55} L${x + r * 0.35} ${y - r * 0.85} L${x + r * 0.15} ${y - r * 0.65} L${x + r * 0.4} ${y - r * 0.4} L${x} ${y - r * 0.45} L${x - r * 0.4} ${y - r * 0.4} L${x - r * 0.15} ${y - r * 0.65} Z`}
            fill="#1e3a8a"
            opacity="0.55"
          />
        </g>
      ))}
      <Eyes cx1={100} cx2={140} cy={130} />
      <ellipse cx="86" cy="146" rx="9" ry="5" fill="#fb7185" opacity="0.75" />
      <ellipse cx="154" cy="146" rx="9" ry="5" fill="#fb7185" opacity="0.75" />
      <Smile x1={106} x2={134} y={154} color="#1e3a8a" />
    </svg>
  );
}

function CoconutSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="cocoBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#a18976" />
          <stop offset="30%" stopColor="#7c5a3a" />
          <stop offset="65%" stopColor="#4b2e17" />
          <stop offset="100%" stopColor="#1c0f06" />
        </radialGradient>
        <radialGradient id="cocoFlesh" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f5f5f4" />
          <stop offset="100%" stopColor="#d6d3d1" />
        </radialGradient>
      </defs>
      <path d="M120 46 Q126 22 142 14" stroke="#4b2106" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M142 24 Q166 4 186 20 Q166 40 142 24 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" />

      <circle cx="120" cy="140" r="92" fill="url(#cocoBody)" stroke="#1c0f06" strokeWidth="3" />

      <g stroke="#1c0f06" strokeWidth="1.4" opacity="0.55" fill="none">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const x1 = 120 + Math.cos(a) * 20;
          const y1 = 140 + Math.sin(a) * 20;
          const x2 = 120 + Math.cos(a) * 92;
          const y2 = 140 + Math.sin(a) * 92;
          return <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2 + 8} ${(y1 + y2) / 2 - 6} ${x2} ${y2}`} />;
        })}
      </g>

      <circle cx="92" cy="120" r="12" fill="#1c0f06" opacity="0.85" />
      <circle cx="148" cy="120" r="12" fill="#1c0f06" opacity="0.85" />
      <circle cx="120" cy="162" r="12" fill="#1c0f06" opacity="0.85" />

      <circle cx="94" cy="100" r="9" fill="url(#cocoFlesh)" stroke="#1c0f06" strokeWidth="1.5" opacity="0.9" />
      <circle cx="146" cy="100" r="9" fill="url(#cocoFlesh)" stroke="#1c0f06" strokeWidth="1.5" opacity="0.9" />
      <circle cx="120" cy="148" r="9" fill="url(#cocoFlesh)" stroke="#1c0f06" strokeWidth="1.5" opacity="0.9" />

      <ellipse cx="94" cy="100" rx="3.2" ry="4.4" fill="#0f172a" />
      <ellipse cx="146" cy="100" rx="3.2" ry="4.4" fill="#0f172a" />
      <ellipse cx="96" cy="98" rx="1.3" ry="1.7" fill="#ffffff" />
      <ellipse cx="148" cy="98" rx="1.3" ry="1.7" fill="#ffffff" />

      <ellipse cx="82" cy="118" rx="8" ry="5" fill="#fb7185" opacity="0.6" />
      <ellipse cx="158" cy="118" rx="8" ry="5" fill="#fb7185" opacity="0.6" />

      <path d="M112 162 Q120 172 128 162" stroke="#1c0f06" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function DragonfruitSVG() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="dfBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffd6f0" />
          <stop offset="18%" stopColor="#f472b6" />
          <stop offset="55%" stopColor="#db2777" />
          <stop offset="82%" stopColor="#831843" />
          <stop offset="100%" stopColor="#3b0a2a" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="130" rx="82" ry="90" fill="url(#dfBody)" stroke="#831843" strokeWidth="3" />

      {[
        { d: 'M54 78 L24 46 L58 62 Z' },
        { d: 'M186 78 L216 46 L182 62 Z' },
        { d: 'M44 130 L6 122 L52 146 Z' },
        { d: 'M196 130 L234 122 L188 146 Z' },
        { d: 'M62 190 L28 208 L66 200 Z' },
        { d: 'M178 190 L212 208 L174 200 Z' },
        { d: 'M120 42 L120 10 L138 44 Z' },
        { d: 'M104 40 L88 12 L122 36 Z' },
      ].map((p, i) => (
        <path key={i} d={p.d} fill="#65a30d" stroke="#14532d" strokeWidth="2" strokeLinejoin="round" />
      ))}

      <ellipse cx="96" cy="118" rx="14" ry="18" fill="#0f172a" />
      <ellipse cx="144" cy="118" rx="14" ry="18" fill="#0f172a" />
      <ellipse cx="100" cy="112" rx="5" ry="6.5" fill="#ffffff" />
      <ellipse cx="148" cy="112" rx="5" ry="6.5" fill="#ffffff" />

      <ellipse cx="78" cy="152" rx="12" ry="7" fill="#fb7185" opacity="0.85" />
      <ellipse cx="162" cy="152" rx="12" ry="7" fill="#fb7185" opacity="0.85" />

      <path d="M102 156 Q120 176 138 156" stroke="#3b0a2a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

