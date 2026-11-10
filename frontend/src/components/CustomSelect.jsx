import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * CustomSelect - Adaptive High-Contrast Dropdown Component
 * Automatically switches palettes between Light Mode (crisp white, slate borders, clean typography)
 * and Dark Mode (deep aviation navy, subtle borders, luminous text).
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  style = {},
  menuStyle = {},
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Read theme from context safely
  let theme = 'dark';
  try {
    const app = useApp();
    if (app?.theme) theme = app.theme;
  } catch (e) {}

  // Also verify document body class in case of out-of-react toggle
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('theme-light') || theme === 'light';
    }
    return theme === 'light';
  });

  useEffect(() => {
    const checkTheme = () => {
      const hasLightClass = typeof document !== 'undefined' && document.body.classList.contains('theme-light');
      setIsLightMode(theme === 'light' || hasLightClass);
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [theme]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  // Palette definitions
  const triggerBg = isLightMode ? '#FFFFFF' : '#0D1527';
  const triggerColor = isLightMode ? '#0F172A' : '#F8FAFC';
  const triggerBorder = isOpen 
    ? '#E11D48' 
    : isLightMode ? '#CBD5E1' : 'rgba(255, 255, 255, 0.15)';
  const triggerShadow = isOpen 
    ? (isLightMode ? '0 0 0 3px rgba(225, 29, 72, 0.15)' : '0 0 10px rgba(225, 29, 72, 0.35)') 
    : (isLightMode ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none');
  const chevronColor = isLightMode ? '#64748B' : '#94A3B8';

  const menuBg = isLightMode ? '#FFFFFF' : '#0D1527';
  const menuBorder = isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.15)';
  const menuShadow = isLightMode
    ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
    : '0 12px 32px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)';

  const optionColor = isLightMode ? '#1E293B' : '#F8FAFC';
  const optionHoverBg = isLightMode ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)';
  const selectedBg = '#2563EB';

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: '160px',
        ...style
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className={`custom-select-trigger ${isOpen ? 'is-open' : ''}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: triggerBg,
          color: triggerColor,
          border: `1px solid ${triggerBorder}`,
          borderRadius: '9999px',
          padding: '0.5rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: triggerShadow,
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: triggerColor }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          color={chevronColor}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="custom-select-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '100%',
            background: menuBg,
            border: `1px solid ${menuBorder}`,
            borderRadius: '20px',
            boxShadow: menuShadow,
            zIndex: 9999,
            overflow: 'hidden',
            padding: '6px',
            ...menuStyle
          }}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange({ target: { value: option.value } });
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.55rem 0.9rem',
                  fontSize: '0.82rem',
                  borderRadius: '9999px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  background: isSelected ? selectedBg : 'transparent',
                  color: isSelected ? '#FFFFFF' : optionColor,
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = optionHoverBg;
                    if (isLightMode) e.currentTarget.style.color = '#0F172A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    if (isLightMode) e.currentTarget.style.color = optionColor;
                  }
                }}
              >
                <span style={{ color: isSelected ? '#FFFFFF' : optionColor, whiteSpace: 'nowrap' }}>
                  {option.label}
                </span>
                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
