/**
 * User formatting utilities for AeroDispatch.
 * Ensures clean, professional human display names across all dashboards and navigation.
 * Guarantees that raw emails (e.g. anilprajapati543543@gmail.com) are NEVER rendered as user names.
 */

// Common name dictionary for intelligent splitting of single-word email handles
const KNOWN_NAMES = [
  'anil', 'prajapati', 'darshan', 'patel', 'rishabh', 'rahul', 'sharma', 
  'amit', 'kumar', 'vikram', 'singh', 'rohit', 'verma', 'priya', 'gupta', 'neha',
  'john', 'smith', 'david', 'miller', 'alex', 'walker', 'michael', 'brown', 'chris'
];

/**
 * Intelligently formats an email username handle into a clean Full Name (e.g. "anilprajapati543" -> "Anil Prajapati")
 */
function splitEmailHandleIntoName(handle) {
  if (!handle) return 'Operator';

  // 1. Strip all digits and special characters
  let clean = handle.toLowerCase().replace(/[0-9_.-]/g, ' ').trim();
  if (!clean) return 'Operator';

  // If already contains spaces, capitalize words
  if (clean.includes(' ')) {
    return clean.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // 2. Check for known name substrings (e.g. "anilprajapati" -> "anil" + "prajapati")
  for (const first of KNOWN_NAMES) {
    if (clean.startsWith(first) && clean.length > first.length) {
      const rest = clean.slice(first.length);
      for (const last of KNOWN_NAMES) {
        if (rest === last || rest.startsWith(last)) {
          return `${first.charAt(0).toUpperCase() + first.slice(1)} ${rest.charAt(0).toUpperCase() + rest.slice(1)}`;
        }
      }
      return `${first.charAt(0).toUpperCase() + first.slice(1)} ${rest.charAt(0).toUpperCase() + rest.slice(1)}`;
    }
  }

  // 3. Fallback: Capitalize word
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Returns a human-friendly display name guaranteed free of '@' and '.com'.
 */
export function getCleanDisplayName(user, role = null) {
  if (!user) {
    if (role === 'admin') return 'System Administrator';
    if (role === 'driver') return 'Fleet Captain';
    return 'Valued Merchant';
  }

  const rawName = typeof user === 'string' ? user : (user.name || '');
  const email = typeof user === 'object' ? (user.email || '') : '';
  const effectiveRole = (typeof user === 'object' ? user.role : null) || role;

  // 1. If rawName is already a clean name (no '@' and no '.com' and length > 1)
  if (rawName && !rawName.includes('@') && !rawName.toLowerCase().includes('.com') && rawName.trim().length > 1) {
    const trimmed = rawName.trim();
    if (effectiveRole === 'driver' && !trimmed.toLowerCase().startsWith('captain')) {
      return `Captain ${trimmed}`;
    }
    return trimmed;
  }

  // 2. Check localStorage saved profiles & registrations
  if (typeof localStorage !== 'undefined' && email) {
    const emailLower = email.toLowerCase().trim();
    try {
      const profs = JSON.parse(localStorage.getItem('aerodispatch_user_profiles') || '{}');
      if (profs[emailLower]?.name && !profs[emailLower].name.includes('@')) {
        const pName = profs[emailLower].name.trim();
        return effectiveRole === 'driver' && !pName.toLowerCase().startsWith('captain') ? `Captain ${pName}` : pName;
      }
    } catch (e) {}

    try {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      const found = reg.find(u => u.email?.toLowerCase() === emailLower);
      if (found?.name && !found.name.includes('@')) {
        const rName = found.name.trim();
        return effectiveRole === 'driver' && !rName.toLowerCase().startsWith('captain') ? `Captain ${rName}` : rName;
      }
    } catch (e) {}
  }

  // 3. Fallbacks based on role
  if (effectiveRole === 'admin') {
    return 'System Administrator';
  }
  if (effectiveRole === 'driver') {
    return 'Fleet Captain';
  }

  // 4. Derive from email handle
  const targetEmail = email || (rawName.includes('@') ? rawName : '');
  if (targetEmail) {
    const handle = targetEmail.split('@')[0];
    const derived = splitEmailHandleIntoName(handle);
    return effectiveRole === 'driver' && !derived.toLowerCase().startsWith('captain')
      ? `Captain ${derived}`
      : derived;
  }

  return 'Valued Merchant';
}

