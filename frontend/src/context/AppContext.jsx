import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_SHIPMENTS, MOCK_USERS, MOCK_ADMIN_METRICS, MOCK_DRIVERS, MOCK_HUBS } from '../data/mockShipments';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [shipments, setShipments] = useState(() => {
    const saved = localStorage.getItem('aerodispatch_shipments');
    return saved ? JSON.parse(saved) : MOCK_SHIPMENTS;
  });

  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'driver' | 'admin'
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'customer', 'admin', 'driver', 'create-order', 'track', 'order-details', 'auth'
  const [selectedAwb, setSelectedAwb] = useState('AD-8849-2041');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  // Sync shipments to localStorage so edits survive reloads
  useEffect(() => {
    try {
      localStorage.setItem('aerodispatch_shipments', JSON.stringify(shipments));
    } catch (e) {
      console.warn("Storage quota exceeded or storage disabled", e);
    }
  }, [shipments]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'customer') setActiveTab('customer');
    else if (newRole === 'driver') setActiveTab('driver');
    else if (newRole === 'admin') setActiveTab('admin');
    addToast(`Switched active workspace role to: ${newRole.toUpperCase()}`, 'info');
  };

  // Add a newly created consignment (with Delhivery-style AWB number)
  const addShipment = (formData) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomMid = Math.floor(1000 + Math.random() * 9000);
    const awb = `AD-${randomMid}-${randomSuffix}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newShipment = {
      id: awb,
      awbNumber: awb,
      barcode: "||| ||| | |||| | ||| ||",
      serviceTier: formData.serviceTier || "AeroExpress Air",
      currentStatus: "BOOKED",
      paymentMode: formData.paymentMode || "Prepaid",
      declaredValue: Number(formData.declaredValue) || 1500,
      createdAt: now.toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(),
      currentLocation: `${formData.senderCity || 'Origin'}, Booking Station`,
      weightKg: Number(formData.weightKg) || 1.0,
      dimensions: `${formData.length || 20} x ${formData.width || 15} x ${formData.height || 10} cm`,
      category: formData.category || "General Parcel",
      sender: {
        name: formData.senderName || "Enterprise Merchant",
        facility: "Registered Dispatch Node",
        city: formData.senderCity || "New Delhi",
        state: formData.senderState || "Delhi",
        pinCode: formData.senderPin || "110001",
        phone: formData.senderPhone || "+91 98000 00000",
        address: formData.senderAddress || "Logistics Hub Lane"
      },
      recipient: {
        name: formData.recipientName || "Valued Consignee",
        city: formData.recipientCity || "Bengaluru",
        state: formData.recipientState || "Karnataka",
        pinCode: formData.recipientPin || "560001",
        phone: formData.recipientPhone || "+91 99000 00000",
        address: formData.recipientAddress || "Delivery Address St."
      },
      assignedDriver: null,
      proofOfDelivery: null,
      events: [
        {
          id: `ev-${Date.now()}`,
          status: "BOOKED",
          title: "Consignment Manifested & Booked",
          location: `${formData.senderCity || 'Origin'} Hub`,
          timestamp: formattedDate,
          notes: "Digital Air Waybill created. Awaiting first-mile pickup manifest."
        }
      ]
    };

    setShipments(prev => [newShipment, ...prev]);
    setSelectedAwb(awb);
    addToast(`Consignment ${awb} registered successfully! (Phase 1 Local Mock State)`, 'success');
    return newShipment;
  };

  // Update status (e.g. driver delivery action or admin status override)
  const updateShipmentStatus = (awbNumber, nextStatus, customNotes = '', proofData = null) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
                          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let title = "Status Updated";
    let location = "Regional Distribution Point";

    if (nextStatus === 'OUT_FOR_DELIVERY') {
      title = "Out for Delivery with Associate";
      location = "Destination City Delivery Station";
    } else if (nextStatus === 'DELIVERED') {
      title = "Package Delivered Successfully";
      location = "Consignee Address";
    } else if (nextStatus === 'FAILED_ATTEMPT') {
      title = "Delivery Attempt Unsuccessful";
      location = "Consignee Address";
    } else if (nextStatus === 'IN_TRANSIT') {
      title = "Dispatched on Linehaul Transit";
      location = "Regional Transit Corridor";
    }

    setShipments(prev => prev.map(ship => {
      if (ship.awbNumber === awbNumber) {
        const newEvent = {
          id: `ev-${Date.now()}`,
          status: nextStatus,
          title,
          location,
          timestamp: formattedDate,
          notes: customNotes || `Status advanced to ${nextStatus}`
        };

        return {
          ...ship,
          currentStatus: nextStatus,
          proofOfDelivery: proofData || ship.proofOfDelivery,
          events: [...ship.events, newEvent]
        };
      }
      return ship;
    }));

    addToast(`Shipment ${awbNumber} updated to ${nextStatus}`, 'success');
  };

  const resetToDefaultMock = () => {
    setShipments(MOCK_SHIPMENTS);
    localStorage.removeItem('aerodispatch_shipments');
    addToast('Restored default Phase 1 mock logistics database.', 'info');
  };

  const currentUser = MOCK_USERS[currentRole];

  return (
    <AppContext.Provider
      value={{
        shipments,
        currentRole,
        switchRole,
        currentUser,
        activeTab,
        setActiveTab,
        selectedAwb,
        setSelectedAwb,
        trackingQuery,
        setTrackingQuery,
        toasts,
        addToast,
        removeToast,
        addShipment,
        updateShipmentStatus,
        resetToDefaultMock,
        drivers: MOCK_DRIVERS,
        hubs: MOCK_HUBS,
        metrics: MOCK_ADMIN_METRICS
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
