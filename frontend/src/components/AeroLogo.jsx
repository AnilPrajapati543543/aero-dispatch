import React, { useState } from 'react';
export default function AeroLogo({
  size = 'md',
  animated = true,
  showSubtitle = true,
  showText = true,
  subtitle = '',
  className = '',
  onClick = null
}) {
  const [animIteration, setAnimIteration] = useState(0);

  // Proportional sizing matching 425x285 aspect ratio (~1.49:1)
  const sizeMap = {
    sm: { width: 68, height: 46, subSize: '0.55rem' },
    md: { width: 88, height: 59, subSize: '0.62rem' },
    lg: { width: 145, height: 97, subSize: '0.72rem' },
    xl: { width: 220, height: 147, subSize: '0.82rem' },
    hero: { width: 340, height: 228, subSize: '0.95rem' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const displaySubtitle = showSubtitle && showText;

  const handleClick = (e) => {
    // Replay arrival animation sequence on click
    setAnimIteration(prev => prev + 1);
    if (onClick) onClick(e);
  };

  return (
    <div
      className={`aero-brand-container ${className} clickable`}
      onClick={handleClick}
      title="AeroDispatch - Multi-Modal Logistics (Click to replay animation)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        userSelect: 'none',
        cursor: 'pointer',
        textDecoration: 'none'
      }}
    >
      {/* 
        The Unified Logo Emblem:
        Contains the circular crest AND the tightly arched AERODISPATCH text in one unified SVG,
        exactly like the user's reference image!
      */}
      <div
        key={animIteration}
        className={`aero-logo-emblem-wrapper ${animated ? 'is-animated' : ''}`}
        style={{
          width: currentSize.width,
          height: currentSize.height,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <svg
          viewBox="70 20 425 285"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          role="img"
          aria-label="AeroDispatch Multi-Modal Logo"
        >
          <defs>
            {/* 
              Calibrated Text Arc Path:
              Hugs the bottom of the black circular crest with a tight, uniform ~10px gap,
              sweeping symmetrically from X=85, Y=118 on the left to X=479, Y=118 on the right.
            */}
            <path id={`aeroCalibratedArc-${size}`} d="M 85 118 A 195 190 0 0 0 479 118" fill="none" />

            {/* Crimson Red Gradient for Vehicles & Typography */}
            <linearGradient id="aeroCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="45%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>

            {/* Obsidian Black for Circular Swooshes */}
            <linearGradient id="aeroObsidianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E2330" />
              <stop offset="60%" stopColor="#0B0D14" />
              <stop offset="100%" stopColor="#050608" />
            </linearGradient>
          </defs>

          {/* ROOT EMBLEM GROUP WITH SPRING POP-UP ENTRANCE */}
          <g className="aero-crest-root">

            {/* =========================================================================
                1. CIRCULAR SWOOSH FRAME (Black & Red Outer Crescents)
                ========================================================================= */}
            <g className="aero-swoosh-layer">
              {/* Left circular swoosh arc curving around ship and over top */}
              <path
                d="M 235 220 
                   C 200 200 196 150 198 120 
                   C 200 70 238 36 295 34 
                   C 330 33 360 48 376 72 
                   C 358 58 326 50 295 52 
                   C 250 54 218 80 216 122 
                   C 214 156 228 194 252 210 Z"
                fill="url(#aeroObsidianGrad)"
                stroke="#050608"
                strokeWidth="1.5"
                className="swoosh-left-arc"
              />

              {/* Right circular swoosh arc wrapping behind truck trailer */}
              <path
                d="M 374 85 
                   C 392 110 398 152 386 188 
                   C 376 215 350 236 312 244 
                   C 342 234 366 210 376 184 
                   C 386 150 380 118 366 94 Z"
                fill="url(#aeroObsidianGrad)"
                stroke="#050608"
                strokeWidth="1.5"
                className="swoosh-right-arc"
              />

              {/* Lower Red Accent Curve */}
              <path
                d="M 276 236 
                   C 305 236 338 224 356 200 
                   C 342 216 314 228 284 228 
                   C 268 228 252 222 240 214 
                   C 250 226 264 236 276 236 Z"
                fill="url(#aeroCrimsonGrad)"
                className="swoosh-red-accent"
              />
            </g>

            {/* =========================================================================
                2. CARGO VESSEL / SHIP (Arrives from Left - Midground)
                ========================================================================= */}
            <g className="aero-ship-group">
              {/* Twin Funnels / Smokestacks */}
              <path d="M 264 104 L 268 90 L 278 90 L 276 104 Z" fill="#0A0B0E" />
              <rect x="267" y="92" width="10" height="3" fill="#DC2626" />
              <path d="M 280 104 L 283 94 L 290 94 L 288 104 Z" fill="#0A0B0E" opacity="0.8" />

              {/* White Pilot House / Superstructure Bridge */}
              <path
                d="M 226 120 L 232 100 L 272 100 L 274 120 Z"
                fill="#FFFFFF"
                stroke="#0A0B0E"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Bridge Windows */}
              <rect x="236" y="106" width="6" height="4" rx="1" fill="#0A0B0E" />
              <rect x="246" y="106" width="6" height="4" rx="1" fill="#0A0B0E" />
              <rect x="256" y="106" width="6" height="4" rx="1" fill="#0A0B0E" />

              {/* Upper Promenade Deck */}
              <path
                d="M 212 132 L 219 120 L 280 120 L 280 132 Z"
                fill="#FFFFFF"
                stroke="#0A0B0E"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <line x1="220" y1="125" x2="274" y2="125" stroke="#0A0B0E" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Main Ship Hull (Crimson Red with Angled Bow at X=168, Y=154) */}
              <path
                d="M 162 138 
                   L 288 138 
                   L 278 190 
                   L 200 190 
                   C 186 190 172 175 166 156 Z"
                fill="url(#aeroCrimsonGrad)"
                stroke="#0A0B0E"
                strokeWidth="3.5"
                strokeLinejoin="round"
                className="ship-hull"
              />

              {/* White Gunwale / Deck Line Stripe */}
              <path d="M 164 139 L 286 139 L 284 147 L 170 147 Z" fill="#FFFFFF" />

              {/* Waterline Bow Wake Splash */}
              <path
                d="M 154 160 Q 166 154 178 162 T 204 160"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
                className="ship-bow-wake"
              />
            </g>

            {/* =========================================================================
                3. CARGO TRAILER BOX (Behind Truck Cab)
                ========================================================================= */}
            <g className="aero-trailer-group">
              <rect
                x="290"
                y="122"
                width="56"
                height="66"
                rx="2"
                fill="#0A0B0E"
                stroke="#0A0B0E"
                strokeWidth="3"
              />
              {/* Horizontal White Corrugated Slats (Exact match to reference image) */}
              <g stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" className="trailer-slats">
                <line x1="295" y1="130" x2="342" y2="130" />
                <line x1="295" y1="137" x2="342" y2="137" />
                <line x1="295" y1="144" x2="342" y2="144" />
                <line x1="295" y1="151" x2="342" y2="151" />
                <line x1="295" y1="158" x2="342" y2="158" />
                <line x1="295" y1="165" x2="342" y2="165" />
                <line x1="295" y1="172" x2="342" y2="172" />
                <line x1="295" y1="179" x2="342" y2="179" />
              </g>
              {/* Rear Tandem Road Wheels */}
              <circle cx="307" cy="193" r="9.5" fill="#0A0B0E" stroke="#DC2626" strokeWidth="2.5" />
              <circle cx="307" cy="193" r="4" fill="#FFFFFF" />
              <circle cx="329" cy="193" r="9.5" fill="#0A0B0E" stroke="#DC2626" strokeWidth="2.5" />
              <circle cx="329" cy="193" r="4" fill="#FFFFFF" />
            </g>

            {/* =========================================================================
                4. HEAVY LOGISTICS TRUCK (Foreground Star)
                ========================================================================= */}
            <g className="aero-truck-group">
              {/* Truck Cab Main Body (Crimson Red) */}
              <path
                d="M 268 124 
                   C 276 124 290 126 293 134 
                   L 299 152 
                   L 299 200 
                   L 290 200 
                   C 288 191 278 185 268 185 
                   C 258 185 250 191 248 200 
                   L 236 200 
                   C 232 200 230 195 230 187 
                   L 230 171 
                   C 230 165 236 158 244 155 
                   L 259 149 
                   L 262 128 
                   C 263 125 265 124 268 124 Z"
                fill="url(#aeroCrimsonGrad)"
                stroke="#0A0B0E"
                strokeWidth="3.5"
                strokeLinejoin="round"
                className="truck-cab"
              />

              {/* Windshield Glass (White Panes) */}
              <path d="M 266 128 L 290 128 L 293 145 L 262 145 Z" fill="#FFFFFF" stroke="#0A0B0E" strokeWidth="2.5" />
              <line x1="278" y1="128" x2="278" y2="145" stroke="#0A0B0E" strokeWidth="1.8" />

              {/* Side Driver Window */}
              <path d="M 246 152 L 259 147 L 259 160 L 242 160 Z" fill="#FFFFFF" stroke="#0A0B0E" strokeWidth="2" />
              {/* Side Mirror */}
              <rect x="236" y="149" width="4" height="11" rx="1" fill="#0A0B0E" />

              {/* Hood Cowl & Front Fender Arc */}
              <path d="M 242 159 L 287 159 L 289 173 L 238 173 Z" fill="#B91C1C" stroke="#0A0B0E" strokeWidth="2.5" />

              {/* Chrome/White Radiator Grille with Horizontal Louvers */}
              <rect x="244" y="169" width="36" height="27" rx="3.5" fill="#FFFFFF" stroke="#0A0B0E" strokeWidth="3" className="truck-grille" />
              <g stroke="#DC2626" strokeWidth="2.4" strokeLinecap="round">
                <line x1="249" y1="174" x2="275" y2="174" />
                <line x1="249" y1="179" x2="275" y2="179" />
                <line x1="249" y1="184" x2="275" y2="184" />
                <line x1="249" y1="189" x2="275" y2="189" />
              </g>

              {/* Heavy Duty Front Bumper */}
              <rect x="236" y="196" width="50" height="8.5" rx="2" fill="#FFFFFF" stroke="#0A0B0E" strokeWidth="2.5" />
              {/* High-Intensity Headlights */}
              <rect x="238" y="197" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#0A0B0E" strokeWidth="1.2" className="headlight-left" />
              <rect x="278" y="197" width="6" height="5.5" rx="1.5" fill="#FEF08A" stroke="#0A0B0E" strokeWidth="1.2" className="headlight-right" />

              {/* Front Steer Road Wheel */}
              <circle cx="268" cy="197" r="10.5" fill="#0A0B0E" stroke="#DC2626" strokeWidth="3" />
              <circle cx="268" cy="197" r="4.5" fill="#FFFFFF" />
            </g>

            {/* =========================================================================
                5. CARGO JET AIRPLANE (Top Right Sky)
                ========================================================================= */}
            <g className="aero-plane-group">
              <g transform="translate(280, 56) rotate(-16)">
                <path d="M 28 8 L 6 -20 L 18 -20 L 38 6 Z" fill="#991B1B" stroke="#0A0B0E" strokeWidth="1.2" />
                <ellipse cx="14" cy="-8" rx="5" ry="2.2" fill="#0A0B0E" stroke="#DC2626" strokeWidth="0.8" />

                {/* Airplane Fuselage (Nose at X=374, Y=78) */}
                <path
                  d="M -2 10 
                     C 7 10 18 9 32 6 
                     L 60 1 
                     C 68 -1 72 -4 74 -5 
                     C 72 -5 63 -2 53 0 
                     L 24 3 
                     L 0 5 Z"
                  fill="url(#aeroCrimsonGrad)"
                  stroke="#0A0B0E"
                  strokeWidth="1.5"
                  className="plane-fuselage"
                />
                {/* Foreground Swept Wing */}
                <path d="M 25 5 L 44 34 L 33 36 L 13 7 Z" fill="url(#aeroCrimsonGrad)" stroke="#0A0B0E" strokeWidth="1.6" className="plane-wing-front" />
                <ellipse cx="27" cy="18" rx="6.5" ry="3" fill="#0A0B0E" stroke="#DC2626" strokeWidth="1.2" />
                <ellipse cx="29" cy="18" rx="2.5" ry="1.6" fill="#FFFFFF" />

                {/* Vertical Tailfin Stabilizer */}
                <path d="M 2 5 L -9 -17 L 2 -17 L 11 4 Z" fill="url(#aeroCrimsonGrad)" stroke="#0A0B0E" strokeWidth="1.2" />
                <path d="M 0 6 L -7 17 L -1 17 L 5 7 Z" fill="#991B1B" />
                {/* Cockpit Canopy Line */}
                <path d="M 60 0 L 66 -3" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />

                {/* Jet Speed Vapor Streamers */}
                <line x1="-12" y1="-16" x2="-32" y2="-16" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" strokeDasharray="4 3" className="plane-trail" />
                <line x1="30" y1="38" x2="14" y2="44" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" strokeDasharray="4 3" className="plane-trail" />
              </g>
            </g>

            {/* =========================================================================
                6. CURVED BRAND TYPOGRAPHY: AERODISPATCH
                Tightly hugging the bottom contour with exact proportional spacing (like reference)
                ========================================================================= */}
            <g className="aero-text-arc-group">
              <text
                className="aero-arched-title"
                fontFamily="'Inter', 'Montserrat', 'Arial Black', system-ui, sans-serif"
                fontWeight="900"
                fontSize="34"
                fill="#B91C1C"
                letterSpacing="5"
              >
                <textPath href={`#aeroCalibratedArc-${size}`} startOffset="50%" textAnchor="middle">
                  AERODISPATCH
                </textPath>
              </text>
            </g>

          </g>
        </svg>
      </div>

      {/* Optional Sleek Operational Badge (Never duplicate "AeroDispatch" text) */}
      {displaySubtitle && subtitle && (
        <div
          className="aero-brand-status-pill desktop-only"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 9px',
            borderRadius: '9999px',
            background: 'rgba(225, 29, 72, 0.08)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            fontSize: currentSize.subSize,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            whiteSpace: 'nowrap'
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 6px var(--primary)'
            }}
          />
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
