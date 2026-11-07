/**
 * Utility functions for compressing, caching, and persisting profile photos
 * safely within browser localStorage quotas (<25KB per avatar).
 */

export function compressAvatarImage(source, maxWidth = 320, maxHeight = 320, quality = 0.85) {
  return new Promise((resolve) => {
    if (!source) return resolve(null);

    const processImg = (img) => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width || 320;
        let height = img.naturalHeight || img.height || 320;

        // Center-crop to square
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        const targetSize = Math.min(maxWidth, minDim > 0 ? minDim : 320);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(typeof source === 'string' ? source : null);

        // DO NOT fill dark background! Preserve transparent alpha channel!
        ctx.clearRect(0, 0, targetSize, targetSize);

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        // Use webp or png to preserve transparency without dark fill
        let compressed = null;
        try {
          compressed = canvas.toDataURL('image/webp', quality);
        } catch (e) {}
        if (!compressed || !compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/png');
        }
        resolve(compressed);
      } catch (err) {
        console.warn('Avatar compression error:', err);
        resolve(typeof source === 'string' ? source : null);
      }
    };

    if (typeof source === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processImg(img);
      img.onerror = () => resolve(source);
      img.src = source;
    } else if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImg(img);
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(source);
    } else {
      resolve(null);
    }
  });
}

export function getPersistentAvatar(email, role) {
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanRole = role ? role.toLowerCase().trim() : '';

    // 1. Direct email standalone key
    if (cleanEmail) {
      const direct = localStorage.getItem(`aerodispatch_avatar_${cleanEmail}`);
      if (direct) return direct;
    }

    // 2. Persistent avatar vault
    const vault = JSON.parse(localStorage.getItem('aerodispatch_persistent_avatars') || '{}');
    if (cleanEmail && vault[cleanEmail]) return vault[cleanEmail];
    if (cleanRole && vault[cleanRole]) return vault[cleanRole];

    // 3. Direct role standalone key
    if (cleanRole) {
      const roleDirect = localStorage.getItem(`aerodispatch_avatar_${cleanRole}`);
      if (roleDirect) return roleDirect;
    }

    // 4. Registered users table
    if (cleanEmail) {
      const reg = JSON.parse(localStorage.getItem('aerodispatch_registered_users') || '[]');
      const found = reg.find(u => u.email?.toLowerCase() === cleanEmail);
      if (found?.avatarUrl) return found.avatarUrl;
    }

    // 5. Driver list if driver
    if (cleanRole === 'driver' || cleanEmail.includes('driver')) {
      const drivers = JSON.parse(localStorage.getItem('aerodispatch_fleet_drivers') || '[]');
      const foundDrv = drivers.find(d => d.email?.toLowerCase() === cleanEmail || d.id === 'DRV-8469');
      if (foundDrv?.avatarUrl) return foundDrv.avatarUrl;
    }

    // 6. Global fallback
    return vault['last_uploaded_avatar'] || localStorage.getItem('aerodispatch_avatar_latest') || null;
  } catch (e) {
    return null;
  }
}

export function savePersistentAvatar(email, role, avatarDataUrl) {
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanRole = role ? role.toLowerCase().trim() : '';
    const vault = JSON.parse(localStorage.getItem('aerodispatch_persistent_avatars') || '{}');

    if (avatarDataUrl) {
      if (cleanEmail) {
        vault[cleanEmail] = avatarDataUrl;
        try { localStorage.setItem(`aerodispatch_avatar_${cleanEmail}`, avatarDataUrl); } catch (e) {}
      }
      if (cleanRole) {
        vault[cleanRole] = avatarDataUrl;
        try { localStorage.setItem(`aerodispatch_avatar_${cleanRole}`, avatarDataUrl); } catch (e) {}
      }
      vault['last_uploaded_avatar'] = avatarDataUrl;
      try { localStorage.setItem('aerodispatch_avatar_latest', avatarDataUrl); } catch (e) {}
    } else {
      if (cleanEmail) {
        delete vault[cleanEmail];
        try { localStorage.removeItem(`aerodispatch_avatar_${cleanEmail}`); } catch (e) {}
      }
      if (cleanRole) {
        delete vault[cleanRole];
        try { localStorage.removeItem(`aerodispatch_avatar_${cleanRole}`); } catch (e) {}
      }
      if (vault['last_uploaded_avatar'] === avatarDataUrl) {
        delete vault['last_uploaded_avatar'];
      }
      try { localStorage.removeItem('aerodispatch_avatar_latest'); } catch (e) {}
    }
    localStorage.setItem('aerodispatch_persistent_avatars', JSON.stringify(vault));
  } catch (e) {
    console.warn("Storage warning in savePersistentAvatar:", e);
  }
}

/**
 * Intelligent client-side background removal for portrait profile photos.
 * Samples background seeds (sky, borders) and isolates the foreground subject
 * with smooth alpha edge feathering.
 */
export function removeImageBackground(sourceDataUrl, tolerance = 42) {
  return new Promise((resolve) => {
    if (!sourceDataUrl) return resolve(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width || 320;
        const h = img.naturalHeight || img.height || 320;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(sourceDataUrl);

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample background seeds from top, top-left, top-right, left, right edges
        const seedPoints = [
          [0, 0],
          [w - 1, 0],
          [Math.floor(w / 2), 0],
          [0, Math.floor(h * 0.25)],
          [w - 1, Math.floor(h * 0.25)],
          [Math.floor(w * 0.25), 0],
          [Math.floor(w * 0.75), 0]
        ];

        const bgSamples = [];
        seedPoints.forEach(([x, y]) => {
          const idx = (y * w + x) * 4;
          bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
        });

        // Compute average background color
        const avgR = bgSamples.reduce((s, c) => s + c[0], 0) / bgSamples.length;
        const avgG = bgSamples.reduce((s, c) => s + c[1], 0) / bgSamples.length;
        const avgB = bgSamples.reduce((s, c) => s + c[2], 0) / bgSamples.length;

        // Color distance helper
        function colorDist(r, g, b, r2, g2, b2) {
          const dr = r - r2;
          const dg = g - g2;
          const db = b - b2;
          return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
        }

        // Flood-fill / border connectivity mask
        const isBg = new Uint8Array(w * h);
        const queue = [];

        // Initialize queue with perimeter pixels matching bg
        for (let x = 0; x < w; x++) {
          const idxTop = (0 * w + x) * 4;
          if (colorDist(data[idxTop], data[idxTop + 1], data[idxTop + 2], avgR, avgG, avgB) < tolerance * 1.5) {
            isBg[0 * w + x] = 1;
            queue.push(x, 0);
          }
          const idxBot = ((h - 1) * w + x) * 4;
          if (colorDist(data[idxBot], data[idxBot + 1], data[idxBot + 2], avgR, avgG, avgB) < tolerance) {
            isBg[(h - 1) * w + x] = 1;
            queue.push(x, h - 1);
          }
        }
        for (let y = 0; y < h; y++) {
          const idxLeft = (y * w + 0) * 4;
          if (colorDist(data[idxLeft], data[idxLeft + 1], data[idxLeft + 2], avgR, avgG, avgB) < tolerance * 1.3) {
            isBg[y * w + 0] = 1;
            queue.push(0, y);
          }
          const idxRight = (y * w + (w - 1)) * 4;
          if (colorDist(data[idxRight], data[idxRight + 1], data[idxRight + 2], avgR, avgG, avgB) < tolerance * 1.3) {
            isBg[y * w + (w - 1)] = 1;
            queue.push(w - 1, y);
          }
        }

        // BFS flood fill from background perimeter
        let head = 0;
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];

        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];
          const cIdx = (cy * w + cx) * 4;
          const cr = data[cIdx];
          const cg = data[cIdx + 1];
          const cb = data[cIdx + 2];

          for (let i = 0; i < 4; i++) {
            const nx = cx + dx[i];
            const ny = cy + dy[i];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nPos = ny * w + nx;
              if (!isBg[nPos]) {
                const nIdx = nPos * 4;
                const distToSeed = colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2], avgR, avgG, avgB);
                const distToNeighbor = colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2], cr, cg, cb);

                if (distToSeed < tolerance * 1.4 && distToNeighbor < tolerance * 0.9) {
                  isBg[nPos] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        // Apply transparency and smooth edge feathering
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pos = y * w + x;
            const idx = pos * 4;
            if (isBg[pos]) {
              data[idx + 3] = 0; // Transparent
            } else {
              let neighborBgCount = 0;
              for (let i = 0; i < 4; i++) {
                const nx = x + dx[i];
                const ny = y + dy[i];
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBg[ny * w + nx]) {
                  neighborBgCount++;
                }
              }
              if (neighborBgCount > 0) {
                data[idx + 3] = Math.round(data[idx + 3] * (1 - neighborBgCount * 0.2));
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const resultPng = canvas.toDataURL('image/png');
        resolve(resultPng);
      } catch (err) {
        console.warn("Background removal error:", err);
        resolve(sourceDataUrl);
      }
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
}

