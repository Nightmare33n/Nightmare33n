// Generates assets/header-dark.svg and assets/header-light.svg.
// Run: node scripts/build-header.mjs
import { writeFileSync } from "node:fs";

const themes = {
  dark: { bg: "#0d1117", border: "#30363d", bar: "#161b22", text: "#e6edf3", muted: "#7d8590", prompt: "#3fb950", accent: "#58a6ff", hl: "#d2a8ff" },
  light: { bg: "#ffffff", border: "#d0d7de", bar: "#f6f8fa", text: "#1f2328", muted: "#656d76", prompt: "#1a7f37", accent: "#0969da", hl: "#8250df" },
};

const W = 860, H = 250, CHAR = 10.84, X = 32;

// [y, segments, start (s), duration (s)]
const lines = [
  [86,  [["$ ", "prompt"], ["whoami", "text"]], 0.4, 0.5],
  [116, [["Andre Aguirre", "accent"], [" · Software Developer", "text"]], 1.1, 0.9],
  [158, [["$ ", "prompt"], ["cat stack.txt", "text"]], 2.3, 0.6],
  [188, [["web", "hl"], [" · ", "muted"], ["desktop", "hl"], [" · ", "muted"], ["mobile", "hl"], [" · ", "muted"], ["minecraft mods", "hl"], [" · ", "muted"], ["systems", "hl"]], 3.1, 1.4],
  [222, [["$ ", "prompt"]], 4.8, 0.1],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function build(t) {
  const clips = [], texts = [];
  lines.forEach(([y, segs, begin, dur], i) => {
    const len = segs.reduce((n, [s]) => n + s.length, 0);
    const w = Math.ceil(len * CHAR) + 4;
    clips.push(
      `<clipPath id="c${i}"><rect x="${X}" y="${y - 20}" width="0" height="28">` +
      `<animate attributeName="width" from="0" to="${w}" begin="${begin}s" dur="${dur}s" fill="freeze" calcMode="discrete" keyTimes="${keyTimes(len)}" values="${values(len, w)}"/>` +
      `</rect></clipPath>`
    );
    const tspans = segs.map(([s, c]) => `<tspan fill="${t[c]}">${esc(s)}</tspan>`).join("");
    texts.push(`<text x="${X}" y="${y}" clip-path="url(#c${i})" xml:space="preserve">${tspans}</text>`);
  });

  const cursorX = X + 2 * CHAR + 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andre Aguirre — Software Developer">
<title>Andre Aguirre — Software Developer</title>
<defs>${clips.join("")}</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.bg}" stroke="${t.border}"/>
<path d="M0.5 44 V10.5 a10 10 0 0 1 10 -10 H${W - 10.5} a10 10 0 0 1 10 10 V44 Z" fill="${t.bar}"/>
<line x1="0.5" y1="44" x2="${W - 0.5}" y2="44" stroke="${t.border}"/>
<circle cx="24" cy="22" r="6" fill="#ff5f57"/><circle cx="44" cy="22" r="6" fill="#febc2e"/><circle cx="64" cy="22" r="6" fill="#28c840"/>
<text x="${W / 2}" y="27" text-anchor="middle" fill="${t.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13">~/nightmare33n — zsh</text>
<g font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace" font-size="18">
${texts.join("\n")}
</g>
<rect x="${cursorX}" y="206" width="10" height="21" fill="${t.text}" opacity="0">
<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.01;0.5;0.51;1" dur="1.1s" begin="4.9s" repeatCount="indefinite"/>
</rect>
</svg>
`;
}

// Char-by-char typing: discrete steps, one per character.
function keyTimes(n) {
  return Array.from({ length: n + 1 }, (_, i) => (i / n).toFixed(4)).join(";");
}
function values(n, w) {
  return Array.from({ length: n + 1 }, (_, i) => (i === n ? w : Math.round(i * CHAR))).join(";");
}

for (const [name, t] of Object.entries(themes)) {
  writeFileSync(new URL(`../assets/header-${name}.svg`, import.meta.url), build(t));
}
console.log("header SVGs written");
