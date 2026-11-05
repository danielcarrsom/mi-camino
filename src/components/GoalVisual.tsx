"use client";
// The game piece of every goal: a casita built brick by brick, or a jar
// filling with coins. One brick/coin = one twentieth (or tenth) of the goal.

export const HOUSE_BRICKS = 20;
export const JAR_COINS = 10;

export function unitsFor(visual: "house" | "jar") {
  return visual === "house" ? HOUSE_BRICKS : JAR_COINS;
}

export function GoalVisual({ visual, progress, highlightFrom, size = 220 }: {
  visual: "house" | "jar";
  progress: number;        // 0..1
  highlightFrom?: number;  // units at or above this index animate in
  size?: number;
}) {
  return visual === "house"
    ? <HouseBricks progress={progress} highlightFrom={highlightFrom} size={size} />
    : <CoinJar progress={progress} highlightFrom={highlightFrom} size={size} />;
}

function HouseBricks({ progress, highlightFrom, size }: { progress: number; highlightFrom?: number; size: number }) {
  const filled = Math.min(HOUSE_BRICKS, Math.floor(progress * HOUSE_BRICKS + 1e-9));
  const done = filled >= HOUSE_BRICKS;
  const cols = 5, rows = 4, bw = 28, bh = 16, gap = 3;
  const wallW = cols * bw + (cols - 1) * gap;
  const x0 = (200 - wallW) / 2, yBottom = 182;
  const bricks: { x: number; y: number; w: number; i: number }[] = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const y = yBottom - (r + 1) * bh - r * gap;
    const offset = r % 2 === 1;
    // staggered rows: half bricks at the ends
    const pieces = offset ? [bw / 2 - gap / 2, ...Array(cols - 1).fill(bw), bw / 2 - gap / 2] : Array(cols).fill(bw);
    let x = x0;
    for (const w of pieces) {
      bricks.push({ x, y, w, i: i++ });
      x += w + gap;
    }
  }
  // bricks.length = 22 with half bricks; map progress over first 20 "units"
  const total = bricks.length;
  const filledBricks = Math.round((filled / HOUSE_BRICKS) * total);
  const hlFrom = highlightFrom != null ? Math.round((highlightFrom / HOUSE_BRICKS) * total) : Infinity;
  const roofY = yBottom - rows * bh - (rows - 1) * gap - 4;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${filled} de ${HOUSE_BRICKS} ladrillos`}>
      <ellipse cx="100" cy="186" rx="88" ry="7" fill="#3e7d4f" opacity="0.9" />
      {/* roof: outline while building, filled when complete */}
      <path
        d={`M${x0 - 14} ${roofY} L100 ${roofY - 58} L${x0 + wallW + 14} ${roofY} Z`}
        fill={done ? "#b34a2a" : "none"}
        stroke={done ? "#b34a2a" : "#d9cbb2"}
        strokeWidth="3"
        strokeDasharray={done ? undefined : "6 6"}
        strokeLinejoin="round"
        className={done ? "brick-new" : undefined}
      />
      {done && <rect x="128" y={roofY - 46} width="12" height="22" fill="#8f3a20" className="brick-new" />}
      {bricks.map((b) => {
        const on = b.i < filledBricks;
        return (
          <rect
            key={b.i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={bh}
            rx="3"
            fill={on ? (b.i % 3 === 0 ? "#a8432a" : "#b34a2a") : "transparent"}
            stroke={on ? "#8f3a20" : "#d9cbb2"}
            strokeWidth={on ? 1 : 1.5}
            strokeDasharray={on ? undefined : "3 3"}
            className={on && b.i >= hlFrom ? "brick-new" : undefined}
            style={on && b.i >= hlFrom ? { animationDelay: `${(b.i - hlFrom) * 0.12}s` } : undefined}
          />
        );
      })}
      {done && (
        <>
          <rect x="88" y={yBottom - 40} width="24" height="40" rx="3" fill="#e0a33a" className="brick-new" />
          <circle cx="107" cy={yBottom - 20} r="2" fill="#8f3a20" />
        </>
      )}
    </svg>
  );
}

function CoinJar({ progress, highlightFrom, size }: { progress: number; highlightFrom?: number; size: number }) {
  const filled = Math.min(JAR_COINS, Math.floor(progress * JAR_COINS + 1e-9));
  const hl = highlightFrom ?? Infinity;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${filled} de ${JAR_COINS} monedas`}>
      <ellipse cx="100" cy="188" rx="70" ry="6" fill="#d9cbb2" />
      <rect x="70" y="18" width="60" height="16" rx="5" fill="#b34a2a" />
      <path d="M62 40 Q 60 34 70 34 L130 34 Q 140 34 138 40 L150 60 Q 156 70 156 84 L156 168 Q 156 184 140 184 L60 184 Q 44 184 44 168 L44 84 Q 44 70 50 60 Z" fill="#fffbf3" stroke="#d9cbb2" strokeWidth="3" />
      {Array.from({ length: JAR_COINS }).map((_, i) => {
        const on = i < filled;
        const y = 170 - i * 12.5;
        return (
          <g key={i} className={on && i >= hl ? "brick-new" : undefined} style={on && i >= hl ? { animationDelay: `${(i - hl) * 0.12}s` } : undefined}>
            <ellipse cx="100" cy={y} rx="40" ry="6.5" fill={on ? "#e0a33a" : "transparent"} stroke={on ? "#b07a1a" : "#eadfcb"} strokeWidth="1.5" strokeDasharray={on ? undefined : "3 3"} />
          </g>
        );
      })}
      {filled >= JAR_COINS && <text x="100" y="118" textAnchor="middle" fontSize="40">⭐</text>}
    </svg>
  );
}
