/**
 * AeroDispatch - Parcel Consignment Utilities & HD Imagery
 */

export const HD_PARCEL_PHOTOS = [
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80', // Corrugated parcel box with barcode
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80', // Parcel boxes on warehouse shelf
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80', // Express courier package handover
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80', // Logistics cargo container boxes
  'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80', // Sealed express delivery package
  'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80', // Eco-friendly corrugated package
];

/**
 * Deterministically returns a high-resolution consignment parcel photo.
 * Prioritizes uploaded proof photos or parcel photos, otherwise uses AWB hash.
 */
export function getConsignmentPhoto(shipment) {
  if (!shipment) return HD_PARCEL_PHOTOS[0];

  if (shipment.proofOfDelivery?.photoUrl) {
    return shipment.proofOfDelivery.photoUrl;
  }
  if (shipment.parcelPhotoUrl) {
    return shipment.parcelPhotoUrl;
  }

  const key = (shipment.awbNumber || shipment.orderId || shipment.id || 'AD-0001').toString();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return HD_PARCEL_PHOTOS[hash % HD_PARCEL_PHOTOS.length];
}

/**
 * Format currency in Indian Rupees
 */
export function formatINR(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

