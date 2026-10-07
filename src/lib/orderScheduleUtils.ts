import { DeliverySlot } from '../types';

/**
 * Calculates delivery schedule based on PesanBuah business rules:
 * - Delivery slots:
 *   1. 08:00 - 10:00 (Pagi)
 *   2. 14:00 - 16:00 (Sore)
 * - Orders received between 07:00 and 14:00 will be delivered at 14:00 - 16:00 (same day).
 * - Orders received after 16:00 (or between 14:00 - 23:59) will be delivered the next day in the morning (08:00 - 10:00).
 * - Orders received before 07:00 (00:00 - 06:59) can be scheduled for morning (08:00 - 10:00) today.
 */
export function calculateAutomaticDeliverySlot(orderDate = new Date()): {
  slot: DeliverySlot;
  deliveryDate: string; // YYYY-MM-DD
  reason: string;
} {
  const hours = orderDate.getHours();
  const minutes = orderDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const todayStr = formatDateIso(orderDate);

  const tomorrow = new Date(orderDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateIso(tomorrow);

  // 07:00 is 7 * 60 = 420 mins
  // 14:00 is 14 * 60 = 840 mins
  // 16:00 is 16 * 60 = 960 mins

  if (timeInMinutes >= 420 && timeInMinutes <= 840) {
    // 07:00 - 14:00 -> Diantar hari ini jam 14:00 - 16:00
    return {
      slot: '14:00 - 16:00',
      deliveryDate: todayStr,
      reason: 'Pesanan masuk jam 07:00 - 14:00: dijadwalkan pengantaran sore hari ini (14:00 - 16:00).',
    };
  }

  if (timeInMinutes > 840 && timeInMinutes <= 960) {
    // 14:01 - 16:00 (Window pengantaran sore sedang berjalan atau pesanan mendesak)
    // Sesuai aturan: jika masuk di atas 14:00 menjelang 16:00 biasanya dialokasikan slot pagi keesokan harinya
    return {
      slot: 'Keesokan Harinya (08:00 - 10:00)',
      deliveryDate: tomorrowStr,
      reason: 'Pesanan masuk setelah jam 14:00: dijadwalkan pengantaran pagi keesokan harinya.',
    };
  }

  if (timeInMinutes > 960) {
    // Di atas jam 16:00 -> Diantar keesokan harinya
    return {
      slot: 'Keesokan Harinya (08:00 - 10:00)',
      deliveryDate: tomorrowStr,
      reason: 'Pesanan masuk di atas jam 16:00: dijadwalkan pengantaran pagi keesokan harinya (08:00 - 10:00).',
    };
  }

  // Sebelum jam 07:00 (Dini hari / Subuh): Bisa ikut kloter pagi hari ini jam 08:00 - 10:00
  return {
    slot: '08:00 - 10:00',
    deliveryDate: todayStr,
    reason: 'Pesanan masuk sebelum jam 07:00: dijadwalkan pengantaran pagi hari ini (08:00 - 10:00).',
  };
}

export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DELIVERY_SLOT_OPTIONS: { id: DeliverySlot; label: string; description: string }[] = [
  {
    id: 'Sekarang',
    label: '⚡ Sekarang (Langsung / On-the-spot saat muter)',
    description: 'Pesanan instan langsung diserahkan di tempat saat muter keliling lapangan.',
  },
  {
    id: '08:00 - 10:00',
    label: 'Kloter Pagi (08:00 - 10:00)',
    description: 'Pengantaran kloter pagi hari.',
  },
  {
    id: '14:00 - 16:00',
    label: 'Kloter Sore (14:00 - 16:00)',
    description: 'Pengantaran kloter sore hari.',
  },
  {
    id: 'Keesokan Harinya (08:00 - 10:00)',
    label: 'Keesokan Harinya (Pagi 08:00 - 10:00)',
    description: 'Pengantaran kloter pagi esok hari.',
  },
];
