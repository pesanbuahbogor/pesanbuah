import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  ExternalLink,
  User,
  Package,
  Layers,
  FileSpreadsheet,
  Download,
  Navigation,
  Copy,
  Check,
  Coins,
  AlertTriangle,
  Banknote,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowUp,
  X,
  Receipt,
  CheckCheck,
  ShieldAlert,
} from 'lucide-react';
import { Order, OrderStatus, DeliverySlot, Profile, Zone, Prospect, CanvasTrip } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatRupiah } from '../lib/orderScheduleUtils';
import { OrderFormModal } from '../components/OrderFormModal';
import { DeliveryCompletionModal } from '../components/DeliveryCompletionModal';
import { ManageFruitsModal } from '../components/ManageFruitsModal';

interface OrdersPageProps {
  onOpenCreateOrderInitially?: boolean;
  initialPageMode?: 'orders' | 'remittance';
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOpenCreateOrderInitially = false,
  initialPageMode = 'orders',
}) => {
  const { currentUser, isOwner, isManager, isSales, isCourierOnly, canManageOrders, canManageRemittance } = useAuth();
  const { success, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [canvasTrips, setCanvasTrips] = useState<CanvasTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Main Page Mode: 'orders' (Daftar Order & Pengantaran) or 'remittance' (Monitoring Kas & Setoran Kurir)
  const [mainPageTab, setMainPageTab] = useState<'orders' | 'remittance'>(initialPageMode);

  useEffect(() => {
    if (initialPageMode) {
      setMainPageTab(initialPageMode);
    }
  }, [initialPageMode]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSlot, setFilterSlot] = useState<string>('');
  const [filterCourier, setFilterCourier] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'month'>('today');
  const [filterRemittance, setFilterRemittance] = useState<'all' | 'pending' | 'remitted'>('all');

  // Mobile & Compact view states
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [viewDensity, setViewDensity] = useState<'mini' | 'standar' | 'rinci'>('mini');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(onOpenCreateOrderInitially);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [completionOrder, setCompletionOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [isManageFruitsModalOpen, setIsManageFruitsModalOpen] = useState(false);
  const [copiedAddressOrderId, setCopiedAddressOrderId] = useState<string | null>(null);
  const [updatingGpsOrderId, setUpdatingGpsOrderId] = useState<string | null>(null);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleRemitOrderPayment = async (orderId: string) => {
    if (!currentUser) return;
    if (!canManageRemittance) {
      toastError('Akses Ditolak: Hanya Owner dan Manager yang berhak menerima uang setoran kas kurir.');
      return;
    }
    try {
      await db.remitOrderPayment(orderId, currentUser);
      success('Setoran kas order berhasil diterima & resmi masuk kas perusahaan!');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal memproses setoran kas order.');
    }
  };

  const handleUnremitOrderPayment = async (orderId: string) => {
    if (!currentUser) return;
    if (!canManageRemittance) {
      toastError('Akses Ditolak: Hanya Owner dan Manager yang berhak membatalkan setoran kas.');
      return;
    }
    try {
      await db.unremitOrderPayment(orderId, currentUser);
      success('Status setoran dikembalikan ke Belum Disetor.');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal membatalkan status setoran.');
    }
  };

  const handleRemitCanvas = async (tripId: string) => {
    if (!currentUser) return;
    if (!canManageRemittance) {
      toastError('Akses Ditolak: Hanya Owner dan Manager yang berhak menerima setoran kas canvas.');
      return;
    }
    try {
      await db.remitCanvasTrip(tripId, currentUser);
      success('Setoran kas canvas berhasil diterima & masuk ke kas perusahaan!');
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal memverifikasi setoran kas canvas.');
    }
  };

  const handleRemitAllForCourier = async (courierId: string, courierName: string) => {
    if (!currentUser) return;
    if (!canManageRemittance) {
      toastError('Akses Ditolak: Hanya Owner dan Manager yang berhak memproses seluruh setoran kas kurir.');
      return;
    }
    try {
      const res = await db.remitAllCourierCash(courierId, currentUser, courierName);
      success(`Seluruh setoran kurir ${courierName} (${formatRupiah(res.totalAmount)}) resmi diterima ke kas perusahaan!`);
      await loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal memverifikasi seluruh setoran kurir.');
    }
  };

  const handleCopyAddress = (orderId: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddressOrderId(orderId);
    success('Alamat berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedAddressOrderId(null), 2500);
  };

  const handleCaptureGpsForOrder = (orderId: string) => {
    if (!navigator.geolocation) {
      toastError('Perangkat ini tidak mendukung deteksi GPS.');
      return;
    }
    setUpdatingGpsOrderId(orderId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          await db.updateOrder(orderId, { latitude: lat, longitude: lng }, currentUser!);
          const targetOrder = orders.find((o) => o.id === orderId);
          if (targetOrder?.prospect_id) {
            await db.updateProspect(targetOrder.prospect_id, { latitude: lat, longitude: lng }, currentUser!);
          }
          await loadData();
          success('Titik GPS berhasil disimpan untuk pengantaran ini!');
        } catch (err: any) {
          toastError(err.message || 'Gagal menyimpan titik GPS.');
        } finally {
          setUpdatingGpsOrderId(null);
        }
      },
      (err) => {
        setUpdatingGpsOrderId(null);
        toastError(`Gagal mengambil titik GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, profilesData, zonesData, prospectsData, canvasTripsData] = await Promise.all([
        db.getOrders(currentUser),
        db.getProfiles(),
        db.getZones(),
        db.getProspects(currentUser),
        db.getCanvasTrips(),
      ]);
      setOrders(ordersData);
      setProfiles(profilesData);
      setZones(zonesData);
      setProspects(prospectsData);
      setCanvasTrips(canvasTripsData);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat data order.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // List of staff who can be assigned as couriers
  const availableCouriers = useMemo(() => {
    return profiles.filter((p) => p.active);
  }, [profiles]);

  // Date filtering logic
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = order.customer_name.toLowerCase().includes(q);
        const matchPhone = order.customer_phone.includes(q);
        const matchNumber = order.order_number.toLowerCase().includes(q);
        const matchItems = order.items_summary.toLowerCase().includes(q);
        const matchAddress = order.delivery_address.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNumber && !matchItems && !matchAddress) {
          return false;
        }
      }

      // Status
      if (filterStatus && order.status !== filterStatus) {
        return false;
      }

      // Slot
      if (filterSlot) {
        if (filterSlot === 'Sekarang') {
          if (!order.delivery_slot.startsWith('Sekarang')) return false;
        } else if (order.delivery_slot !== filterSlot) {
          return false;
        }
      }

      // Courier
      if (filterCourier) {
        if (filterCourier === 'unassigned') {
          if (order.courier_id) return false;
        } else if (order.courier_id !== filterCourier) {
          return false;
        }
      }

      // Date Range
      if (filterDateRange === 'today') {
        if (order.delivery_date !== todayStr) return false;
      } else if (filterDateRange === 'tomorrow') {
        if (order.delivery_date !== tomorrowStr) return false;
      } else if (filterDateRange === 'week') {
        const orderDate = new Date(order.delivery_date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (orderDate < sevenDaysAgo) return false;
      } else if (filterDateRange === 'month') {
        const orderMonth = order.delivery_date.slice(0, 7);
        const currentMonth = todayStr.slice(0, 7);
        if (orderMonth !== currentMonth) return false;
      }

      // Remittance Filter
      if (filterRemittance === 'pending') {
        if (order.status !== 'Selesai' || order.payment_method !== 'Tunai' || order.courier_remittance_status === 'Sudah Disetor ke Kas') {
          return false;
        }
      } else if (filterRemittance === 'remitted') {
        if (order.courier_remittance_status !== 'Sudah Disetor ke Kas') {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, filterStatus, filterSlot, filterCourier, filterDateRange, filterRemittance, todayStr, tomorrowStr]);

  // Pending COD Cash currently held in couriers' hands
  const pendingCashOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'Selesai' &&
        o.payment_method === 'Tunai' &&
        o.courier_remittance_status !== 'Sudah Disetor ke Kas'
    );
  }, [orders]);

  const myPendingCashOrders = useMemo(() => {
    return isCourierOnly
      ? pendingCashOrders.filter((o) => o.courier_id === currentUser?.id)
      : pendingCashOrders;
  }, [pendingCashOrders, isCourierOnly, currentUser]);

  const totalPendingCashAmount = useMemo(() => {
    return myPendingCashOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  }, [myPendingCashOrders]);

  // Canvas Trips & Comprehensive Courier Cash Breakdown
  const couriersList = useMemo(() => {
    return profiles.filter((p) => p.is_courier || p.role === 'Kurir' || p.role === 'Sales');
  }, [profiles]);

  const pendingCanvasCashItems = useMemo(() => {
    return canvasTrips.filter(
      (t) =>
        t.status === 'Selesai & Rekonsiliasi' &&
        t.actual_cash_submitted > 0 &&
        t.remittance_status !== 'Sudah Disetor ke Kas'
    );
  }, [canvasTrips]);

  const totalPendingCanvasCash = useMemo(() => {
    return pendingCanvasCashItems.reduce(
      (acc, t) => acc + (Number(t.actual_cash_submitted) || 0),
      0
    );
  }, [pendingCanvasCashItems]);

  const totalPendingOrderCash = useMemo(() => {
    return pendingCashOrders.reduce(
      (acc, o) => acc + (Number(o.total_amount) || 0),
      0
    );
  }, [pendingCashOrders]);

  const totalCashInCouriersHands = totalPendingOrderCash + totalPendingCanvasCash;

  const remittedOrderCash = useMemo(() => {
    return orders
      .filter((o) => o.courier_remittance_status === 'Sudah Disetor ke Kas')
      .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  }, [orders]);

  const remittedCanvasCash = useMemo(() => {
    return canvasTrips
      .filter((t) => t.remittance_status === 'Sudah Disetor ke Kas')
      .reduce((acc, t) => acc + (Number(t.actual_cash_submitted) || 0), 0);
  }, [canvasTrips]);

  const totalCashRemittedToCompany = remittedOrderCash + remittedCanvasCash;

  const pendingCashByCourier = useMemo(() => {
    const list = couriersList
      .map((c) => {
        const courierOrders = pendingCashOrders.filter(
          (o) => o.courier_id === c.id || (o.courier_name && o.courier_name.trim().toLowerCase() === c.name.trim().toLowerCase())
        );
        const courierTrips = pendingCanvasCashItems.filter(
          (t) => t.courier_id === c.id || (t.courier_name && t.courier_name.trim().toLowerCase() === c.name.trim().toLowerCase())
        );
        const ordersAmount = courierOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const canvasAmount = courierTrips.reduce((sum, t) => sum + (Number(t.actual_cash_submitted) || 0), 0);
        const totalAmount = ordersAmount + canvasAmount;

        return {
          courier: c,
          orders: courierOrders,
          canvasTrips: courierTrips,
          ordersAmount,
          canvasAmount,
          totalAmount,
          hasPending: totalAmount > 0,
        };
      })
      .filter((x) => x.hasPending);

    // Also account for any pending orders assigned to staff not in couriersList or unassigned
    const accountedOrderIds = new Set(list.flatMap((x) => x.orders.map((o) => o.id)));
    const unlinkedOrders = pendingCashOrders.filter((o) => !accountedOrderIds.has(o.id));
    if (unlinkedOrders.length > 0) {
      const ordersAmount = unlinkedOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      list.push({
        courier: {
          id: 'unassigned',
          name: unlinkedOrders[0]?.courier_name || 'Kurir Lapangan / Belum Tertaut',
          role: 'Kurir',
          phone: '-',
          active: true,
          email: '',
          created_at: '',
          updated_at: '',
        } as Profile,
        orders: unlinkedOrders,
        canvasTrips: [],
        ordersAmount,
        canvasAmount: 0,
        totalAmount: ordersAmount,
        hasPending: true,
      });
    }

    return list;
  }, [couriersList, pendingCashOrders, pendingCanvasCashItems]);

  // Statistics calculation for the current filter view
  const stats = useMemo(() => {
    const total = orders.length;
    const diterima = orders.filter((o) => o.status === 'Diterima').length;
    const disiapkan = orders.filter((o) => o.status === 'Disiapkan').length;
    const sedangDiantar = orders.filter((o) => o.status === 'Sedang Diantar').length;
    const selesai = orders.filter((o) => o.status === 'Selesai').length;
    const omset = orders
      .filter((o) => o.status !== 'Dibatalkan')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    return { total, diterima, disiapkan, sedangDiantar, selesai, omset };
  }, [orders]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterStatus) count++;
    if (filterSlot) count++;
    if (filterCourier) count++;
    if (filterDateRange !== 'today') count++;
    if (filterRemittance !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filterStatus, filterSlot, filterCourier, filterDateRange, filterRemittance, searchQuery]);

  const handleCreateOrUpdateOrder = async (data: any) => {
    if (!currentUser) {
      toastError('Sesi login tidak valid. Silakan login kembali.');
      return;
    }
    try {
      if (editingOrder) {
        const updated = await db.updateOrder(editingOrder.id, data, currentUser);
        success(`Order #${updated.order_number} berhasil diperbarui.`);
      } else {
        const created = await db.createOrder(data, currentUser);
        success(`Order #${created.order_number} berhasil dibuat & diterbitkan!`);

        if (data.delivery_date) {
          if (data.delivery_date === todayStr) {
            setFilterDateRange('today');
          } else if (data.delivery_date === tomorrowStr) {
            setFilterDateRange('tomorrow');
          } else {
            setFilterDateRange('all');
          }
        }
      }
      setIsFormModalOpen(false);
      setEditingOrder(null);
      await loadData();
    } catch (err: any) {
      console.error('Error in handleCreateOrUpdateOrder:', err);
      toastError(err.message || 'Gagal menyimpan order. Periksa data kembali.');
      throw err;
    }
  };

  const handleQuickStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (!currentUser) return;
    try {
      await db.updateOrder(order.id, { status: newStatus }, currentUser);
      success(`Status Order #${order.order_number} diubah menjadi "${newStatus}"`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status.');
    }
  };

  const handleQuickAssignCourier = async (order: Order, courierId: string) => {
    if (!currentUser) return;
    try {
      const c = profiles.find((p) => p.id === courierId);
      await db.assignCourier(order.id, courierId || null, c ? c.name : null, currentUser);
      success(`Kurir untuk Order #${order.order_number} berhasil ditugaskan.`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menugaskan kurir.');
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmOrder || !currentUser) return;
    try {
      await db.deleteOrder(deleteConfirmOrder.id, currentUser);
      success(`Order #${deleteConfirmOrder.order_number} berhasil dihapus.`);
      setDeleteConfirmOrder(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus order.');
    }
  };

  const getStatusBadge = (s: OrderStatus) => {
    switch (s) {
      case 'Diterima':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Disiapkan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Sedang Diantar':
        return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse';
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Dibatalkan':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 space-y-2.5">
      {/* Main Tabs Navigation: Responsive 2-column Grid on Mobile, Flex on Desktop (Zero hidden tabs, Zero horizontal scrolling) */}
      <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2 sm:flex sm:gap-2">
        <button
          type="button"
          onClick={() => setMainPageTab('orders')}
          className={`w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mainPageTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <span className="truncate">Order Delivery</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
            mainPageTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
          }`}>
            {filteredOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainPageTab('remittance')}
          className={`w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            mainPageTab === 'remittance'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span className="truncate">Kas Kurir</span>
          {totalCashInCouriersHands > 0 ? (
            <span className={`text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full font-black shrink-0 ${
              mainPageTab === 'remittance' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-950 animate-pulse'
            }`}>
              {formatRupiah(totalCashInCouriersHands)}
            </span>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
              mainPageTab === 'remittance' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Beres
            </span>
          )}
        </button>
      </div>

      {mainPageTab === 'orders' && (
        <div className="space-y-2.5">
          {/* Top Header - Compact & Wrap for Mobile */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 tracking-tight truncate">
                  Order Delivery
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {filteredOrders.length}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-gray-500 truncate">
                Kloter 1 (14:00-16:00) · Order &gt;16:00 besok pagi
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-1.5">
              {/* Segmented view density toggle: Mini, Standar, Rinci */}
              <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewDensity('mini')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    viewDensity === 'mini' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Mode Mini: Ultra hemat layar HP"
                >
                  Mini
                </button>
                <button
                  type="button"
                  onClick={() => setViewDensity('standar')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    viewDensity === 'standar' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Mode Standar: Tampilan kartu normal"
                >
                  Standar
                </button>
                <button
                  type="button"
                  onClick={() => setViewDensity('rinci')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    viewDensity === 'rinci' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Mode Rinci: Semua detail terbuka"
                >
                  Rinci
                </button>
              </div>

              {(isOwner || isManager) && (
                <button
                  onClick={() => setIsManageFruitsModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-emerald-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kelola Buah</span>
                </button>
              )}

              {canManageOrders && (
                <button
                  onClick={() => {
                    setEditingOrder(null);
                    setIsFormModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Order</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Chips: Clean wrapping on mobile to ensure all filters and counts are always visible */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('');
                setFilterRemittance('all');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterStatus === '' && filterRemittance === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === '' && filterRemittance === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('Diterima');
                setFilterRemittance('all');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterStatus === 'Diterima'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
              }`}
            >
              <span>1. Diterima</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === 'Diterima' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {stats.diterima}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('Disiapkan');
                setFilterRemittance('all');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterStatus === 'Disiapkan'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
              }`}
            >
              <span>2. Disiapkan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === 'Disiapkan' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {stats.disiapkan}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('Sedang Diantar');
                setFilterRemittance('all');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterStatus === 'Sedang Diantar'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>3. Diantar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === 'Sedang Diantar' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                {stats.sedangDiantar}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterStatus('Selesai');
                setFilterRemittance('all');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterStatus === 'Selesai' && filterRemittance === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>4. Selesai</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === 'Selesai' && filterRemittance === 'all' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stats.selesai}
              </span>
            </button>

            {/* Quick button for Pending Remittance */}
            <button
              type="button"
              onClick={() => {
                setFilterRemittance(filterRemittance === 'pending' ? 'all' : 'pending');
                setFilterStatus('');
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                filterRemittance === 'pending'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : pendingCashOrders.length > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <Coins className="w-3 h-3 text-amber-600" />
              <span>⚠️ Belum Setor COD</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterRemittance === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-950 font-black'
              }`}>
                {pendingCashOrders.length}
              </span>
            </button>
          </div>

      {/* Outstanding Cash Banner - Compact on HP & Dismissible */}
      {totalPendingCashAmount > 0 && filterRemittance !== 'pending' && !isBannerDismissed && (
        <div className="p-2 sm:p-2.5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-amber-500 text-white font-black text-xs shrink-0">💵</span>
            <div className="truncate">
              <span className="font-extrabold text-amber-950 block truncate">
                {isCourierOnly ? 'Uang di Tangan Anda: ' : 'Uang COD di Kurir: '}
                <span className="font-mono">{formatRupiah(totalPendingCashAmount)}</span>
              </span>
              <span className="text-[10px] text-amber-800 hidden sm:inline">
                {myPendingCashOrders.length} order selesai belum diserahkan ke kasir
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFilterRemittance('pending');
                setFilterStatus('');
              }}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
            >
              Lihat Order
            </button>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded transition cursor-pointer"
              title="Tutup pemberitahuan ini"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Collapsible Filters Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari order #, customer, item, alamat..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Date Select on the bar */}
          <select
            value={filterDateRange}
            onChange={(e: any) => setFilterDateRange(e.target.value)}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-emerald-500 outline-hidden shrink-0"
          >
            <option value="today">Hari Ini</option>
            <option value="tomorrow">Besok</option>
            <option value="week">7 Hari</option>
            <option value="month">Bulan Ini</option>
            <option value="all">Semua Tgl</option>
          </select>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 border ${
              showFiltersDrawer || activeFiltersCount > 1
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Rows (Opens only when user clicks Filter) */}
        {showFiltersDrawer && (
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in">
            {/* Slot Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Slot Jam</label>
              <select
                value={filterSlot}
                onChange={(e) => setFilterSlot(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden"
              >
                <option value="">Semua Slot</option>
                <option value="Sekarang">⚡ Sekarang (On-the-spot)</option>
                <option value="08:00 - 10:00">Pagi (08-10)</option>
                <option value="14:00 - 16:00">Sore (14-16)</option>
                <option value="Keesokan Harinya (08:00 - 10:00)">Keesokan Harinya</option>
              </select>
            </div>

            {/* Courier Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Kurir</label>
              <select
                value={filterCourier}
                onChange={(e) => setFilterCourier(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden"
              >
                <option value="">Semua Kurir</option>
                <option value="unassigned">Belum Ada Kurir</option>
                {availableCouriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Status Order</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden"
              >
                <option value="">Semua Status</option>
                <option value="Diterima">Diterima</option>
                <option value="Disiapkan">Disiapkan</option>
                <option value="Sedang Diantar">Sedang Diantar</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Remittance Filter */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Setoran Kas COD</label>
              <select
                value={filterRemittance}
                onChange={(e: any) => setFilterRemittance(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden"
              >
                <option value="all">Semua Kas</option>
                <option value="pending">⚠️ Uang di Kurir</option>
                <option value="remitted">✅ Setoran Masuk Kas</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="col-span-2 sm:col-span-4 flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('');
                  setFilterSlot('');
                  setFilterCourier('');
                  setFilterDateRange('today');
                  setFilterRemittance('all');
                  setSearchQuery('');
                }}
                className="text-[11px] text-gray-500 hover:text-rose-600 underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders List / Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-400 text-xs">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Memuat data pesanan...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-2">
          <ShoppingBag className="w-7 h-7 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-700 text-xs sm:text-sm">Tidak Ada Order</h3>
          <p className="text-[11px] text-gray-400">
            Tidak ada pesanan yang sesuai dengan filter atau tanggal aktif ({filterDateRange}).
          </p>
          {canManageOrders && (
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsFormModalOpen(true);
              }}
              className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Catat Order Baru
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const isAssignedToMe = currentUser?.id === order.courier_id;
            const orderZone = zones.find((z) => z.id === order.zone_id);
            const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
            const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
              `Halo ${order.customer_name}, pesanan Anda (#${order.order_number}) dari PesanBuah.id sedang kami proses/antar.`
            )}`;

            // Resolve GPS coordinates from order or linked prospect
            const linkedProspect = prospects.find(
              (p) =>
                (order.prospect_id && p.id === order.prospect_id) ||
                (p.phone && cleanPhone && p.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
                p.business_name.toLowerCase().trim() === order.customer_name.toLowerCase().trim()
            );

            const effectiveLat = order.latitude ?? linkedProspect?.latitude ?? null;
            const effectiveLng = order.longitude ?? linkedProspect?.longitude ?? null;
            const hasGps = effectiveLat !== null && effectiveLng !== null && (effectiveLat !== 0 || effectiveLng !== 0);

            // Direct route navigation to GPS coordinates
            const mapsUrl = hasGps
              ? `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`;

            // Direct pin view on map
            const pinMapsUrl = hasGps ? `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}` : null;

            const isExpanded = viewDensity === 'rinci' ? true : !!expandedOrders[order.id];

            if (viewDensity === 'mini' && !isExpanded) {
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-emerald-300 transition p-2 sm:p-2.5 space-y-1.5"
                >
                  {/* Line 1: Order #, Customer, Slot, Status, Amount */}
                  <div className="flex items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                      <span className="font-mono font-black text-emerald-800 text-xs shrink-0">
                        #{order.order_number}
                      </span>
                      <span className="font-extrabold text-gray-900 text-xs truncate max-w-[130px] sm:max-w-none">
                        {order.customer_name}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border shrink-0 ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      {order.delivery_slot.startsWith('Sekarang') && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded shrink-0">
                          ⚡ Sekarang
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-700">
                        {formatRupiah(order.total_amount)}
                      </span>
                      <span className="text-[9px] text-gray-400 block -mt-0.5">
                        {order.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Line 2: Fast Action Bar */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 flex-wrap text-xs">
                    {/* 1-Tap Google Maps GPS Route */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                      title={hasGps ? 'Buka navigasi rute turn-by-turn ke titik GPS presisi' : 'Buka Google Maps'}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{hasGps ? 'GPS' : 'Maps'}</span>
                    </a>

                    {/* 1-Tap WA Customer */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                      title="Chat WhatsApp Pelanggan"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WA</span>
                    </a>

                    {/* 1-Tap Advance Order Status Button */}
                    {order.status === 'Diterima' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(order, 'Disiapkan')}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer"
                      >
                        Siapkan
                      </button>
                    )}

                    {order.status === 'Disiapkan' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(order, 'Sedang Diantar')}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer flex items-center gap-0.5"
                      >
                        <Truck className="w-3 h-3" /> Antar
                      </button>
                    )}

                    {order.status === 'Sedang Diantar' && (
                      <button
                        type="button"
                        onClick={() => setCompletionOrder(order)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer flex items-center gap-0.5"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </button>
                    )}

                    {/* 1-Tap Remittance Action */}
                    {order.payment_method === 'Tunai' && order.status === 'Selesai' && (
                      order.courier_remittance_status !== 'Sudah Disetor ke Kas' ? (
                        canManageRemittance ? (
                          <button
                            type="button"
                            onClick={() => handleRemitOrderPayment(order.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg text-white shadow-2xs transition cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                            title="Terima setoran masuk kas perusahaan"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Terima Kas</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md"
                            title="Uang fisik masih di tangan kurir (menunggu disetor ke Kasir/Owner)"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Di Kurir
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5 text-emerald-600" /> Kas Masuk
                        </span>
                      )
                    )}

                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleOrderExpand(order.id)}
                      className="ml-auto inline-flex items-center gap-0.5 px-2 py-1 text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md text-[11px] font-medium cursor-pointer"
                    >
                      <span>Rincian</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-emerald-300 transition overflow-hidden"
              >
                {/* Compact Card Header */}
                <div className="px-3 py-2 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="font-mono font-black text-emerald-800 text-xs">
                      #{order.order_number}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        order.delivery_slot.startsWith('Sekarang')
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {order.delivery_slot.startsWith('Sekarang') ? '⚡ Sekarang' : order.delivery_slot}
                    </span>

                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Total Tagihan (Bold Green) */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-700">
                      {formatRupiah(order.total_amount)}
                    </span>
                    <span className="text-[9px] text-gray-400 block -mt-0.5 font-medium">
                      {order.payment_method} · {order.payment_status}
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-3 space-y-2">
                  {/* Customer line */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight truncate">
                          {order.customer_name}
                        </h4>
                        {orderZone && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 shrink-0">
                            {orderZone.name}
                          </span>
                        )}
                        {order.courier_name && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 shrink-0 flex items-center gap-0.5">
                            <Truck className="w-2.5 h-2.5 text-blue-600" />
                            {order.courier_name}
                          </span>
                        )}
                      </div>

                      {/* Truncated Address with GPS icon */}
                      <p className="text-[11px] text-gray-600 mt-1 flex items-start gap-1">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${hasGps ? 'text-emerald-600' : 'text-amber-500'}`} />
                        <span className={isExpanded ? 'leading-relaxed' : 'truncate'}>
                          {order.delivery_address}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Item brief summary */}
                  <div className="text-[11px] text-gray-700 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-100 flex items-center justify-between gap-2">
                    <span className="truncate">
                      <strong>Buah:</strong> {order.items_summary}
                    </span>
                    {order.customer_notes && (
                      <span className="text-[10px] text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded shrink-0">
                        Ada Catatan
                      </span>
                    )}
                  </div>

                  {/* FAST ACTION BAR (One-Tap on Mobile) */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 flex-wrap">
                    {/* 1-Tap Google Maps GPS Route */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                      title={hasGps ? 'Buka navigasi rute turn-by-turn ke titik GPS presisi' : 'Buka pencarian alamat di Google Maps'}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{hasGps ? 'Rute GPS' : 'Maps'}</span>
                    </a>

                    {/* 1-Tap WA Customer */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                      title="Chat WhatsApp Pelanggan"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WA</span>
                    </a>

                    {/* 1-Tap Advance Order Status Button */}
                    {order.status === 'Diterima' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(order, 'Disiapkan')}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                      >
                        Siapkan
                      </button>
                    )}

                    {order.status === 'Disiapkan' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(order, 'Sedang Diantar')}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> Mulai Antar
                      </button>
                    )}

                    {order.status === 'Sedang Diantar' && (
                      <button
                        type="button"
                        onClick={() => setCompletionOrder(order)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Antar
                      </button>
                    )}

                    {/* 1-Tap Remittance Action (Hanya Owner/Manager yang berhak menerima uang kas masuk) */}
                    {order.payment_method === 'Tunai' && order.status === 'Selesai' && (
                      order.courier_remittance_status !== 'Sudah Disetor ke Kas' ? (
                        canManageRemittance ? (
                          <button
                            type="button"
                            onClick={() => handleRemitOrderPayment(order.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white shadow-2xs transition cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                            title="Terima & verifikasi setoran masuk kas kantor"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Terima Kas</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg"
                            title="Uang masih dipegang kurir, menunggu disetor ke kasir/owner"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Uang di Kurir
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                          <Check className="w-3 h-3 text-emerald-600" /> Kas Masuk
                        </span>
                      )
                    )}

                    {/* Expand/Collapse details toggle */}
                    <button
                      type="button"
                      onClick={() => toggleOrderExpand(order.id)}
                      className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* EXPANDABLE SECTION (Full details when opened) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-gray-100 space-y-2 text-xs animate-in fade-in">
                      {/* Customer Notes */}
                      {order.customer_notes && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Catatan Khusus:</strong> "{order.customer_notes}"
                        </div>
                      )}

                      {/* GPS Tools */}
                      <div className="flex items-center gap-1.5 flex-wrap bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-[11px]">
                        <span className="font-bold text-blue-900">Koordinat:</span>
                        {hasGps ? (
                          <span className="text-emerald-700 font-mono font-bold">
                            {effectiveLat?.toFixed(6)}, {effectiveLng?.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-amber-800">Belum ada titik GPS</span>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          {pinMapsUrl && (
                            <a
                              href={pinMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-white text-blue-700 border border-blue-200 rounded text-[10px] font-semibold"
                            >
                              Pin Peta
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(order.id, order.delivery_address)}
                            className="px-2 py-0.5 bg-white text-gray-700 border border-gray-200 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            {copiedAddressOrderId === order.id ? 'Tersalin!' : 'Salin Alamat'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCaptureGpsForOrder(order.id)}
                            disabled={updatingGpsOrderId === order.id}
                            className="px-2 py-0.5 bg-white text-emerald-800 border border-emerald-300 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            {updatingGpsOrderId === order.id ? 'Menyimpan...' : 'Kunci GPS'}
                          </button>
                        </div>
                      </div>

                      {/* Remittance Detail Status */}
                      {order.payment_method === 'Tunai' && order.status === 'Selesai' && (
                        <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-amber-950 block">
                              {order.courier_remittance_status === 'Sudah Disetor ke Kas'
                                ? `✅ Setoran kas telah diterima oleh ${order.courier_remitted_by_name || 'Kasir'}`
                                : `⚠️ Uang fisik dipegang oleh kurir ${order.courier_name || 'Kurir'} (belum masuk kas)`}
                            </span>
                          </div>
                          {canManageRemittance && order.courier_remittance_status === 'Sudah Disetor ke Kas' && (
                            <button
                              type="button"
                              onClick={() => handleUnremitOrderPayment(order.id)}
                              className="text-rose-600 hover:text-rose-800 underline text-[10px] font-bold cursor-pointer"
                              title="Batalkan penerimaan setoran kas (hanya Owner & Manager)"
                            >
                              Batalkan Setoran
                            </button>
                          )}
                        </div>
                      )}

                      {/* Courier select & Edit/Delete actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
                        {canManageOrders ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-500 font-semibold">Tugaskan:</span>
                            <select
                              value={order.courier_id || ''}
                              onChange={(e) => handleQuickAssignCourier(order, e.target.value)}
                              className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold outline-hidden"
                            >
                              <option value="">-- Belum Ada Kurir --</option>
                              {availableCouriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-600">
                            Kurir: <strong>{order.courier_name || 'Belum Ditugaskan'}</strong>
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {canManageOrders && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrder(order);
                                setIsFormModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded transition cursor-pointer"
                              title="Edit Data Order"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(isOwner || isManager) && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmOrder(order)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Hapus Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MONITORING KAS & SETORAN KURIR                          */}
      {/* ============================================================== */}
      {mainPageTab === 'remittance' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Role Access Information Banner */}
          {!canManageRemittance && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 block mb-0.5">
                  Akses Monitoring Saja (Role: {currentUser?.role})
                </span>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Penerimaan uang fisik setoran dari kurir serta pembatalan status setoran hanya dapat dieksekusi oleh <strong>Owner</strong> dan <strong>Manager</strong> (Kasir) demi integritas &amp; keamanan keuangan perusahaan.
                </p>
              </div>
            </div>
          )}

          {/* Header Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <span>Monitoring Kas &amp; Setoran Uang Kurir</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Rekonsiliasi uang fisik pelanggan COD &amp; penjualan canvas yang masih dipegang kurir sebelum disetor ke kasir kantor.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                <span>Perbarui Data</span>
              </button>
            </div>
          </div>

          {/* Remittance KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase">Uang di Tangan Kurir</span>
                <div className="p-2 bg-amber-200/70 rounded-xl text-amber-900">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono font-black text-xl sm:text-2xl text-amber-950">
                {formatRupiah(totalCashInCouriersHands)}
              </div>
              <div className="text-[11px] text-amber-800 pt-1 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Belum disetorkan ({pendingCashOrders.length} order COD, {pendingCanvasCashItems.length} canvas)</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase">Kas Resmi Masuk Perusahaan</span>
                <div className="p-2 bg-emerald-200/70 rounded-xl text-emerald-800">
                  <CheckCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono font-black text-xl sm:text-2xl text-emerald-900">
                {formatRupiah(totalCashRemittedToCompany)}
              </div>
              <div className="text-[11px] text-emerald-700 pt-1 font-semibold">
                <span>Sudah diserahkan kurir &amp; diverifikasi masuk kas resmi</span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Kurir Memegang Uang</span>
                <div className="p-2 bg-gray-100 rounded-xl text-gray-600">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono font-black text-xl sm:text-2xl text-gray-900">
                {pendingCashByCourier.length} <span className="text-sm font-semibold text-gray-500">orang kurir</span>
              </div>
              <div className="text-[11px] text-gray-400 pt-1">
                Staf kurir dengan saldo uang setoran tertunda
              </div>
            </div>
          </div>

          {/* List of Couriers with Pending Cash */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span>Rincian Uang yang Masih Dipegang Kurir (Belum Disetor)</span>
            </h3>

            {pendingCashByCourier.length === 0 ? (
              <div className="p-8 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-1.5">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">
                  Semua Kas Kurir Telah Bersih &amp; Disetorkan!
                </p>
                <p className="text-xs text-emerald-700">
                  Tidak ada uang tunai COD atau sisa penjualan canvas yang tertunda di tangan kurir.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {pendingCashByCourier.map((item) => (
                  <div
                    key={item.courier.id}
                    className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs"
                  >
                    {/* Courier Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {item.courier.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{item.courier.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {item.courier.role}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">📞 {item.courier.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Uang di Kurir:</span>
                          <span className="font-mono font-black text-base text-amber-950">
                            {formatRupiah(item.totalAmount)}
                          </span>
                        </div>

                        {canManageRemittance && (
                          <button
                            type="button"
                            onClick={() => handleRemitAllForCourier(item.courier.id, item.courier.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                            title="Terima seluruh setoran kurir ini sekaligus"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Terima Semua Setoran</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Item Breakdown (Orders & Canvas) */}
                    <div className="space-y-2">
                      {/* Pending Orders */}
                      {item.orders.map((o) => (
                        <div
                          key={o.id}
                          className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-emerald-800">#{o.order_number}</span>
                              <span className="font-bold text-gray-900">{o.customer_name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                                Tunai COD
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Diantar: {o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('id-ID') : o.delivery_date} &bull; Item: {o.items_summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <span className="font-mono font-black text-sm text-gray-900">
                              {formatRupiah(o.total_amount)}
                            </span>
                            {canManageRemittance ? (
                              <button
                                type="button"
                                onClick={() => handleRemitOrderPayment(o.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                Terima Setoran Kas
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-md">
                                Menunggu Kasir
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Pending Canvas Trips */}
                      {item.canvasTrips.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-900">#{t.id}</span>
                              <span className="font-bold text-gray-900">Hasil Penjualan Canvas Keliling</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold border border-blue-200">
                                Canvas Trip
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Tanggal: {t.trip_date} &bull; Omset Lapangan: {formatRupiah(t.total_expected_cash)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <span className="font-mono font-black text-sm text-blue-900">
                              {formatRupiah(t.actual_cash_submitted)}
                            </span>
                            {canManageRemittance ? (
                              <button
                                type="button"
                                onClick={() => handleRemitCanvas(t.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                Terima Setoran Kas
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2 py-1 rounded-md">
                                Menunggu Kasir
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Riwayat Kas Masuk Perusahaan */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Riwayat Kas Tunai yang Sudah Masuk ke Kas Perusahaan</span>
            </h3>

            {/* Mobile View: Cards (No horizontal scroll, fully legible) */}
            <div className="md:hidden space-y-2">
              {orders
                .filter((o) => o.courier_remittance_status === 'Sudah Disetor ke Kas')
                .map((o) => (
                  <div key={o.id} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-emerald-800">#{o.order_number}</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">{formatRupiah(o.total_amount)}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900">{o.customer_name}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>Kurir: <strong className="text-gray-700">{o.courier_name || '-'}</strong></span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Masuk Kas</span>
                    </div>
                  </div>
                ))}

              {canvasTrips
                .filter((t) => t.remittance_status === 'Sudah Disetor ke Kas')
                .map((t) => (
                  <div key={t.id} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-800">Canvas #{t.id}</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">{formatRupiah(t.actual_cash_submitted)}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900">Setoran Canvas {t.trip_date}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                      <span>Kurir: <strong className="text-gray-700">{t.courier_name}</strong></span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Masuk Kas</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Tipe &amp; No. Referensi</th>
                    <th className="py-2.5 px-3">Customer / Keterangan</th>
                    <th className="py-2.5 px-3">Kurir Penyetor</th>
                    <th className="py-2.5 px-3 text-right">Nominal Masuk</th>
                    <th className="py-2.5 px-3">Diterima Kasir Oleh</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter((o) => o.courier_remittance_status === 'Sudah Disetor ke Kas')
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          #{o.order_number}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {o.customer_name}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          {o.courier_name || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatRupiah(o.total_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {o.courier_remitted_by_name || 'Kasir / Owner'}
                          {o.courier_remitted_at && (
                            <span className="block text-[10px] text-gray-400">
                              {new Date(o.courier_remitted_at).toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-2.5 h-2.5" />
                            Masuk Kas
                          </span>
                        </td>
                      </tr>
                    ))}

                  {canvasTrips
                    .filter((t) => t.remittance_status === 'Sudah Disetor ke Kas')
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-800">
                          Canvas #{t.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          Setoran Canvas {t.trip_date}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          {t.courier_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatRupiah(t.actual_cash_submitted)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {t.remitted_by_name || t.verified_by_name || 'Kasir / Owner'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-2.5 h-2.5" />
                            Masuk Kas
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Create / Edit Modal */}
      <OrderFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleCreateOrUpdateOrder}
        editOrder={editingOrder}
        prospects={prospects}
        zones={zones}
        couriers={availableCouriers}
      />

      {/* Delivery Completion & Payment Confirmation Modal */}
      <DeliveryCompletionModal
        isOpen={!!completionOrder}
        onClose={() => setCompletionOrder(null)}
        order={completionOrder}
        onSubmit={async (orderId, data) => {
          if (!currentUser) return;
          await db.reportDeliveryCompletion(orderId, data, currentUser);
          success('Laporan pengantaran berhasil dicatat. Status order selesai!');
          setCompletionOrder(null);
          loadData();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hapus Data Order?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Yakin ingin menghapus order #{deleteConfirmOrder.order_number} untuk customer{' '}
                  <strong>{deleteConfirmOrder.customer_name}</strong>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Owner/Manager to manage Fruit Catalog */}
      {(isOwner || isManager) && (
        <ManageFruitsModal
          isOpen={isManageFruitsModalOpen}
          onClose={() => setIsManageFruitsModalOpen(false)}
        />
      )}

      {/* Floating Back to Top Button on Mobile */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 z-40 p-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-lg border border-white/20 transition cursor-pointer flex items-center justify-center animate-in fade-in"
          title="Kembali ke Atas"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
