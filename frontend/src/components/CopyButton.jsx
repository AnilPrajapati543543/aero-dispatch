import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  size = 'md', // 'sm' | 'md'
  className = '',
  style = {},
  title = 'Copy to clipboard'
}) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useApp() || {};

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        if (addToast) addToast(`Copied ${text} to clipboard!`, 'info');
        setTimeout(() => setCopied(false), 1800);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      if (addToast) addToast(`Copied ${text} to clipboard!`, 'info');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      if (addToast) addToast('Could not copy to clipboard', 'warning');
    }
  };

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 11 : 12;

  return (
    <button
      type="button"
      className={`btn-copy ${isSmall ? 'btn-copy-sm' : ''} ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard' : title}
      aria-label={`Copy ${text}`}
      style={style}
    >
      {copied ? (
        <Check size={iconSize} color="var(--accent-emerald)" />
      ) : (
        <Copy size={iconSize} />
      )}
      {label && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}

