import { Prospect, BusinessType, Zone, Profile, ProspectStatus } from '../types';

export interface ParsedCsvRow {
  id?: string;
  business_name: string;
  pic_name: string;
  phone: string;
  business_type_name: string;
  address: string;
  zone_name: string;
  sales_name: string;
  status: ProspectStatus;
  potential_needs: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  gps_captured_at: string | null;
  created_at?: string;
}

export interface ImportPreviewItem {
  rowNumber: number;
  data: ParsedCsvRow;
  matchedBusinessTypeId: string;
  matchedZoneId: string | null;
  matchedSalesId: string | null;
  isValid: boolean;
  errors: string[];
  isExisting: boolean; // whether ID or Phone already exists
  matchedExistingProspect?: Prospect;
}

/**
 * Robust CSV parser that handles:
 * - RFC 4180 quotes ("hello, world" or "say ""hi""")
 * - Commas, semicolons (;), or tabs delimiter detection
 * - UTF-8 BOM stripping
 * - Multiline quoted values
 */
export function parseCsvText(text: string): string[][] {
  // Strip UTF-8 BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.substring(1);
  }

  // Detect delimiter: check first non-empty line
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes phone numbers (removes leading single quotes from excel, spaces, dashes)
 */
export function cleanImportPhone(phone: string): string {
  let cleaned = phone.replace(/^['"]+/, '').trim();
  cleaned = cleaned.replace(/[^0-9]/g, '');
  return cleaned;
}

/**
 * Matches CSV rows to existing Master Data (Business Types, Zones, Profiles)
 */
export function processImportCsv(
  csvRows: string[][],
  masterData: {
    businessTypes: BusinessType[];
    zones: Zone[];
    profiles: Profile[];
    existingProspects: Prospect[];
  }
): {
  validItems: ImportPreviewItem[];
  invalidItems: ImportPreviewItem[];
  headers: string[];
} {
  if (csvRows.length < 2) {
    throw new Error('File CSV kosong atau tidak memiliki baris data.');
  }

  const rawHeaders = csvRows[0].map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));

  // Helper index lookup
  const findHeaderIndex = (...possibleNames: string[]): number => {
    return rawHeaders.findIndex((h) =>
      possibleNames.some((name) => h === name.toLowerCase() || h.includes(name.toLowerCase()))
    );
  };

  const idIdx = findHeaderIndex('id');
  const nameIdx = findHeaderIndex('nama usaha', 'business_name', 'nama toko', 'nama resto');
  const picIdx = findHeaderIndex('nama pic', 'pic_name', 'pemilik', 'pic', 'kontak pic');
  const phoneIdx = findHeaderIndex('no hp', 'phone', 'whatsapp', 'telp', 'wa');
  const typeIdx = findHeaderIndex('jenis usaha', 'business_type', 'tipe usaha', 'kategori');
  const addressIdx = findHeaderIndex('alamat', 'address', 'lokasi');
  const zoneIdx = findHeaderIndex('zone', 'wilayah', 'area');
  const salesIdx = findHeaderIndex('sales', 'pic sales', 'sales penanggung jawab');
  const statusIdx = findHeaderIndex('status');
  const potentialIdx = findHeaderIndex('potensial', 'kebutuhan', 'upselling', 'potential_needs');
  const notesIdx = findHeaderIndex('catatan', 'notes', 'keterangan');
  const latIdx = findHeaderIndex('latitude', 'lat');
  const lonIdx = findHeaderIndex('longitude', 'lon', 'lng');

  if (nameIdx === -1 || phoneIdx === -1) {
    throw new Error(
      'Format CSV tidak sesuai: Kolom "Nama Usaha" dan "No HP / WhatsApp" wajib ada pada baris pertama.'
    );
  }

  const validItems: ImportPreviewItem[] = [];
  const invalidItems: ImportPreviewItem[] = [];

  const defaultTypeId = masterData.businessTypes[0]?.id || 'bt-008';

  // Normalize map lookups
  const businessTypeByName = new Map<string, string>();
  masterData.businessTypes.forEach((b) => {
    businessTypeByName.set(b.name.toLowerCase().trim(), b.id);
    businessTypeByName.set(b.id.toLowerCase().trim(), b.id);
  });

  const zoneByName = new Map<string, string>();
  masterData.zones.forEach((z) => {
    zoneByName.set(z.name.toLowerCase().trim(), z.id);
    zoneByName.set(z.id.toLowerCase().trim(), z.id);
  });

  const salesByName = new Map<string, string>();
  masterData.profiles.forEach((p) => {
    salesByName.set(p.name.toLowerCase().trim(), p.id);
    salesByName.set(p.id.toLowerCase().trim(), p.id);
    salesByName.set(p.email.toLowerCase().trim(), p.id);
  });

  const existingPhoneMap = new Map<string, Prospect>();
  const existingIdMap = new Map<string, Prospect>();
  masterData.existingProspects.forEach((p) => {
    existingIdMap.set(p.id, p);
    const cleanP = cleanImportPhone(p.phone);
    if (cleanP) existingPhoneMap.set(cleanP, p);
  });

  for (let r = 1; r < csvRows.length; r++) {
    const row = csvRows[r];
    if (row.length === 0 || row.every((c) => !c.trim())) continue; // Skip blank lines

    const id = idIdx !== -1 && row[idIdx] ? row[idIdx].replace(/['"]/g, '').trim() : undefined;
    const businessName = (row[nameIdx] || '').replace(/['"]/g, '').trim();
    const picName = (picIdx !== -1 ? row[picIdx] || '' : '').replace(/['"]/g, '').trim() || businessName;
    const rawPhone = row[phoneIdx] || '';
    const phone = cleanImportPhone(rawPhone);
    const rawType = (typeIdx !== -1 ? row[typeIdx] || '' : '').replace(/['"]/g, '').trim();
    const address = (addressIdx !== -1 ? row[addressIdx] || '' : '').replace(/['"]/g, '').trim() || 'Bogor';
    const rawZone = (zoneIdx !== -1 ? row[zoneIdx] || '' : '').replace(/['"]/g, '').trim();
    const rawSales = (salesIdx !== -1 ? row[salesIdx] || '' : '').replace(/['"]/g, '').trim();
    const rawStatus = (statusIdx !== -1 ? row[statusIdx] || '' : '').replace(/['"]/g, '').trim();
    const potentialNeeds = (potentialIdx !== -1 ? row[potentialIdx] || '' : '').replace(/['"]/g, '').trim();
    const notes = (notesIdx !== -1 ? row[notesIdx] || '' : '').replace(/['"]/g, '').trim();
    const rawLat = latIdx !== -1 ? parseFloat(row[latIdx]) : NaN;
    const rawLon = lonIdx !== -1 ? parseFloat(row[lonIdx]) : NaN;

    const errors: string[] = [];

    if (!businessName) errors.push('Nama Usaha tidak boleh kosong');
    if (!phone) errors.push('No HP / WhatsApp tidak valid atau kosong');
    if (phone && phone.length < 7) errors.push('No HP terlalu pendek (< 7 digit)');

    // Status matching
    let status: ProspectStatus = 'Prospect';
    const cleanStatus = rawStatus.toLowerCase();
    if (cleanStatus.includes('customer') || cleanStatus.includes('deal') || cleanStatus.includes('langganan')) {
      status = 'Customer';
    } else if (cleanStatus.includes('follow') || cleanStatus.includes('fu')) {
      status = 'Follow Up';
    } else if (cleanStatus.includes('tidak') || cleanStatus.includes('batal') || cleanStatus.includes('reject')) {
      status = 'Tidak Jadi';
    }

    // Match Business Type
    let matchedBusinessTypeId = defaultTypeId;
    if (rawType) {
      const lower = rawType.toLowerCase();
      for (const [key, val] of businessTypeByName.entries()) {
        if (lower.includes(key) || key.includes(lower)) {
          matchedBusinessTypeId = val;
          break;
        }
      }
    }

    // Match Zone
    let matchedZoneId: string | null = null;
    if (rawZone && rawZone !== '-') {
      const lower = rawZone.toLowerCase();
      for (const [key, val] of zoneByName.entries()) {
        if (lower.includes(key) || key.includes(lower)) {
          matchedZoneId = val;
          break;
        }
      }
    }

    // Match Sales
    let matchedSalesId: string | null = null;
    if (rawSales && rawSales !== '-') {
      const lower = rawSales.toLowerCase();
      for (const [key, val] of salesByName.entries()) {
        if (lower.includes(key) || key.includes(lower)) {
          matchedSalesId = val;
          break;
        }
      }
    }

    const matchedExisting = (id ? existingIdMap.get(id) : null) || existingPhoneMap.get(phone);
    const isExisting = !!matchedExisting;

    const parsedRow: ParsedCsvRow = {
      id: matchedExisting?.id || id,
      business_name: businessName,
      pic_name: picName,
      phone: rawPhone.replace(/^['"]+/, '').trim() || phone,
      business_type_name: rawType,
      address,
      zone_name: rawZone,
      sales_name: rawSales,
      status,
      potential_needs: potentialNeeds,
      notes,
      latitude: !isNaN(rawLat) ? rawLat : null,
      longitude: !isNaN(rawLon) ? rawLon : null,
      gps_captured_at: !isNaN(rawLat) && !isNaN(rawLon) ? new Date().toISOString() : null,
    };

    const item: ImportPreviewItem = {
      rowNumber: r + 1,
      data: parsedRow,
      matchedBusinessTypeId,
      matchedZoneId,
      matchedSalesId,
      isValid: errors.length === 0,
      errors,
      isExisting,
      matchedExistingProspect: matchedExisting,
    };

    if (item.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
    }
  }

  return {
    validItems,
    invalidItems,
    headers: csvRows[0],
  };
}
