/**
 * AeroDispatch - Enterprise Consignment Sanitizer & Normalizer
 * Purges all historical demo couriers and ensures consistent driver and address structures.
 */

export const REAL_CAPTAIN = {
  driverId: 'DRV-0214',
  id: 'DRV-0214',
  name: 'Captain Rishabh',
  email: 'oldmemories021@gmail.com',
  phone: '+91 98451 90214',
  vehicleNumber: 'MH-02-EV-0214',
  vehicle: 'MH-02-EV-0214',
  rating: 5.0,
  status: 'AVAILABLE'
};

export function isDemoDriver(driver) {
  if (!driver) return false;
  const str = typeof driver === 'string' ? driver : JSON.stringify(driver);
  const lower = str.toLowerCase();
  return (
    lower.includes('8469') ||
    lower.includes('658') ||
    lower.includes('pandey') ||
    lower.includes('90042') ||
    lower.includes('90043') ||
    lower.includes('3051') ||
    lower.includes('aerodispatch.io')
  );
}

export function sanitizeShipment(shipment) {
  if (!shipment || typeof shipment !== 'object') return shipment;

  const s = { ...shipment };

  // 1. Sanitize assigned driver
  if (s.assignedDriver) {
    if (isDemoDriver(s.assignedDriver)) {
      s.assignedDriver = { ...REAL_CAPTAIN };
    } else if (typeof s.assignedDriver === 'object') {
      const d = s.assignedDriver;
      s.assignedDriver = {
        ...d,
        name: String(d.name || 'Captain Rishabh').replace(/^captain\s+/i, 'Captain '),
        phone: (d.phone && !d.phone.includes('9004') && !d.phone.includes('8469')) ? d.phone : REAL_CAPTAIN.phone,
        vehicleNumber: (d.vehicleNumber && !d.vehicleNumber.includes('8469') && !d.vehicleNumber.includes('3051')) ? d.vehicleNumber : (d.vehicle || REAL_CAPTAIN.vehicleNumber),
        driverId: (d.driverId && !d.driverId.includes('8469') && !d.driverId.includes('658')) ? d.driverId : (d.id || REAL_CAPTAIN.driverId)
      };
    } else if (typeof s.assignedDriver === 'string') {
      s.assignedDriver = { ...REAL_CAPTAIN };
    }
  }

  // 2. Sanitize events
  if (Array.isArray(s.events)) {
    s.events = s.events.map(ev => {
      if (!ev) return ev;
      let notes = ev.notes || '';
      let title = ev.title || '';
      if (notes.includes('Pandey') || notes.includes('8469') || notes.includes('9004')) {
        notes = notes.replace(/Pandey/gi, '').replace(/DRV-8469/gi, 'DRV-0214').replace(/9004\d+/g, '98451 90214');
      }
      if (title.includes('Pandey')) {
        title = title.replace(/Pandey/gi, '');
      }
      return { ...ev, notes, title };
    });
  }

  return s;
}

export function sanitizeShipmentList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeShipment);
}
