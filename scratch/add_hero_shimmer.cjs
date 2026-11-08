const fs = require('fs');
const cssPath = 'c:/Users/user/Desktop/MyUp/src/App.css';
let content = fs.readFileSync(cssPath, 'utf8');

const shimmerCss = `
/* Shimmer Skeleton for Station Detail Hero (Yaltiroq fon) */
.sd-hero-shimmer-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.sd-hero-shimmer-wave {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(56, 189, 248, 0.22) 40%,
    rgba(56, 189, 248, 0.45) 50%,
    rgba(56, 189, 248, 0.22) 60%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: sdHeroShimmerAnim 1.6s infinite ease-in-out;
  transform: skewX(-20deg);
}

@keyframes sdHeroShimmerAnim {
  0% { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(150%) skewX(-20deg); }
}

.sd-hero-shimmer-badge {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.35);
  padding: 6px 14px;
  border-radius: 20px;
  color: #38bdf8;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.sd-hero-shimmer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf8;
  animation: mapPingRing 1.2s infinite ease-in-out;
}

.sd-hero-image.is-loading {
  opacity: 0;
}

.sd-hero-image.is-loaded {
  opacity: 1;
  transition: opacity 0.35s ease-in;
}
`;

const needle = '.sd-hero-media {';
const pos = content.indexOf(needle);
if (pos !== -1) {
  content = content.slice(0, pos) + shimmerCss + '\n' + content.slice(pos);
  fs.writeFileSync(cssPath, content, 'utf8');
  console.log('Successfully inserted shimmer CSS before .sd-hero-media');
} else {
  console.log('Needle not found');
}
