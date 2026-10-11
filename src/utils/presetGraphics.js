/**
 * Curated Streetwear Graphics & Sticker Library.
 * Scalable vector graphics (SVG) converted to data URLs for instantaneous,
 * zero-network-latency decal placement in the 3D studio.
 */

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All Graphics' },
  { id: 'badges', label: 'Emblems & Badges' },
  { id: 'typography', label: 'Typography & Arch' },
  { id: 'cyber', label: 'Cyber & Y2K' },
  { id: 'labels', label: 'Tech Spec Labels' }
];

export const PRESET_GRAPHICS = [
  {
    id: 'tokyo_barcode',
    name: 'Tokyo Cyber Barcode',
    category: 'cyber',
    tags: ['cyber', 'barcode', 'tokyo', 'streetwear'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="400" height="240">
      <rect width="400" height="240" fill="transparent"/>
      <text x="20" y="32" font-family="'Courier New', monospace" font-size="14" font-weight="900" fill="#000000" letter-spacing="4">TOKYO / ARCHIVE DEPT.</text>
      <text x="380" y="32" font-family="'Courier New', monospace" font-size="12" font-weight="700" fill="#000000" text-anchor="end">SYS.2026 // REF.09</text>
      <line x1="20" y1="42" x2="380" y2="42" stroke="#000000" stroke-width="2"/>
      
      <!-- Barcode bars -->
      <g fill="#000000">
        <rect x="25" y="55" width="6" height="110"/>
        <rect x="36" y="55" width="3" height="110"/>
        <rect x="44" y="55" width="10" height="110"/>
        <rect x="60" y="55" width="4" height="110"/>
        <rect x="68" y="55" width="8" height="110"/>
        <rect x="82" y="55" width="3" height="110"/>
        <rect x="90" y="55" width="12" height="110"/>
        <rect x="108" y="55" width="5" height="110"/>
        <rect x="118" y="55" width="9" height="110"/>
        <rect x="132" y="55" width="4" height="110"/>
        <rect x="142" y="55" width="7" height="110"/>
        <rect x="154" y="55" width="11" height="110"/>
        <rect x="170" y="55" width="3" height="110"/>
        <rect x="178" y="55" width="8" height="110"/>
        <rect x="192" y="55" width="5" height="110"/>
        <rect x="202" y="55" width="12" height="110"/>
        <rect x="220" y="55" width="4" height="110"/>
        <rect x="228" y="55" width="9" height="110"/>
        <rect x="242" y="55" width="3" height="110"/>
        <rect x="250" y="55" width="14" height="110"/>
        <rect x="270" y="55" width="4" height="110"/>
        <rect x="280" y="55" width="8" height="110"/>
        <rect x="294" y="55" width="6" height="110"/>
        <rect x="306" y="55" width="10" height="110"/>
        <rect x="322" y="55" width="4" height="110"/>
        <rect x="332" y="55" width="9" height="110"/>
        <rect x="346" y="55" width="3" height="110"/>
        <rect x="354" y="55" width="12" height="110"/>
        <rect x="372" y="55" width="4" height="110"/>
      </g>
      
      <line x1="20" y1="178" x2="380" y2="178" stroke="#000000" stroke-width="2"/>
      <text x="200" y="200" font-family="'Courier New', monospace" font-size="15" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="8">8 048921 704153</text>
      <text x="200" y="222" font-family="sans-serif" font-size="10" font-weight="700" fill="#000000" text-anchor="middle" letter-spacing="2">AUTHENTIC VIRTUAL THREADS STREETWEAR</text>
    </svg>`
  },
  {
    id: 'acid_smiley',
    name: 'Liquid Acid Smiley',
    category: 'badges',
    tags: ['acid', 'smiley', 'grunge', 'streetwear', 'drip'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="130" fill="none" stroke="#000000" stroke-width="18"/>
      <!-- Cross eyes -->
      <g stroke="#000000" stroke-width="14" stroke-linecap="round">
        <line x1="90" y1="95" x2="120" y2="125"/>
        <line x1="120" y1="95" x2="90" y2="125"/>
        <line x1="180" y1="95" x2="210" y2="125"/>
        <line x1="210" y1="95" x2="180" y2="125"/>
      </g>
      <!-- Melting smile -->
      <path d="M 85 175 Q 150 250 215 175" fill="none" stroke="#000000" stroke-width="16" stroke-linecap="round"/>
      <!-- Drips -->
      <path d="M 125 210 Q 125 250 135 250 Q 145 250 145 210" fill="#000000"/>
      <path d="M 170 212 Q 170 265 180 265 Q 190 265 190 212" fill="#000000"/>
    </svg>`
  },
  {
    id: 'varsity_arch',
    name: 'Collegiate Athletic Arch',
    category: 'typography',
    tags: ['varsity', 'collegiate', 'athletics', 'arch'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 240" width="450" height="240">
      <defs>
        <path id="archPath" d="M 40 180 A 240 130 0 0 1 410 180"/>
      </defs>
      <text font-family="'Impact', 'Arial Black', sans-serif" font-size="52" font-weight="900" fill="#000000" letter-spacing="4">
        <textPath href="#archPath" startOffset="50%" text-anchor="middle">
          ATHLETICS
        </textPath>
      </text>
      <!-- Star cluster -->
      <g fill="#000000">
        <polygon points="225,145 229,158 242,158 231,166 235,179 225,170 215,179 219,166 208,158 221,158"/>
        <polygon points="175,155 178,164 187,164 180,170 183,179 175,173 167,179 170,170 163,164 172,164" transform="scale(0.8) translate(35, 30)"/>
        <polygon points="275,155 278,164 287,164 280,170 283,179 275,173 267,179 270,170 263,164 272,164" transform="scale(0.8) translate(90, 30)"/>
      </g>
      <text x="225" y="215" font-family="'Courier New', monospace" font-size="22" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="10">PARIS · EST. 1998</text>
    </svg>`
  },
  {
    id: 'cyber_star_cross',
    name: 'Chrome Star Crosshair',
    category: 'cyber',
    tags: ['cross', 'chrome', 'y2k', 'cyber', 'star'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
      <!-- 4-point star -->
      <path d="M 160 20 Q 160 160 20 160 Q 160 160 160 300 Q 160 160 300 160 Q 160 160 160 20 Z" fill="#000000"/>
      <!-- Inner star cutout -->
      <path d="M 160 90 Q 160 160 90 160 Q 160 160 160 230 Q 160 160 230 160 Q 160 160 160 90 Z" fill="#ffffff"/>
      <!-- Center ring -->
      <circle cx="160" cy="160" r="16" fill="#000000"/>
      <!-- Crosshair ticks -->
      <line x1="160" y1="5" x2="160" y2="40" stroke="#000000" stroke-width="4"/>
      <line x1="160" y1="280" x2="160" y2="315" stroke="#000000" stroke-width="4"/>
      <line x1="5" y1="160" x2="40" y2="160" stroke="#000000" stroke-width="4"/>
      <line x1="280" y1="160" x2="315" y2="160" stroke="#000000" stroke-width="4"/>
    </svg>`
  },
  {
    id: 'spec_label',
    name: 'Heavyweight Spec Label',
    category: 'labels',
    tags: ['label', 'spec', 'techpack', 'cotton'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="380" height="260">
      <rect x="8" y="8" width="364" height="244" fill="none" stroke="#000000" stroke-width="4"/>
      <rect x="16" y="16" width="348" height="228" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="6,4"/>
      <text x="30" y="48" font-family="'Courier New', monospace" font-size="13" font-weight="900" fill="#000000">VIRTUAL THREADS / LABELS</text>
      <text x="350" y="48" font-family="'Courier New', monospace" font-size="13" font-weight="900" fill="#000000" text-anchor="end">LOT #048</text>
      <line x1="25" y1="58" x2="355" y2="58" stroke="#000000" stroke-width="2"/>
      
      <text x="30" y="86" font-family="sans-serif" font-size="20" font-weight="900" fill="#000000" letter-spacing="1">HEAVYWEIGHT BLANK</text>
      <text x="30" y="110" font-family="'Courier New', monospace" font-size="11" font-weight="700" fill="#000000">100% COMBED RINGSPUN COTTON · 420 GSM</text>
      <text x="30" y="130" font-family="'Courier New', monospace" font-size="11" font-weight="700" fill="#000000">PRE-SHRUNK · DOUBLE-NEEDLE SEAMING</text>
      
      <line x1="25" y1="146" x2="355" y2="146" stroke="#000000" stroke-width="1"/>
      
      <!-- Care symbols -->
      <g stroke="#000000" stroke-width="2" fill="none" transform="translate(30, 160)">
        <!-- Wash tub -->
        <path d="M 4 8 L 8 28 L 32 28 L 36 8 Z"/>
        <path d="M 4 14 Q 20 20 36 14"/>
        <!-- Triangle -->
        <polygon points="56,28 72,4 88,28" transform="translate(10, 0)"/>
        <!-- Tumble dry -->
        <rect x="120" y="4" width="28" height="24"/>
        <circle cx="134" cy="16" r="10"/>
        <!-- Iron -->
        <path d="M 170 24 L 202 24 C 206 24 208 14 196 14 L 176 14 L 170 24 Z"/>
        <!-- Do not dry clean circle with X -->
        <circle cx="236" cy="16" r="12"/>
        <line x1="228" y1="8" x2="244" y2="24"/>
      </g>
      
      <line x1="25" y1="202" x2="355" y2="202" stroke="#000000" stroke-width="1"/>
      <text x="30" y="224" font-family="'Courier New', monospace" font-size="10" font-weight="700" fill="#000000">DESIGNED IN STUDIO / CRAFTED FOR DURABILITY</text>
      <text x="350" y="224" font-family="'Courier New', monospace" font-size="12" font-weight="900" fill="#000000" text-anchor="end">MADE TO WEAR</text>
    </svg>`
  },
  {
    id: 'world_tour',
    name: 'World Tour Circular Badge',
    category: 'badges',
    tags: ['tour', 'world', 'globe', 'circle', 'badge'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340" width="340" height="340">
      <defs>
        <path id="circlePathTop" d="M 50 170 A 120 120 0 0 1 290 170"/>
        <path id="circlePathBottom" d="M 290 170 A 120 120 0 0 1 50 170"/>
      </defs>
      <circle cx="170" cy="170" r="160" fill="none" stroke="#000000" stroke-width="6"/>
      <circle cx="170" cy="170" r="150" fill="none" stroke="#000000" stroke-width="2"/>
      <circle cx="170" cy="170" r="88" fill="none" stroke="#000000" stroke-width="4"/>
      
      <!-- Globe grid -->
      <circle cx="170" cy="170" r="80" fill="none" stroke="#000000" stroke-width="3"/>
      <line x1="90" y1="170" x2="250" y2="170" stroke="#000000" stroke-width="2"/>
      <line x1="170" y1="90" x2="170" y2="250" stroke="#000000" stroke-width="2"/>
      <ellipse cx="170" cy="170" rx="42" ry="80" fill="none" stroke="#000000" stroke-width="2"/>
      <ellipse cx="170" cy="170" rx="80" ry="40" fill="none" stroke="#000000" stroke-width="2"/>
      
      <text font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#000000" letter-spacing="4">
        <textPath href="#circlePathTop" startOffset="50%" text-anchor="middle">
          ★ WORLD TOUR 2026 ★
        </textPath>
      </text>
      
      <text font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-weight="900" fill="#000000" letter-spacing="3">
        <textPath href="#circlePathBottom" startOffset="50%" text-anchor="middle">
          PARIS · TOKYO · NEW YORK
        </textPath>
      </text>
    </svg>`
  },
  {
    id: 'paris_box_logo',
    name: 'Minimal Paris Atelier Box',
    category: 'typography',
    tags: ['box', 'minimal', 'paris', 'atelier', 'luxury'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 180" width="380" height="180">
      <rect x="6" y="6" width="368" height="168" fill="#000000"/>
      <text x="190" y="70" font-family="'Helvetica Neue', Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">PARIS</text>
      <text x="190" y="105" font-family="'Courier New', monospace" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="6">ATELIER &amp; ARCHIVE</text>
      <line x1="60" y1="120" x2="320" y2="120" stroke="#ffffff" stroke-width="1"/>
      <text x="190" y="145" font-family="'Courier New', monospace" font-size="11" font-weight="600" fill="#cccccc" text-anchor="middle" letter-spacing="4">EDITION NO. 01 / UNISEX</text>
    </svg>`
  },
  {
    id: 'cyber_crosshair_hud',
    name: 'Cyberpunk HUD Reticle',
    category: 'cyber',
    tags: ['hud', 'crosshair', 'cyber', 'target'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <circle cx="150" cy="150" r="120" fill="none" stroke="#000000" stroke-width="4"/>
      <circle cx="150" cy="150" r="90" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="14,10"/>
      <circle cx="150" cy="150" r="50" fill="none" stroke="#000000" stroke-width="2"/>
      <circle cx="150" cy="150" r="8" fill="#000000"/>
      
      <!-- Crosshairs -->
      <line x1="150" y1="10" x2="150" y2="80" stroke="#000000" stroke-width="4"/>
      <line x1="150" y1="220" x2="150" y2="290" stroke="#000000" stroke-width="4"/>
      <line x1="10" y1="150" x2="80" y2="150" stroke="#000000" stroke-width="4"/>
      <line x1="220" y1="150" x2="290" y2="150" stroke="#000000" stroke-width="4"/>
      
      <!-- Corner brackets -->
      <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="#000000" stroke-width="5"/>
      <path d="M 260 70 L 260 40 L 230 40" fill="none" stroke="#000000" stroke-width="5"/>
      <path d="M 40 230 L 40 260 L 70 260" fill="none" stroke="#000000" stroke-width="5"/>
      <path d="M 260 230 L 260 260 L 230 260" fill="none" stroke="#000000" stroke-width="5"/>
      
      <text x="150" y="278" font-family="'Courier New', monospace" font-size="11" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="4">TARGET ACQUIRED // 98.4%</text>
    </svg>`
  }
];

/**
 * Converts raw SVG markup into an HTMLImageElement that can be drawn into canvas.
 */
export function svgToImage(svgString) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(svgString);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ img, dataUrl });
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}
