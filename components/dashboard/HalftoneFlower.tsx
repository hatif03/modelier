"use client";

import { HalftoneCmyk } from "@paper-design/shaders-react";

// Full-bleed background texture, not a corner accent — covers the whole
// page behind the content. The CMYK ink channels are retinted to the brand
// palette (hot pink / blush / ink black) instead of literal
// cyan/magenta/yellow, so this reads as "our pink glow, enhanced" rather
// than a generic print-CMYK swatch. colorBack is transparent so the
// existing .bg-dashboard-glow gradient underneath still shows through the
// gaps between dots.
const HalftoneFlower = () => (
  <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden>
    <HalftoneCmyk
      image="/backgrounds/cosmos.webp"
      width="100%"
      height="100%"
      colorBack="rgba(0, 0, 0, 0)"
      colorC="#FF8FC0"
      colorM="#FF2E7E"
      colorY="#FDFBFA"
      colorK="#0B0A0C"
      size={0.24}
      softness={1}
      type="ink"
      gridNoise={0.15}
      grainSize={0.4}
      gainY={0.05}
      fit="cover"
    />
  </div>
);

export default HalftoneFlower;
