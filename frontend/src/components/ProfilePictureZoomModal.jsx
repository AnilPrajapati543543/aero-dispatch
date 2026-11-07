import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft,
  Camera, 
  Download, 
  Trash2, 
  Plus, 
  Minus, 
  RotateCw, 
  RotateCcw,
  Sparkles,
  Wand2,
  RefreshCw,
  Check
} from 'lucide-react';
import { compressAvatarImage, removeImageBackground } from '../utils/avatarUtils';

export default function ProfilePictureZoomModal({
  isOpen,
  onClose,
  user,
  avatarUrl,
  onUploadNewPhoto,
  onRemovePhoto
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState('natural'); // 'natural' | 'circle'
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [hasCutout, setHasCutout] = useState(false);
  const fileInputRef = useRef(null);

  // Reset transforms whenever modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setOriginalPhoto(null);
      setHasCutout(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.75, Number((prev - 0.25).toFixed(2))));
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // WhatsApp-style double-click toggle (100% <-> 180%)
  const handleDoubleClick = () => {
    if (zoomLevel > 1.1) {
      handleReset();
    } else {
      setZoomLevel(1.8);
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Trigger file download
  const handleDownload = () => {
    if (!avatarUrl) return;
    const a = document.createElement('a');
    a.href = avatarUrl;
    const cleanName = (user?.name || 'profile').toLowerCase().replace(/\s+/g, '_');
    a.download = `${cleanName}_avatar.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // File upload handler with automatic high-compression to ~20KB
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file, 320, 320, 0.85);
      if (compressed && onUploadNewPhoto) {
        onUploadNewPhoto(compressed);
        setOriginalPhoto(null);
        setHasCutout(false);
      }
    } catch (err) {
      console.warn("Avatar compression failed:", err);
    }
    if (e.target) e.target.value = '';
  };

  // One-click intelligent background removal
  const handleRemoveBackground = async () => {
    if (!avatarUrl || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      if (!originalPhoto) {
        setOriginalPhoto(avatarUrl);
      }
      const cutout = await removeImageBackground(avatarUrl, 42);
      if (cutout && onUploadNewPhoto) {
        onUploadNewPhoto(cutout);
        setHasCutout(true);
      }
    } catch (err) {
      console.warn("Background removal error:", err);
    } finally {
      setIsRemovingBg(false);
    }
  };

  // Restore original background if user desires
  const handleRestoreOriginal = () => {
    if (originalPhoto && onUploadNewPhoto) {
      onUploadNewPhoto(originalPhoto);
      setHasCutout(false);
    }
  };

  const userRole = user?.role || 'customer';
  const roleTitle = userRole === 'admin' 
    ? 'Operations Command' 
    : userRole === 'driver' 
    ? 'Courier Associate' 
    : 'Verified Merchant';

  const roleBadgeColor = userRole === 'admin' ? '#EF4444' : userRole === 'driver' ? '#F59E0B' : '#25D366';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        // Translucent frosted glass backdrop - NEVER pitch black opaque void
        background: 'rgba(11, 20, 26, 0.65)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'pageFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. WhatsApp Top Navigation Bar */}
      <header
        style={{
          height: '64px',
          background: 'rgba(17, 27, 33, 0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          zIndex: 10
        }}
      >
        {/* Left: WhatsApp Back Button & User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title="Back (Esc)"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Mini Thumbnail */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'transparent',
              border: `2px solid ${roleBadgeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || 'User'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#E9EDEF', fontWeight: 800, fontSize: '1.1rem' }}>
                {user?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>

          {/* User Name & Details */}
          <div>
            <div style={{ color: '#E9EDEF', fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
              {user?.name || 'Profile Photo'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.78rem', color: '#8696A0' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: roleBadgeColor,
                  display: 'inline-block'
                }}
              />
              <span style={{ textTransform: 'capitalize', color: roleBadgeColor, fontWeight: 700 }}>
                {userRole}
              </span>
              <span>•</span>
              <span>{roleTitle}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* REMOVE BACKGROUND BUTTON */}
          {avatarUrl && (
            hasCutout ? (
              <button
                type="button"
                onClick={handleRestoreOriginal}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#F8FAFC',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title="Restore original photo background"
              >
                <RefreshCw size={14} />
                <span>Restore BG</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={isRemovingBg}
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.2) 0%, rgba(18, 140, 126, 0.3) 100%)',
                  border: '1px solid rgba(37, 211, 102, 0.45)',
                  color: '#25D366',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: isRemovingBg ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(37, 211, 102, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Remove photo background (Transparent Cutout)"
              >
                <Wand2 size={14} className={isRemovingBg ? 'pulse' : ''} />
                <span>{isRemovingBg ? 'Removing...' : 'Remove BG'}</span>
              </button>
            )
          )}

          {/* 1. Change / Upload Photo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title="Change photo"
          >
            <Camera size={20} />
          </button>

          {/* 2. Download HD Photo */}
          {avatarUrl && (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8696A0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#E9EDEF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#8696A0';
              }}
              title="Download photo"
            >
              <Download size={20} />
            </button>
          )}

          {/* 3. Remove Photo */}
          {avatarUrl && onRemovePhoto && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Remove your profile photo?')) {
                  onRemovePhoto();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title="Remove photo"
            >
              <Trash2 size={20} />
            </button>
          )}

          {/* 4. Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title="Close (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {/* 2. Center Main Canvas */}
      <main
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          padding: '2rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || 'Profile Avatar'}
              draggable={false}
              style={{
                width: 'min(82vw, 420px)',
                height: 'min(82vw, 420px)',
                borderRadius: shape === 'circle' ? '50%' : '14px',
                objectFit: 'contain',
                // NO forced dark background! Completely transparent
                background: 'transparent',
                // Clean subtle soft shadow instead of heavy pitch black
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                pointerEvents: 'none'
              }}
            />
          ) : (
            <div
              style={{
                width: 'min(82vw, 380px)',
                height: 'min(82vw, 380px)',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                padding: '2rem',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `3px solid ${roleBadgeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: '#E9EDEF'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>

              <div>
                <div style={{ color: '#E9EDEF', fontSize: '1.15rem', fontWeight: 700 }}>
                  No Profile Photo Set
                </div>
                <div style={{ color: '#8696A0', fontSize: '0.85rem', marginTop: '4px' }}>
                  Add a photo to personalize your dispatch profile
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#25D366',
                  color: '#0B141A',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 22px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={18} />
                <span>Add Profile Photo</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. Floating Bottom Action Pill */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 1rem 1.5rem',
          zIndex: 10
        }}
      >
        <div
          style={{
            background: 'rgba(32, 44, 51, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(134, 150, 160, 0.25)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
            borderRadius: '9999px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.75}
            style={{
              background: 'transparent',
              border: 'none',
              color: zoomLevel <= 0.75 ? '#536471' : '#E9EDEF',
              cursor: zoomLevel <= 0.75 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (zoomLevel > 0.75) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Zoom Out (-)"
          >
            <Minus size={16} />
          </button>

          {/* Zoom Level Indicator / Reset Click */}
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E9EDEF',
              fontSize: '0.82rem',
              fontWeight: 700,
              minWidth: '54px',
              textAlign: 'center',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px'
            }}
            title="Click to Reset to 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            style={{
              background: 'transparent',
              border: 'none',
              color: zoomLevel >= 3.5 ? '#536471' : '#E9EDEF',
              cursor: zoomLevel >= 3.5 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (zoomLevel < 3.5) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Zoom In (+)"
          >
            <Plus size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(134, 150, 160, 0.3)', margin: '0 2px' }} />

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title="Reset Zoom & Rotation"
          >
            <RotateCcw size={15} />
          </button>

          {/* Rotate 90° */}
          <button
            type="button"
            onClick={handleRotate}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title="Rotate 90°"
          >
            <RotateCw size={15} />
          </button>

          {/* Toggle Shape (Natural Full Photo <-> Circle) */}
          <button
            type="button"
            onClick={() => setShape(prev => prev === 'natural' ? 'circle' : 'natural')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '0.75rem',
              fontWeight: 800,
              transition: 'background 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#E9EDEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8696A0';
            }}
            title={`Toggle between ${shape === 'natural' ? 'Circular' : 'Natural Full'} frame`}
          >
            {shape === 'natural' ? '◯' : '▢'}
          </button>
        </div>
      </footer>
    </div>
  );
}
