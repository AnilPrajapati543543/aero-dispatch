import React from 'react';

/**
 * AdminPasscodeBoy - An interactive animated boy mascot illustration
 * States:
 * - 'idle': Looking forward, cheerful smile, waving ("Welcome Sir!")
 * - 'hiding': Hands up covering both eyes, cute blush ("I'm not looking! 🙈")
 * - 'peeking': Hands slightly parted, one eye peeking playfully ("Peeking! 👀")
 */
export default function AdminPasscodeBoy({ state = 'idle', codeLength = 0 }) {
  // Determine mascot mode
  const isHiding = state === 'hiding';
  const isPeeking = state === 'peeking';
  const isIdle = !isHiding && !isPeeking;

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 0.75rem',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Speech / Status Pill */}
      <div
        style={{
          background: isHiding 
            ? 'rgba(239, 68, 68, 0.2)' 
            : isPeeking 
            ? 'rgba(245, 158, 11, 0.2)' 
            : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${
            isHiding ? 'rgba(239, 68, 68, 0.45)' : isPeeking ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.35)'
          }`,
          color: isHiding ? '#FCA5A5' : isPeeking ? '#FCD34D' : '#6EE7B7',
          padding: '3px 12px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          marginBottom: '6px',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        <span>
          {isHiding && '🙈 Hiding eyes from code...'}
          {isPeeking && '👀 Peeking at access code...'}
          {isIdle && (codeLength > 0 ? '🔒 Ready for verification' : '👋 Welcome Sir!')}
        </span>
      </div>

      {/* Interactive Mascot SVG Canvas */}
      <div
        style={{
          width: '120px',
          height: '110px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width="120"
          height="110"
          viewBox="0 0 120 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {/* Subtle Ambient Glow Behind Head */}
          <circle
            cx="60"
            cy="52"
            r="44"
            fill={isHiding ? 'rgba(239, 68, 68, 0.18)' : isPeeking ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)'}
            style={{ transition: 'fill 0.4s ease' }}
          />

          {/* Shoulders & Jacket (Tech Commander Hoodie with Crimson Trim) */}
          <path
            d="M 28 98 C 28 80, 44 76, 60 76 C 76 76, 92 80, 92 98 C 92 104, 28 104, 28 98 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Jacket Collar / Zipper Accent */}
          <path
            d="M 52 76 L 60 88 L 68 76"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="60" y1="88" x2="60" y2="102" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />

          {/* Ears */}
          <circle cx="27" cy="52" r="6" fill="#FBCFE8" stroke="#F472B6" strokeWidth="1.2" />
          <circle cx="93" cy="52" r="6" fill="#FBCFE8" stroke="#F472B6" strokeWidth="1.2" />

          {/* Face (Warm rounded boy skin tone) */}
          <rect
            x="29"
            y="26"
            width="62"
            height="52"
            rx="26"
            fill="#FFE4E6"
            stroke="#F43F5E"
            strokeWidth="1.6"
          />

          {/* Cheerful Hair (Layered Modern Fringe) */}
          <path
            d="M 27 38 C 27 18, 42 10, 60 10 C 78 10, 93 18, 93 38 C 91 32, 85 28, 80 34 C 74 27, 68 25, 60 30 C 53 25, 46 26, 40 33 C 35 28, 29 32, 27 38 Z"
            fill="#1E1B4B"
          />
          {/* Hair Highlight Glint */}
          <path
            d="M 44 18 C 50 14, 68 14, 76 18"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Cute Eyebrows */}
          <path
            d={isHiding ? "M 40 37 Q 45 39 50 37" : "M 40 38 Q 45 35 50 38"}
            stroke="#1E1B4B"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />
          <path
            d={isHiding ? "M 70 37 Q 75 39 80 37" : isPeeking ? "M 70 35 Q 75 33 80 35" : "M 70 38 Q 75 35 80 38"}
            stroke="#1E1B4B"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* Blush Cheeks */}
          <ellipse cx="38" cy="55" rx="5" ry="3" fill="#FDA4AF" opacity="0.6" />
          <ellipse cx="82" cy="55" rx="5" ry="3" fill="#FDA4AF" opacity="0.6" />

          {/* EYES LAYER */}
          {/* Left Eye */}
          <g style={{ transition: 'all 0.3s ease' }}>
            {isHiding ? (
              // Closed eye curve (shy happy closed)
              <path d="M 41 48 Q 46 52 51 48" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : (
              // Open animated sparkling eye
              <>
                <ellipse cx="46" cy="48" rx="4.5" ry="5.5" fill="#0F172A" />
                <circle cx="44.5" cy="46" r="1.8" fill="#FFFFFF" />
                <circle cx="47.5" cy="49.5" r="0.9" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* Right Eye */}
          <g style={{ transition: 'all 0.3s ease' }}>
            {isHiding ? (
              // Closed eye curve
              <path d="M 69 48 Q 74 52 79 48" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : isPeeking ? (
              // Playful peeking wink / wide open eye
              <>
                <ellipse cx="74" cy="48" rx="5" ry="6" fill="#0F172A" />
                <circle cx="72.5" cy="46" r="2" fill="#FFFFFF" />
                <circle cx="75.5" cy="49.5" r="1" fill="#FFFFFF" />
              </>
            ) : (
              // Normal open eye
              <>
                <ellipse cx="74" cy="48" rx="4.5" ry="5.5" fill="#0F172A" />
                <circle cx="72.5" cy="46" r="1.8" fill="#FFFFFF" />
                <circle cx="75.5" cy="49.5" r="0.9" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* Nose */}
          <circle cx="60" cy="53" r="1.4" fill="#F43F5E" />

          {/* Mouth */}
          <path
            d={isHiding ? "M 56 61 Q 60 63 64 61" : isPeeking ? "M 55 60 Q 60 66 65 60" : "M 55 60 Q 60 65 65 60"}
            stroke="#BE123C"
            strokeWidth="2"
            strokeLinecap="round"
            fill={isPeeking ? "#BE123C" : "none"}
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* ========================================================
              ANIMATED HANDS / ARMS ("Boy Hiding From Code")
              ======================================================== */}
          {/* Left Hand & Arm */}
          <g
            style={{
              transform: isHiding 
                ? 'translate(0px, 0px)' 
                : isPeeking 
                ? 'translate(-8px, 6px)' 
                : 'translate(-12px, 24px)',
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Left Arm */}
            <path
              d="M 24 88 C 24 72, 36 60, 44 54"
              stroke="#1E293B"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left Hand Covering Left Eye */}
            <rect
              x="37"
              y="40"
              width="18"
              height="15"
              rx="7.5"
              fill="#FFE4E6"
              stroke="#F43F5E"
              strokeWidth="1.5"
              transform="rotate(-10 46 47)"
            />
            {/* Hand Fingers */}
            <path
              d="M 40 44 L 40 49 M 45 43 L 45 50 M 50 44 L 50 49"
              stroke="#F472B6"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* Right Hand & Arm */}
          <g
            style={{
              transform: isHiding 
                ? 'translate(0px, 0px)' 
                : isPeeking 
                ? 'translate(10px, 14px)' 
                : 'translate(12px, 24px)',
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Right Arm */}
            <path
              d="M 96 88 C 96 72, 84 60, 76 54"
              stroke="#1E293B"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Hand Covering Right Eye */}
            <rect
              x="65"
              y="40"
              width="18"
              height="15"
              rx="7.5"
              fill="#FFE4E6"
              stroke="#F43F5E"
              strokeWidth="1.5"
              transform="rotate(10 74 47)"
            />
            {/* Hand Fingers */}
            <path
              d="M 70 44 L 70 49 M 75 43 L 75 50 M 80 44 L 80 49"
              stroke="#F472B6"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

