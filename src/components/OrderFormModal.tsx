import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  User,
  ShoppingBag,
  Sparkles,
  Info,
  Search,
  Check,
  ChevronDown,
  Settings,
  Navigation,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Order, OrderItem, QuickFruitItem, StockItem, DeliverySlot, PaymentMethod, PaymentStatus, OrderStatus, Prospect, Profile, Zone } from '../types';
import { calculateAutomaticDeliverySlot, formatRupiah, formatDateIso } from '../lib/orderScheduleUtils';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { ManageFruitsModal } from './ManageFruitsModal';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editOrder?: Order | null;
  prospects: Prospect[];
  zones: Zone[];
  couriers: Profile[]; // Any staff that can deliver (Qinoi, Fajri, Hendra, Dimas, etc.)
  stockItems?: StockItem[];
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editOrder,
  prospects,
  zones,
  couriers,
  stockItems: propStockItems,
}) => {
  const { currentUser, isOwner, isManager, isSales } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const isOrderLockedForSales = isSales && !!editOrder && (editOrder.status === 'Selesai' || editOrder.status === 'Dibatalkan');

  const [selectedProspectId, setSelectedProspectId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { id: 'item-1', item_name: '', quantity: 1, unit: 'kg', price: 0, subtotal: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Belum Lunas');
  const [status, setStatus] = useState<OrderStatus>('Diterima');
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('08:00 - 10:00');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [courierId, setCourierId] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [autoSlotReason, setAutoSlotReason] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fruit catalog & warehouse stock management states
  const [customFruits, setCustomFruits] = useState<QuickFruitItem[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<StockItem[]>(
    propStockItems && propStockItems.length > 0 ? propStockItems : []
  );
  const [isManageFruitsModalOpen, setIsManageFruitsModalOpen] = useState(false);

  useEffect(() => {
    if (propStockItems && propStockItems.length > 0) {
      setWarehouseStock(propStockItems);
    }
  }, [propStockItems]);

  const loadStockAndFruits = async () => {
    try {
      const [fruits, stocks] = await Promise.all([
        db.getQuickFruits(),
        db.getStockItems(),
      ]);
      setCustomFruits(fruits || []);
      if (stocks && stocks.length > 0) {
        setWarehouseStock(stocks);
      } else if (propStockItems && propStockItems.length > 0) {
        setWarehouseStock(propStockItems);
      } else {
        setWarehouseStock([]);
      }
    } catch {
      if (propStockItems && propStockItems.length > 0) {
        setWarehouseStock(propStockItems);
      } else {
        setWarehouseStock([]);
      }
    }
  };

  // Unified list of inventory fruits for quick selection chips
  const inventoryFruitChips = useMemo(() => {
    const list: { id: string; name: string; unit: string; price: number; emoji: string; stock: number }[] = [];
    const seen = new Set<string>();

    for (const s of warehouseStock) {
      const key = s.fruit_name.toLowerCase().trim();
      seen.add(key);
      const cf = customFruits.find((f) => f.name.toLowerCase().trim() === key);
      list.push({
        id: s.id,
        name: s.fruit_name,
        unit: s.unit || 'kg',
        price: s.latest_selling_price || cf?.price || 0,
        emoji: s.emoji || cf?.emoji || '🍊',
        stock: s.current_stock,
      });
    }

    for (const f of customFruits) {
      if (f.is_active !== false) {
        const key = f.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: f.id,
            name: f.name,
            unit: f.unit || 'kg',
            price: f.price || 0,
            emoji: f.emoji || '🍊',
            stock: 0,
          });
        }
      }
    }

    return list;
  }, [warehouseStock, customFruits]);

  // Searchable customer dropdown states & refs
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const [allProspects, setAllProspects] = useState<Prospect[]>(prospects || []);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Sync prospects or fetch all CRM customers if parent prop is empty
  useEffect(() => {
    if (isOpen) {
      if (prospects && prospects.length > 0) {
        setAllProspects(prospects);
      } else {
        db.getAllProspects()
          .then((list) => {
            if (list && list.length > 0) setAllProspects(list);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, prospects]);

  // Click-outside handler for customer search dropdown (no blocking screen overlay)
  useEffect(() => {
    if (!isCustomerDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

  // Form field initialization: ONLY runs once when modal opens, NEVER on async stock updates
  useEffect(() => {
    if (isOpen) {
      loadStockAndFruits();
      if (!isInitializedRef.current) {
        if (editOrder) {
          setSelectedProspectId(editOrder.prospect_id || '');
          setCustomerName(editOrder.customer_name);
          setCustomerPhone(editOrder.customer_phone);
          setDeliveryAddress(editOrder.delivery_address);
          setZoneId(editOrder.zone_id || '');
          setLatitude(editOrder.latitude ?? null);
          setLongitude(editOrder.longitude ?? null);
          setItems(editOrder.order_items && editOrder.order_items.length > 0 ? editOrder.order_items : [
            { id: 'item-1', item_name: editOrder.items_summary || 'Pesanan Buah', quantity: 1, unit: 'pack', price: editOrder.total_amount, subtotal: editOrder.total_amount }
          ]);
          setPaymentMethod(editOrder.payment_method);
          setPaymentStatus(editOrder.payment_status);
          setStatus(editOrder.status);
          setDeliverySlot(editOrder.delivery_slot);
          setDeliveryDate(editOrder.delivery_date);
          setCourierId(editOrder.courier_id || '');
          setCustomerNotes(editOrder.customer_notes || '');
          setAutoSlotReason('');
        } else {
          // Automatically calculate delivery slot by current time
          const auto = calculateAutomaticDeliverySlot();
          setDeliverySlot(auto.slot);
          setDeliveryDate(auto.deliveryDate);
          setAutoSlotReason(auto.reason);

          // Reset fields for new order
          setSelectedProspectId('');
          setCustomerName('');
          setCustomerPhone('');
          setDeliveryAddress('');
          setZoneId('');
          setLatitude(null);
          setLongitude(null);
          const initialFruit = warehouseStock[0] || (customFruits.length > 0 ? {
            id: customFruits[0].id,
            fruit_name: customFruits[0].name,
            unit: customFruits[0].unit,
            current_stock: 0,
            canvas_allocated_stock: 0,
            min_stock_alert: 10,
            avg_cost_price: 0,
            latest_selling_price: customFruits[0].price,
          } as StockItem : null);
          setItems([
            {
              id: 'item-1',
              item_name: initialFruit ? initialFruit.fruit_name : '',
              quantity: 1,
              unit: initialFruit ? initialFruit.unit : 'kg',
              price: initialFruit ? (initialFruit.latest_selling_price || 0) : 0,
              subtotal: initialFruit ? (initialFruit.latest_selling_price || 0) : 0,
            },
          ]);
          setPaymentMethod('Tunai');
          setPaymentStatus('Belum Lunas');
          setStatus('Diterima');
          setCourierId('');
          setCustomerNotes('');
          setCustomerSearchQuery('');
          setIsCustomerDropdownOpen(false);
        }
        isInitializedRef.current = true;
      }
    } else {
      isInitializedRef.current = false;
      setIsCustomerDropdownOpen(false);
      setCustomerSearchQuery('');
    }
  }, [isOpen, editOrder?.id]);

  // Combined prospects list for searching
  const prospectsSource = allProspects.length > 0 ? allProspects : prospects;

  // Filter prospects based on typed search query (business name, PIC, phone, or address)
  const filteredProspects = useMemo(() => {
    if (!customerSearchQuery.trim()) return prospectsSource;
    const q = customerSearchQuery.toLowerCase().trim();
    return prospectsSource.filter((p) => {
      return (
        (p.business_name && p.business_name.toLowerCase().includes(q)) ||
        (p.pic_name && p.pic_name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    });
  }, [prospectsSource, customerSearchQuery]);

  const selectedProspect = prospectsSource.find((p) => p.id === selectedProspectId);

  if (!isOpen) return null;

  // Handle choosing existing prospect/customer to auto-fill details
  const handleSelectProspect = (pId: string) => {
    setSelectedProspectId(pId);
    if (!pId) return;
    const target = prospects.find((p) => p.id === pId);
    if (target) {
      setCustomerName(target.business_name);
      setCustomerPhone(target.phone);
      setDeliveryAddress(target.address);
      if (target.zone_id) setZoneId(target.zone_id);
      if (target.latitude && target.longitude) {
        setLatitude(target.latitude);
        setLongitude(target.longitude);
      } else {
        setLatitude(null);
        setLongitude(null);
      }
      if (target.potential_needs) {
        setCustomerNotes(`Catatan prospek: ${target.potential_needs}`);
      }
    }
  };

  const handleCaptureCurrentGps = () => {
    if (!navigator.geolocation) {
      toastError('Perangkat ini tidak mendukung deteksi GPS.');
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsCapturingGps(false);
        toastSuccess('Titik GPS pengantaran berhasil diperbarui dari lokasi saat ini!');
      },
      (err) => {
        setIsCapturingGps(false);
        toastError(`Gagal mendeteksi titik GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleAddItem = () => {
    const chosenNames = new Set(items.map((i) => i.item_name.toLowerCase().trim()));
    const unchosen = warehouseStock.find(
      (s) => !chosenNames.has(s.fruit_name.toLowerCase().trim())
    );
    const nextFruit = unchosen || warehouseStock[0] || (customFruits[0] ? {
      id: customFruits[0].id,
      fruit_name: customFruits[0].name,
      unit: customFruits[0].unit,
      current_stock: 0,
      canvas_allocated_stock: 0,
      min_stock_alert: 10,
      avg_cost_price: 0,
      latest_selling_price: customFruits[0].price,
    } as StockItem : null);
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        item_name: nextFruit ? nextFruit.fruit_name : '',
        quantity: 1,
        unit: nextFruit ? nextFruit.unit : 'kg',
        price: nextFruit ? (nextFruit.latest_selling_price || 0) : 0,
        subtotal: nextFruit ? (nextFruit.latest_selling_price || 0) : 0,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      const fallbackFruit = warehouseStock[0] || null;
      setItems([
        {
          id: `item-${Date.now()}`,
          item_name: fallbackFruit ? fallbackFruit.fruit_name : '',
          quantity: 1,
          unit: fallbackFruit ? fallbackFruit.unit : 'kg',
          price: fallbackFruit ? (fallbackFruit.latest_selling_price || 0) : 0,
          subtotal: fallbackFruit ? (fallbackFruit.latest_selling_price || 0) : 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectWarehouseFruit = (idx: number, fruitName: string) => {
    if (!fruitName) return;
    const targetName = fruitName.toLowerCase().trim();
    const exact = warehouseStock.find(
      (s) => s.fruit_name.toLowerCase().trim() === targetName
    );
    const matched = exact || warehouseStock.find(
      (s) =>
        targetName.startsWith(s.fruit_name.toLowerCase().trim()) ||
        s.fruit_name.toLowerCase().trim().startsWith(targetName)
    );
    if (!matched) return;

    if (matched.current_stock <= 0) {
      toastSuccess(`Dipilih "${matched.fruit_name}". Stok gudang 0 ${matched.unit} (akan disiapkan saat kulakan/belanja).`);
    }

    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.item_name = matched.fruit_name;
      target.unit = matched.unit || 'kg';
      target.price = matched.latest_selling_price || target.price || 0;
      let qty = Number(target.quantity) || 1;
      if (qty <= 0) qty = 1;
      target.quantity = qty;
      target.subtotal = qty * target.price;
      next[idx] = target;
      return next;
    });
  };

  const handleAddQuickFruit = (fruit: { name: string; unit: string; price: number }) => {
    const targetName = fruit.name.toLowerCase().trim();
    const exact = warehouseStock.find(
      (s) => s.fruit_name.toLowerCase().trim() === targetName
    );
    const matched = exact || warehouseStock.find(
      (s) =>
        targetName.startsWith(s.fruit_name.toLowerCase().trim()) ||
        s.fruit_name.toLowerCase().trim().startsWith(targetName)
    );

    const price = fruit.price || matched?.latest_selling_price || 0;
    const unit = fruit.unit || matched?.unit || 'kg';
    const finalName = matched ? matched.fruit_name : fruit.name;

    if (matched && matched.current_stock <= 0) {
      toastSuccess(`"${finalName}" ditambahkan. Stok gudang 0 ${unit} (akan disiapkan sebelum jadwal kirim).`);
    }

    // If the single item is currently empty, replace it
    if (items.length === 1 && !items[0].item_name.trim()) {
      setItems([
        {
          id: items[0].id || 'item-1',
          item_name: finalName,
          quantity: 1,
          unit,
          price,
          subtotal: price,
        },
      ]);
    } else {
      // Append as new item
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          item_name: finalName,
          quantity: 1,
          unit,
          price,
          subtotal: price,
        },
      ]);
    }
  };

  const handleItemChange = (idx: number, field: keyof OrderItem, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      let finalVal = val;
      const targetItem = { ...next[idx] };

      if (field === 'item_name') {
        finalVal = val;
        targetItem.item_name = val;
        const targetName = (val || '').toLowerCase().trim();
        const exact = warehouseStock.find(
          (s) => s.fruit_name.toLowerCase().trim() === targetName
        );
        const matched = exact || warehouseStock.find(
          (s) =>
            targetName.length >= 3 &&
            (targetName.startsWith(s.fruit_name.toLowerCase().trim()) ||
             s.fruit_name.toLowerCase().trim().startsWith(targetName))
        );
        if (matched) {
          if (matched.unit) targetItem.unit = matched.unit;
          if (matched.latest_selling_price && (!targetItem.price || targetItem.price === 0)) {
            targetItem.price = matched.latest_selling_price;
          }
          if (Number(targetItem.quantity) <= 0) {
            targetItem.quantity = 1;
          }
        }
      } else if (field === 'quantity') {
        const targetName = (targetItem.item_name || '').toLowerCase().trim();
        const matched = warehouseStock.find(
          (s) =>
            s.fruit_name.toLowerCase().trim() === targetName ||
            (targetName && targetName.includes(s.fruit_name.toLowerCase().trim())) ||
            (targetName && s.fruit_name.toLowerCase().trim().includes(targetName))
        );
        let maxAvailable = matched ? matched.current_stock : null;
        if (matched && editOrder && editOrder.stock_deducted && editOrder.order_items) {
          const prevItem = editOrder.order_items.find(
            (p) =>
              p.item_name.toLowerCase().trim() === targetName ||
              (targetName && targetName.includes(p.item_name.toLowerCase().trim())) ||
              (targetName && p.item_name.toLowerCase().trim().includes(targetName))
          );
          if (prevItem) {
            maxAvailable = Number(((maxAvailable || 0) + (Number(prevItem.quantity) || 0)).toFixed(2));
          }
        }
        let num = Number(val);
        if (isNaN(num) || num < 0) num = 0;
        if (maxAvailable !== null) {
          if (maxAvailable <= 0) {
            toastError(`Stok buah "${targetItem.item_name || matched?.fruit_name}" di gudang habis (0 ${matched?.unit || 'kg'}).`);
            num = 0;
          } else if (num > maxAvailable) {
            toastError(
              `Stok "${targetItem.item_name || matched?.fruit_name}" di gudang hanya tersisa ${maxAvailable} ${matched?.unit || 'kg'}. Jumlah disesuaikan ke stok maksimal.`
            );
            num = maxAvailable;
          }
        }
        finalVal = num;
      }

      const target = { ...targetItem, [field]: finalVal };
      const qty = Number(target.quantity) || 0;
      const prc = Number(target.price) || 0;
      target.subtotal = Math.max(0, qty * prc);
      next[idx] = target;
      return next;
    });
  };

  const grandTotal = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOrderLockedForSales) {
      toastError('Transaksi yang sudah selesai terkunci dan tidak dapat diubah oleh Sales.');
      return;
    }
    if (!customerName.trim()) {
      toastError('Nama customer / usaha wajib diisi.');
      return;
    }
    if (!customerPhone.trim()) {
      toastError('Nomor HP / WhatsApp wajib diisi.');
      return;
    }
    if (!deliveryAddress.trim()) {
      toastError('Alamat pengantaran wajib diisi.');
      return;
    }
    const validItems = items.filter((i) => i.item_name.trim());
    if (validItems.length === 0) {
      toastError('Mohon isi minimal 1 nama produk / buah yang dipesan.');
      return;
    }

    // Strict validation against warehouse stock: cannot order out-of-stock items or exceed stock
    for (const it of validItems) {
      const qty = Number(it.quantity) || 0;
      if (qty <= 0) {
        toastError(`Jumlah pesanan untuk "${it.item_name}" harus lebih dari 0.`);
        return;
      }
      const targetName = it.item_name.toLowerCase().trim();
      const exactStock = warehouseStock.find(
        (s) => s.fruit_name.toLowerCase().trim() === targetName
      );
      const matched = exactStock || warehouseStock.find(
        (s) =>
          targetName.length >= 3 &&
          (targetName.startsWith(s.fruit_name.toLowerCase().trim()) ||
           s.fruit_name.toLowerCase().trim().startsWith(targetName))
      );
      if (matched && deliverySlot === 'Sekarang') {
        let availableStock = matched.current_stock;
        if (editOrder && editOrder.stock_deducted && editOrder.order_items) {
          const prev = editOrder.order_items.find(
            (p) =>
              p.item_name.toLowerCase().trim() === targetName ||
              targetName.includes(p.item_name.toLowerCase().trim()) ||
              p.item_name.toLowerCase().trim().includes(targetName)
          );
          if (prev) {
            availableStock += Number(prev.quantity) || 0;
          }
        }

        if (availableStock <= 0) {
          toastError(
            `Stok buah "${matched.fruit_name}" di gudang sedang habis (0 ${matched.unit}) untuk pengantaran langsung sekarang. Pilih buah lain atau ubah jadwal pengantaran.`
          );
          return;
        }

        if (qty > availableStock) {
          toastError(
            `Stok buah "${matched.fruit_name}" di gudang hanya tersisa ${availableStock} ${matched.unit} untuk pengantaran langsung sekarang.`
          );
          return;
        }
      }
    }

    const assignedCourier = couriers.find((c) => c.id === courierId);

    setIsSubmitting(true);
    try {
      await onSubmit({
        prospect_id: selectedProspectId || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryAddress.trim(),
        zone_id: zoneId || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        order_items: items.filter((i) => i.item_name.trim()),
        total_amount: grandTotal,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status,
        delivery_slot: deliverySlot,
        delivery_date: deliveryDate,
        courier_id: courierId || null,
        courier_name: assignedCourier ? assignedCourier.name : null,
        customer_notes: customerNotes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-x-hidden">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-3xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh] overflow-hidden border-0 sm:border border-gray-200 max-w-full">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-lg leading-tight truncate">
                {editOrder ? `Edit Order #${editOrder.order_number}` : 'Catat Order Masuk (WhatsApp / Telepon)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 truncate">
                Otomatisasi jadwal jam pengantaran & penugasan kurir PesanBuah.id
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-full">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 w-full max-w-full">
          {isOrderLockedForSales && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-medium animate-in fade-in">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Transaksi Selesai Terkunci:</strong> Pesanan #{editOrder?.order_number} telah berstatus <strong>{editOrder?.status}</strong>. Sesuai kebijakan keamanan data rahasia perusahaan, Sales tidak dapat mengubah pesanan yang sudah selesai.
              </span>
            </div>
          )}
          <fieldset disabled={isOrderLockedForSales} className="space-y-4 min-w-0 w-full max-w-full">
          {/* Quick Prospect Match - Searchable Combobox */}
          <div ref={customerDropdownRef} className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Cari &amp; Pilih Dari CRM Pelanggan
              </label>
              <span className="text-[10px] text-emerald-800 font-medium">
                Tersedia {prospectsSource.length} pelanggan terdaftar
              </span>
            </div>

            {/* Selected Prospect Banner */}
            {selectedProspect && (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 bg-emerald-600 text-white rounded-md shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-emerald-950 text-xs truncate">
                        {selectedProspect.business_name}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-medium">
                        (PIC: {selectedProspect.pic_name})
                      </span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded">
                        {selectedProspect.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 truncate">
                      📞 {selectedProspect.phone} &bull; 📍 {selectedProspect.address}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProspectId('');
                    setCustomerSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 border border-rose-200 transition cursor-pointer shrink-0"
                >
                  Lepas CRM
                </button>
              </div>
            )}

            {/* Search Input Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={customerSearchQuery}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setIsCustomerDropdownOpen(true);
                }}
                placeholder={
                  selectedProspect
                    ? `Ketik nama pelanggan lain untuk mengganti (${selectedProspect.business_name})...`
                    : `Ketik nama kafe, resto, PIC, atau no HP (dari ${prospectsSource.length} pelanggan)...`
                }
                className="w-full pl-9 pr-16 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden shadow-2xs"
              />

              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                  className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer"
                  title="Buka daftar pelanggan"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Floating Dropdown Results Menu */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-emerald-200 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-gray-100">
                  <div className="p-2 bg-emerald-50 text-[11px] font-semibold text-emerald-950 flex justify-between items-center sticky top-0 backdrop-blur-xs border-b border-emerald-100 z-10">
                    <span>Hasil Pencarian ({filteredProspects.length} dari {prospectsSource.length} customer)</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Tutup ✕
                    </button>
                  </div>

                  {filteredProspects.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 space-y-1">
                      <div>Tidak ada pelanggan CRM yang cocok dengan "<strong>{customerSearchQuery}</strong>"</div>
                      <div className="text-[11px] text-gray-400">Anda dapat langsung mengisi formulir rincian pemesan di bawah secara manual.</div>
                    </div>
                  ) : (
                    filteredProspects.map((p) => {
                      const isSelected = p.id === selectedProspectId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            handleSelectProspect(p.id);
                            setCustomerSearchQuery('');
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 hover:bg-emerald-50 transition flex items-start justify-between gap-2 cursor-pointer ${
                            isSelected ? 'bg-emerald-50 font-bold' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 truncate">
                                {p.business_name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                (PIC: {p.pic_name})
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                p.status === 'Customer'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'Follow Up'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 truncate mt-0.5">
                              📞 {p.phone} &bull; 📍 {p.address}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-500">
              💡 Ketik nama kafe/resto/PIC atau nomor WhatsApp untuk mengisi alamat otomatis. Atau langsung isi form di bawah jika pesanan dari customer baru.
            </p>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Usaha / Pemesan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Kopi Kenanga Pajajaran"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                No. HP / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alamat Pengantaran Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Jl. Pajajaran No. 45, samping SPBU, Bogor"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Wilayah / Zone
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
              >
                <option value="">-- Pilih Zone --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Titik GPS Pengantaran Presisi */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5 flex-1">
              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${latitude && longitude ? 'text-emerald-600' : 'text-amber-500'}`} />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-gray-900">Titik Koordinat GPS Pengantaran:</span>
                  {latitude && longitude ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-2.5 h-2.5" /> GPS Tersimpan
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠️ Belum Ada Titik GPS
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                  {latitude && longitude ? (
                    <span>Lat: <strong className="text-gray-900">{latitude.toFixed(6)}</strong>, Lng: <strong className="text-gray-900">{longitude.toFixed(6)}</strong></span>
                  ) : (
                    <span className="text-gray-500">Pilih customer dari CRM atau tekan tombol deteksi GPS di samping untuk menyimpan titik presisi</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCaptureCurrentGps}
                disabled={isCapturingGps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Ambil titik GPS dari posisi GPS saat ini"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isCapturingGps ? 'Mendeteksi...' : 'Ambil Titik GPS'}</span>
              </button>
              {latitude && longitude && (
                <button
                  type="button"
                  onClick={() => {
                    setLatitude(null);
                    setLongitude(null);
                  }}
                  className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  title="Hapus koordinat GPS"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Delivery Schedule & Slot Box */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Aturan &amp; Jadwal Jam Pengantaran PesanBuah
              </span>
              {autoSlotReason && (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Slot Otomatis Sesuai Jam Masuk
                </span>
              )}
            </div>

            {autoSlotReason && (
              <p className="text-[11px] text-blue-900 bg-white/70 p-2 rounded-lg border border-blue-100">
                <Info className="w-3 h-3 inline mr-1 text-blue-600 -mt-0.5" />
                {autoSlotReason}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Pengantaran
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Slot Waktu Pengantaran
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliverySlot('Sekarang');
                      setDeliveryDate(formatDateIso(new Date()));
                      setAutoSlotReason('⚡ Mode on-the-spot diaktifkan: pesanan langsung saat muter di lapangan.');
                      if (!courierId && currentUser) {
                        setCourierId(currentUser.id);
                      }
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      deliverySlot === 'Sekarang'
                        ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    ⚡ Pilih Sekarang
                  </button>
                </div>
                <select
                  value={deliverySlot}
                  onChange={(e) => {
                    const newSlot = e.target.value as DeliverySlot;
                    setDeliverySlot(newSlot);
                    if (newSlot === 'Sekarang') {
                      setDeliveryDate(formatDateIso(new Date()));
                      setAutoSlotReason('⚡ Mode on-the-spot diaktifkan: pesanan langsung saat muter di lapangan.');
                      if (!courierId && currentUser) {
                        setCourierId(currentUser.id);
                      }
                    }
                  }}
                  className={`w-full h-10 px-3 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-hidden transition ${
                    deliverySlot === 'Sekarang'
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-extrabold'
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="Sekarang">⚡ Sekarang (Langsung / On-the-spot saat muter)</option>
                  <option value="08:00 - 10:00">Kloter Pagi (08:00 - 10:00)</option>
                  <option value="14:00 - 16:00">Kloter Sore (14:00 - 16:00)</option>
                  <option value="Keesokan Harinya (08:00 - 10:00)">
                    Keesokan Harinya (Pagi 08:00 - 10:00)
                  </option>
                </select>
              </div>
            </div>

            {deliverySlot === 'Sekarang' && (
              <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-base">⚡</span>
                  <span>Slot Sekarang Aktif (Pesanan langsung di tempat saat muter keliling)</span>
                </div>
                {status === 'Diterima' && (
                  <button
                    type="button"
                    onClick={() => setStatus('Sedang Diantar')}
                    className="text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 px-2 py-1 rounded-lg transition whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    Set Status: "Sedang Diantar"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-2.5 border border-gray-200 rounded-2xl p-3.5 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                Daftar Produk / Buah Dipesan
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Tambah Item
              </button>
            </div>

            {/* Quick fruit chips for on-the-spot orders when muter */}
            <div className="p-3 bg-white rounded-2xl border border-gray-200 space-y-2 shadow-2xs">
              <div className="text-xs text-gray-800 font-bold flex items-center justify-between flex-wrap gap-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🍊</span>
                  <span>Katalog Buah Tersedia di Inventory ({inventoryFruitChips.length} Jenis):</span>
                  <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">
                    (Klik chip buah untuk langsung memasukkan ke order)
                  </span>
                </span>
                {(isOwner || isManager) && (
                  <button
                    type="button"
                    onClick={() => setIsManageFruitsModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-2xs"
                    title="Owner/Manager dapat menambah atau mengatur master buah"
                  >
                    <Settings className="w-3 h-3 text-emerald-600" />
                    <span>⚙️ Kelola Master Buah</span>
                  </button>
                )}
              </div>

              {inventoryFruitChips.length === 0 ? (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span>Belum ada data buah di gudang/inventory.</span>
                  {(isOwner || isManager) && (
                    <button
                      type="button"
                      onClick={() => setIsManageFruitsModalOpen(true)}
                      className="text-emerald-700 font-bold underline cursor-pointer"
                    >
                      + Tambah Buah Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {(showAllChips ? inventoryFruitChips : inventoryFruitChips.slice(0, 8)).map((fruit) => {
                      const isOutOfStock = fruit.stock <= 0;
                      return (
                        <button
                          key={fruit.id}
                          type="button"
                          onClick={() =>
                            handleAddQuickFruit({
                              name: fruit.name,
                              unit: fruit.unit,
                              price: fruit.price,
                            })
                          }
                          className={`px-2.5 py-1.5 border rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                            isOutOfStock
                              ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100 text-amber-950'
                              : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100 text-gray-800'
                          }`}
                          title={`Tambah ${fruit.name} (${formatRupiah(fruit.price)}/${fruit.unit} • Sisa: ${fruit.stock} ${fruit.unit})`}
                        >
                          <span className="text-sm">{fruit.emoji || '🍊'}</span>
                          <span className="font-bold">{fruit.name}</span>
                          {isOutOfStock ? (
                            <span className="text-[9px] text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                              0 {fruit.unit}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                              {fruit.stock} {fruit.unit}
                            </span>
                          )}
                          {fruit.price > 0 && (
                            <span className="text-[10px] text-gray-500 font-medium">
                              {formatRupiah(fruit.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {inventoryFruitChips.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllChips(!showAllChips)}
                        className="px-2.5 py-1.5 border border-dashed border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-emerald-50 rounded-xl text-xs font-bold text-gray-600 hover:text-emerald-800 transition cursor-pointer shadow-2xs"
                      >
                        {showAllChips ? 'Tampilkan Lebih Sedikit ▲' : `+${inventoryFruitChips.length - 8} Buah Lainnya ▼`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const targetName = item.item_name.toLowerCase().trim();
                const exactStock = warehouseStock.find(
                  (s) => s.fruit_name.toLowerCase().trim() === targetName
                );
                const matchedStock = exactStock || warehouseStock.find(
                  (s) =>
                    targetName.length >= 3 &&
                    (targetName.startsWith(s.fruit_name.toLowerCase().trim()) ||
                     s.fruit_name.toLowerCase().trim().startsWith(targetName))
                );

                let availableStock = matchedStock ? matchedStock.current_stock : null;
                if (matchedStock && editOrder && editOrder.stock_deducted && editOrder.order_items) {
                  const prev = editOrder.order_items.find(
                    (p) => p.item_name.toLowerCase().trim() === matchedStock.fruit_name.toLowerCase().trim()
                  );
                  if (prev) {
                    availableStock = Number(((availableStock || 0) + (Number(prev.quantity) || 0)).toFixed(2));
                  }
                }

                const isOutOfStock = availableStock !== null && availableStock <= 0;
                const isOverStock = availableStock !== null && availableStock > 0 && Number(item.quantity) > availableStock;

                return (
                  <div
                    key={item.id || idx}
                    className={`bg-white p-3 sm:p-4 rounded-2xl border shadow-xs space-y-3 transition min-w-0 max-w-full ${
                      isOverStock ? 'border-amber-400 ring-1 ring-amber-200' : 'border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    {/* Top Bar of item: Badge & Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        Buah #{idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={items.length > 1 ? "Hapus baris buah ini" : "Kosongkan baris buah ini"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{items.length > 1 ? 'Hapus' : 'Kosongkan'}</span>
                      </button>
                    </div>

                    {/* Pilih Buah dari Gudang / Inventory */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                        <label className="block text-xs font-bold text-gray-700">
                          Pilih Buah dari Inventory Gudang <span className="text-rose-500">*</span>
                        </label>
                        {matchedStock ? (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border break-words max-w-full ${
                              isOutOfStock
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : isOverStock
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {isOutOfStock
                              ? `⚠️ Stok Gudang: 0 ${matchedStock.unit} (Akan disiapkan saat belanja)`
                              : isOverStock
                              ? `⚠️ Melebihi Stok! Maks: ${availableStock} ${matchedStock.unit}`
                              : `✅ Stok Gudang: ${availableStock} ${matchedStock.unit} • Harga: ${formatRupiah(matchedStock.latest_selling_price || item.price)}/${matchedStock.unit}`}
                          </span>
                        ) : item.item_name.trim() ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                            📝 Buah Khusus / Baru
                          </span>
                        ) : null}
                      </div>

                      {/* Dropdown Langsung dari Stok Gudang */}
                      <select
                        value={
                          matchedStock
                            ? matchedStock.fruit_name
                            : item.item_name.trim()
                            ? '__custom__'
                            : ''
                        }
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            handleItemChange(idx, 'item_name', 'Buah Khusus');
                          } else if (e.target.value) {
                            handleSelectWarehouseFruit(idx, e.target.value);
                          } else {
                            handleItemChange(idx, 'item_name', '');
                          }
                        }}
                        className="w-full max-w-full truncate h-11 px-3 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Pilih Buah dari Inventory Gudang ({warehouseStock.length} jenis) --</option>
                        {warehouseStock.map((s) => (
                          <option key={s.id} value={s.fruit_name}>
                            {s.emoji || '🍊'} {s.fruit_name} — {s.current_stock > 0 ? `Sisa: ${s.current_stock} ${s.unit}` : `(Stok Habis 0 ${s.unit})`} • {formatRupiah(s.latest_selling_price || 0)}/{s.unit}
                          </option>
                        ))}
                        <option value="__custom__">➕ Ketik Nama Buah Lain / Manual...</option>
                      </select>

                      {/* Input manual untuk mengetik buah khusus HANYA jika bukan dari katalog dan memang diisi */}
                      {(!matchedStock && item.item_name.trim() !== '') && (
                        <div className="pt-1.5 flex items-center gap-2 min-w-0">
                          <input
                            type="text"
                            required
                            placeholder="Ketik nama buah manual (misal: Jeruk Bali, Apel Malang)..."
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                            className="flex-1 min-w-0 h-10 px-3.5 bg-gray-50 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const fb = warehouseStock[0] || null;
                              if (fb) handleSelectWarehouseFruit(idx, fb.fruit_name);
                            }}
                            className="px-2.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl shrink-0 cursor-pointer"
                          >
                            Pilih Katalog
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Responsive Grid: Jumlah Qty, Satuan, Harga Satuan, Subtotal */}
                    <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-3 pt-1 min-w-0">
                      {/* Mobile Row 1: Qty Stepper & Satuan */}
                      <div className="grid grid-cols-2 sm:col-span-2 sm:grid-cols-2 gap-2 min-w-0">
                        {/* 1. Jumlah Qty */}
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-1">
                            <label className="block text-xs font-bold text-gray-700 truncate">
                              Jumlah (Qty)
                            </label>
                            {availableStock !== null && (
                              <span className="text-[10px] text-gray-500 font-semibold shrink-0">
                                Maks: {availableStock}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center w-full min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(item.quantity) || 1;
                                const next = Math.max(0.1, current <= 1 ? current - 0.5 : current - 1);
                                handleItemChange(idx, 'quantity', Number(next.toFixed(1)));
                              }}
                              className="w-9 h-10 sm:w-10 sm:h-10 shrink-0 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-l-xl font-black text-lg flex items-center justify-center border border-r-0 border-gray-300 cursor-pointer select-none"
                              title="Kurangi 1"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full min-w-0 h-10 bg-white border-y border-gray-300 text-center font-extrabold text-sm sm:text-base outline-hidden text-gray-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(item.quantity) || 0;
                                const next = current + 1;
                                handleItemChange(idx, 'quantity', Number(next.toFixed(1)));
                              }}
                              className="w-9 h-10 sm:w-10 sm:h-10 shrink-0 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-r-xl font-black text-lg flex items-center justify-center border border-l-0 border-gray-300 cursor-pointer select-none"
                              title="Tambah 1"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 2. Satuan Jual */}
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-gray-700 mb-1 truncate">
                            Satuan Jual
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full min-w-0 max-w-full truncate h-10 px-2 sm:px-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                          >
                            <option value="kg">kg (Kilogram)</option>
                            <option value="dus">dus (Karton)</option>
                            <option value="pack">pack</option>
                            <option value="ikat">ikat</option>
                            <option value="pcs">pcs (Biji)</option>
                            <option value="karung">karung</option>
                            <option value="keranjang">keranjang</option>
                          </select>
                        </div>
                      </div>

                      {/* Mobile Row 2: Harga Satuan & Subtotal */}
                      <div className="grid grid-cols-2 sm:col-span-2 sm:grid-cols-2 gap-2 min-w-0">
                        {/* 3. Harga Satuan Rp */}
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-gray-700 mb-1 truncate">
                            Harga Satuan (Rp)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={item.price === 0 ? '' : item.price}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'price',
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="w-full min-w-0 h-10 px-2 sm:px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                          />
                        </div>

                        {/* 4. Subtotal */}
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-gray-700 mb-1 text-right sm:text-left truncate">
                            Subtotal (Rp)
                          </label>
                          <div className="w-full min-w-0 h-10 px-2 sm:px-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-end font-mono font-extrabold text-xs sm:text-sm text-emerald-800 shadow-2xs truncate">
                            {formatRupiah(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Item Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:bg-emerald-200"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ Tambah Buah / Produk Lainnya</span>
              </button>
            </div>

            {/* Total Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 p-3 sm:p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-300 shadow-2xs">
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-950 uppercase tracking-wide">
                  Total Tagihan Order:
                </span>
                {grandTotal === 0 ? (
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    *Masukkan harga satuan di atas agar omset terhitung otomatis
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Total {items.length} item buah terhitung otomatis
                  </p>
                )}
              </div>
              <div className="w-full sm:w-auto text-right">
                <span className="font-black text-xl sm:text-2xl text-emerald-800 font-mono">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              >
                <option value="Tunai">Tunai (Bayar di Tempat / COD)</option>
                <option value="QRIS">QRIS Statis / Dinamis</option>
                <option value="Transfer Bank">Transfer Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm font-bold outline-hidden ${
                  paymentStatus === 'Lunas'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                <option value="Belum Lunas">Belum Lunas (Bayar saat terima)</option>
                <option value="Lunas">Lunas (Sudah transfer / cash di muka)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Status Alur Order
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              >
                <option value="Diterima">1. Order Diterima</option>
                <option value="Disiapkan">2. Disiapkan di Gudang</option>
                <option value="Sedang Diantar">3. Sedang Diantar Kurir</option>
                <option value="Selesai">4. Selesai (Diterima Customer)</option>
                <option value="Dibatalkan">Batal</option>
              </select>
            </div>
          </div>

          {/* Courier Assignment */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Penugasan Kurir Pengantar (Bisa Staf/Sales/Kurir)
              </label>
              <span className="text-[10px] text-gray-500">
                Karena keterbatasan SDM, staf mana pun bisa ditugaskan
              </span>
            </div>

            <select
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="">-- Belum Ditentukan (Tugaskan Nanti) --</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role}) - {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Catatan Khusus Pengantaran / Pesanan
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Contoh: Titipkan di kasir Mas Ari, minta tanda terima atau foto saat tiba."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
          </div>
          </fieldset>

          </div>

          {/* Sticky Bottom Summary & Submit Bar */}
          <div className="shrink-0 bg-white border-t border-gray-200 p-2.5 sm:p-4 shadow-lg flex items-center justify-between gap-2 sm:gap-3 z-20 w-full max-w-full">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-gray-500 block uppercase font-bold truncate">Total Tagihan</span>
              <span className="font-black text-base sm:text-2xl text-emerald-700 font-mono truncate block">
                {formatRupiah(grandTotal)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                {isOrderLockedForSales ? 'Tutup' : 'Batal'}
              </button>
              {isOrderLockedForSales ? (
                <button
                  type="button"
                  disabled
                  className="px-3 sm:px-4 py-2 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Terkunci</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{isSubmitting ? 'Menyimpan...' : editOrder ? 'Perbarui Order' : 'Simpan Order'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Modal for Owner/Manager to customize their fruit catalog */}
      {(isOwner || isManager) && (
        <ManageFruitsModal
          isOpen={isManageFruitsModalOpen}
          onClose={() => setIsManageFruitsModalOpen(false)}
          onFruitsUpdated={loadStockAndFruits}
        />
      )}
    </div>
  );
};
