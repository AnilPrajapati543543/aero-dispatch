import React from 'react';

/**
 * AdminPasscodeBoy - A funny, expressive animated cartoon mascot
 * States:
 * - 'idle': Friendly cartoon smile, blinking, waving gently ("Hey there! What's the secret PIN? 🤫")
 * - 'hiding': Both hands up covering eyes, wiggling fingers, blushing ("I'm not looking, I swear! 🙈")
 * - 'peeking': One eye peeking through fingers with pupil darting, cheeky smirk ("Oho, peeking at the PIN? 👀")
 * - 'wrong': Head wobble, spiral dizzy eyes, bouncing sweat drop ("Oops! Incorrect PIN... Please try again 😅")
 * - 'success': Cheering with hands in the air, smiling eyes, spinning stars ("Boom! You're in! 🚀")
 */
export default function AdminPasscodeBoy({ state = 'idle', codeLength = 0, hasError = false }) {
  const isWrong = hasError || state === 'wrong';
  const isSuccess = state === 'success' || state === 'celebrating';
  const isPeeking = !isWrong && !isSuccess && state === 'peeking';
  const isHiding = !isWrong && !isSuccess && (state === 'hiding' || (!isPeeking && codeLength > 0));
  const isIdle = !isWrong && !isSuccess && !isPeeking && !isHiding;

  return (
    <div
      className="admin-passcode-mascot"
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
      {/* Keyframe Animations */}
      <style>{`
        @keyframes mascotBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.08); }
        }
        @keyframes mascotHandWiggle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-1.5px) rotate(-1.5deg); }
          75% { transform: translateY(1.5px) rotate(1.5deg); }
        }
        @keyframes mascotPeekingPupil {
          0%, 100% { transform: translateX(0px); }
          35% { transform: translateX(3.5px); }
          70% { transform: translateX(-2.5px); }
        }
        @keyframes mascotDizzyHead {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg) translateX(-4px); }
          40% { transform: rotate(8deg) translateX(4px); }
          60% { transform: rotate(-5deg) translateX(-2px); }
          80% { transform: rotate(5deg) translateX(2px); }
        }
        @keyframes mascotSweatDrop {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.95; }
          50% { transform: translateY(5px) scale(1.15); opacity: 1; }
        }
        @keyframes mascotCheerBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-7px) scale(1.04); }
        }
        @keyframes mascotStarTwinkle {
          0%, 100% { transform: scale(0.7) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.15) rotate(180deg); opacity: 1; }
        }
        @keyframes mascotPupilSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .admin-mascot-blinking {
          transform-origin: 50% 50%;
          animation: mascotBlink 3.6s infinite ease-in-out;
        }
      `}</style>

      {/* Funny Interactive Speech Bubble */}
      <div
        style={{
          background: isWrong
            ? 'rgba(239, 68, 68, 0.22)'
            : isSuccess
              ? 'rgba(16, 185, 129, 0.22)'
              : isPeeking
                ? 'rgba(245, 158, 11, 0.22)'
                : isHiding
                  ? 'rgba(239, 68, 68, 0.18)'
                  : 'rgba(59, 130, 246, 0.18)',
          border: `1.5px solid ${isWrong
              ? 'rgba(239, 68, 68, 0.55)'
              : isSuccess
                ? 'rgba(16, 185, 129, 0.55)'
                : isPeeking
                  ? 'rgba(245, 158, 11, 0.55)'
                  : isHiding
                    ? 'rgba(239, 68, 68, 0.45)'
                    : 'rgba(59, 130, 246, 0.4)'
            }`,
          color: isWrong
            ? '#FCA5A5'
            : isSuccess
              ? '#6EE7B7'
              : isPeeking
                ? '#FCD34D'
                : isHiding
                  ? '#FCA5A5'
                  : '#93C5FD',
          padding: '4px 14px',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          marginBottom: '8px',
          transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <span>
          {isWrong && "Oops! Incorrect PIN... Please try again 😅"}
          {isSuccess && "Boom! You're in! 🚀"}
          {isPeeking && "Oho, peeking at the PIN? 👀"}
          {isHiding && "I'm not looking, I swear! 🙈"}
          {isIdle && "Hey Admin! What's the secret PIN? 🤫"}
        </span>
      </div>

      {/* Mascot Canvas */}
      <div
        style={{
          width: '130px',
          height: '115px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width="130"
          height="115"
          viewBox="0 0 130 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            overflow: 'visible',
            animation: isWrong
              ? 'mascotDizzyHead 0.5s ease-in-out infinite'
              : isSuccess
                ? 'mascotCheerBounce 0.6s ease-in-out infinite'
                : 'none'
          }}
        >
          {/* Ambient Glow */}
          <circle
            cx="65"
            cy="55"
            r="46"
            fill={
              isWrong
                ? 'rgba(239, 68, 68, 0.2)'
                : isSuccess
                  ? 'rgba(16, 185, 129, 0.22)'
                  : isPeeking
                    ? 'rgba(245, 158, 11, 0.2)'
                    : isHiding
                      ? 'rgba(239, 68, 68, 0.16)'
                      : 'rgba(59, 130, 246, 0.15)'
            }
            style={{ transition: 'fill 0.3s ease' }}
          />

          {/* Golden Stars when Successful */}
          {isSuccess && (
            <>
              <g style={{ transformOrigin: '22px 28px', animation: 'mascotStarTwinkle 1s ease-in-out infinite' }}>
                <path d="M 22 23 L 24 27 L 28 28 L 24 30 L 22 34 L 20 30 L 16 28 L 20 27 Z" fill="#FBBF24" />
              </g>
              <g style={{ transformOrigin: '108px 26px', animation: 'mascotStarTwinkle 1.2s ease-in-out infinite 0.3s' }}>
                <path d="M 108 21 L 110 25 L 114 26 L 110 28 L 108 32 L 106 28 L 102 26 L 106 25 Z" fill="#FBBF24" />
              </g>
            </>
          )}

          {/* Sweat Drop when Wrong PIN */}
          {isWrong && (
            <g style={{ animation: 'mascotSweatDrop 0.8s ease-in-out infinite' }}>
              <path
                d="M 98 32 C 98 28, 104 22, 104 22 C 104 22, 110 28, 110 32 C 110 35.5, 107.5 38, 104 38 C 100.5 38, 98 35.5, 98 32 Z"
                fill="#38BDF8"
                stroke="#0284C7"
                strokeWidth="1.2"
              />
              <circle cx="102" cy="30" r="1.2" fill="#FFFFFF" />
            </g>
          )}

          {/* Shoulders & Jacket (Tech hoodie with red collar) */}
          <path
            d="M 30 102 C 30 84, 48 80, 65 80 C 82 80, 100 84, 100 102 C 100 108, 30 108, 30 102 Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="2.2"
          />
          {/* Jacket Zipper & Crimson Collar */}
          <path
            d="M 57 80 L 65 91 L 73 80"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="65" y1="91" x2="65" y2="106" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />

          {/* Ears */}
          <circle cx="28" cy="56" r="6.5" fill="#FFE4E6" stroke="#F43F5E" strokeWidth="1.4" />
          <circle cx="102" cy="56" r="6.5" fill="#FFE4E6" stroke="#F43F5E" strokeWidth="1.4" />

          {/* Face (Cute rounded cartoon head) */}
          <rect
            x="32"
            y="28"
            width="66"
            height="56"
            rx="28"
            fill="#FFE4E6"
            stroke="#F43F5E"
            strokeWidth="1.8"
          />

          {/* Cheerful Hair Tuft */}
          <path
            d="M 30 42 C 30 20, 46 12, 65 12 C 84 12, 100 20, 100 42 C 98 35, 92 30, 86 36 C 80 28, 73 26, 65 31 C 57 26, 50 28, 44 35 C 38 30, 32 35, 30 42 Z"
            fill="#1E1B4B"
          />
          {/* Hair Highlight Glint */}
          <path
            d="M 48 20 C 55 16, 74 16, 82 20"
            stroke="#818CF8"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Cute Eyebrows */}
          <path
            d={
              isWrong
                ? "M 44 42 Q 49 46 54 43"
                : isPeeking
                  ? "M 44 41 Q 49 43 54 41"
                  : isHiding
                    ? "M 44 39 Q 49 42 54 39"
                    : "M 44 39 Q 49 36 54 39"
            }
            stroke="#1E1B4B"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.25s ease' }}
          />
          <path
            d={
              isWrong
                ? "M 76 43 Q 81 46 86 42"
                : isPeeking
                  ? "M 76 36 Q 81 33 86 36" // Raised arched eyebrow for peeking!
                  : isHiding
                    ? "M 76 39 Q 81 42 86 39"
                    : "M 76 39 Q 81 36 86 39"
            }
            stroke="#1E1B4B"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.25s ease' }}
          />

          {/* Bright Rosy Blush Cheeks */}
          <ellipse
            cx="41"
            cy="60"
            rx={isHiding ? 7 : 5}
            ry={isHiding ? 4.5 : 3}
            fill="#FDA4AF"
            opacity={isHiding ? 0.9 : 0.65}
            style={{ transition: 'all 0.3s ease' }}
          />
          <ellipse
            cx="89"
            cy="60"
            rx={isHiding ? 7 : 5}
            ry={isHiding ? 4.5 : 3}
            fill="#FDA4AF"
            opacity={isHiding ? 0.9 : 0.65}
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* ========================================================
              EYES LAYER (Expression Changes)
              ======================================================== */}
          {/* LEFT EYE */}
          <g>
            {isWrong ? (
              // Spiral dizzy swirl
              <g style={{ transformOrigin: '49px 52px', animation: 'mascotPupilSpin 1.2s linear infinite' }}>
                <path
                  d="M 49 52 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0"
                  stroke="#BE123C"
                  strokeWidth="1.8"
                  fill="none"
                />
                <circle cx="49" cy="52" r="2" fill="#BE123C" />
              </g>
            ) : isSuccess ? (
              // Happy crescent eye (^_^)
              <path d="M 43 53 Q 49 46 55 53" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : isHiding ? (
              // Closed shy eye underneath hands
              <path d="M 44 52 Q 49 56 54 52" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : (
              // Normal cartoon glossy blinking eye
              <g className="admin-mascot-blinking" style={{ transformOrigin: '49px 52px' }}>
                <ellipse cx="49" cy="52" rx="4.8" ry="6" fill="#0F172A" />
                <circle cx="47.2" cy="49.8" r="2" fill="#FFFFFF" />
                <circle cx="50.8" cy="53.8" r="1" fill="#FFFFFF" />
              </g>
            )}
          </g>

          {/* RIGHT EYE */}
          <g>
            {isWrong ? (
              // Spiral dizzy swirl
              <g style={{ transformOrigin: '81px 52px', animation: 'mascotPupilSpin 1.2s linear infinite reverse' }}>
                <path
                  d="M 81 52 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0"
                  stroke="#BE123C"
                  strokeWidth="1.8"
                  fill="none"
                />
                <circle cx="81" cy="52" r="2" fill="#BE123C" />
              </g>
            ) : isSuccess ? (
              // Happy crescent eye (^_^)
              <path d="M 75 53 Q 81 46 87 53" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : isPeeking ? (
              // Huge wide-open cartoon eye peeking at the PIN with darting pupil!
              <g>
                <ellipse cx="81" cy="51" rx="6.5" ry="7.5" fill="#0F172A" />
                <g style={{ animation: 'mascotPeekingPupil 1.2s ease-in-out infinite' }}>
                  <circle cx="80" cy="49" r="2.6" fill="#FFFFFF" />
                  <circle cx="83" cy="53" r="1.3" fill="#FFFFFF" />
                </g>
              </g>
            ) : isHiding ? (
              // Closed shy eye underneath hands
              <path d="M 76 52 Q 81 56 86 52" stroke="#1E1B4B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            ) : (
              // Normal cartoon glossy blinking eye
              <g className="admin-mascot-blinking" style={{ transformOrigin: '81px 52px' }}>
                <ellipse cx="81" cy="52" rx="4.8" ry="6" fill="#0F172A" />
                <circle cx="79.2" cy="49.8" r="2" fill="#FFFFFF" />
                <circle cx="82.8" cy="53.8" r="1" fill="#FFFFFF" />
              </g>
            )}
          </g>

          {/* Cute Nose */}
          <circle cx="65" cy="57" r="1.6" fill="#F43F5E" />

          {/* Mouth (Dynamic Expression) */}
          {isWrong ? (
            // Squiggly distressed mouth
            <path
              d="M 59 66 Q 62 63 65 66 Q 68 69 71 66"
              stroke="#BE123C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          ) : isSuccess ? (
            // Big laughing open mouth with tongue
            <g>
              <path
                d="M 58 64 Q 65 74 72 64 Z"
                fill="#BE123C"
                stroke="#881337"
                strokeWidth="1.5"
              />
              <path
                d="M 61 68 Q 65 66 69 68 Q 65 74 61 68 Z"
                fill="#FDA4AF"
              />
            </g>
          ) : isPeeking ? (
            // Cheeky side-smirk
            <path
              d="M 60 66 Q 66 70 73 64"
              stroke="#BE123C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          ) : isHiding ? (
            // Cute shy "O" mouth or tight silly smile
            <ellipse cx="65" cy="66" rx="3.5" ry="3.5" fill="#BE123C" />
          ) : (
            // Friendly cartoon smile
            <path
              d="M 59 64 Q 65 70 71 64"
              stroke="#BE123C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* ========================================================
              ANIMATED HANDS & ARMS
              - Idle: Resting cheerfully
              - Hiding: Covering both eyes with wiggling fingers!
              - Peeking: Left hand covers eye, Right hand lowered
              - Wrong: Hands holding cheeks in silly panic!
              - Success: Both arms shooting up in the air!
              ======================================================== */}
          {/* LEFT HAND & ARM */}
          <g
            style={{
              transform: isSuccess
                ? 'translate(-4px, -18px) rotate(-35deg)'
                : isWrong
                  ? 'translate(6px, -2px) rotate(15deg)'
                  : (isHiding || isPeeking)
                    ? 'translate(0px, 0px)'
                    : 'translate(-8px, 22px)',
              transformOrigin: '26px 88px',
              transition: 'transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1)'
            }}
          >
            {/* Arm */}
            <path
              d="M 26 94 C 26 76, 38 60, 48 54"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand with Wiggle Animation when Hiding */}
            <g
              style={{
                animation: isHiding ? 'mascotHandWiggle 0.5s ease-in-out infinite' : 'none',
                transformOrigin: '48px 51px'
              }}
            >
              <rect
                x="38"
                y="43"
                width="20"
                height="16"
                rx="8"
                fill="#FFE4E6"
                stroke="#F43F5E"
                strokeWidth="1.6"
                transform="rotate(-8 48 51)"
              />
              {/* Cute finger lines */}
              <line x1="42" y1="47" x2="42" y2="52" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="47" y1="46" x2="47" y2="53" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="52" y1="47" x2="52" y2="52" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          </g>

          {/* RIGHT HAND & ARM */}
          <g
            style={{
              transform: isSuccess
                ? 'translate(4px, -18px) rotate(35deg)'
                : isWrong
                  ? 'translate(-6px, -2px) rotate(-15deg)'
                  : isPeeking
                    ? 'translate(12px, 16px) rotate(20deg)' // Lowered to peek!
                    : isHiding
                      ? 'translate(0px, 0px)'
                      : 'translate(8px, 22px)',
              transformOrigin: '104px 88px',
              transition: 'transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1)'
            }}
          >
            {/* Arm */}
            <path
              d="M 104 94 C 104 76, 92 60, 82 54"
              stroke="#1E293B"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand with Wiggle Animation when Hiding */}
            <g
              style={{
                animation: isHiding ? 'mascotHandWiggle 0.5s ease-in-out infinite 0.1s' : 'none',
                transformOrigin: '82px 51px'
              }}
            >
              <rect
                x="72"
                y="43"
                width="20"
                height="16"
                rx="8"
                fill="#FFE4E6"
                stroke="#F43F5E"
                strokeWidth="1.6"
                transform="rotate(8 82 51)"
              />
              {/* Cute finger lines */}
              <line x1="78" y1="47" x2="78" y2="52" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="83" y1="46" x2="83" y2="53" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="88" y1="47" x2="88" y2="52" stroke="#F472B6" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
