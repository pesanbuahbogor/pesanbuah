import { Prospect, BusinessType, Zone, Profile } from '../types';

interface ExportContext {
  businessTypeMap: Map<string, string>;
  zoneMap: Map<string, string>;
  profileMap: Map<string, string>;
}

function escapeCsvField(field: string | number | null | undefined): string {
  if (field == null) return '""';
  const str = String(field);
  // If field contains quotes, commas, newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates and downloads a CSV file formatted for Excel (with UTF-8 BOM)
 */
export function exportProspectsToCsv(prospects: Prospect[], ctx: ExportContext, filenamePrefix = 'data_calon_customer_pesanbuah') {
  const headers = [
    'ID',
    'Nama Usaha',
    'Nama PIC',
    'No HP / WhatsApp',
    'Jenis Usaha',
    'Alamat Lengkap',
    'Zone / Wilayah',
    'Sales Penanggung Jawab',
    'Status Prospek',
    'Potensial Kebutuhan Tambahan (Upselling)',
    'Catatan Sales',
    'Latitude',
    'Longitude',
    'Waktu Catat GPS',
    'Tanggal Dibuat',
    'Tanggal Diperbarui',
  ];

  const rows = prospects.map((p) => {
    const businessType = ctx.businessTypeMap.get(p.business_type_id) || 'Lainnya';
    const zone = p.zone_id ? (ctx.zoneMap.get(p.zone_id) || '-') : '-';
    const sales = p.sales_id ? (ctx.profileMap.get(p.sales_id) || '-') : '-';
    const cleanPhone = `'${p.phone}`; // Prefix with single quote to preserve leading 0 in Excel

    return [
      escapeCsvField(p.id),
      escapeCsvField(p.business_name),
      escapeCsvField(p.pic_name),
      escapeCsvField(cleanPhone),
      escapeCsvField(businessType),
      escapeCsvField(p.address),
      escapeCsvField(zone),
      escapeCsvField(sales),
      escapeCsvField(p.status),
      escapeCsvField(p.potential_needs || '-'),
      escapeCsvField(p.notes || '-'),
      escapeCsvField(p.latitude ?? ''),
      escapeCsvField(p.longitude ?? ''),
      escapeCsvField(p.gps_captured_at ? new Date(p.gps_captured_at).toLocaleString('id-ID') : ''),
      escapeCsvField(new Date(p.created_at).toLocaleString('id-ID')),
      escapeCsvField(new Date(p.updated_at).toLocaleString('id-ID')),
    ].join(',');
  });

  // Include UTF-8 BOM so Excel opens accents and special characters without encoding errors
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an HTML-based XLS spreadsheet compatible with Microsoft Excel, LibreOffice, and Google Sheets
 */
export function exportProspectsToXls(prospects: Prospect[], ctx: ExportContext, filenamePrefix = 'data_calon_customer_pesanbuah') {
  const tableRows = prospects.map((p) => {
    const businessType = ctx.businessTypeMap.get(p.business_type_id) || 'Lainnya';
    const zone = p.zone_id ? (ctx.zoneMap.get(p.zone_id) || '-') : '-';
    const sales = p.sales_id ? (ctx.profileMap.get(p.sales_id) || '-') : '-';

    return `
      <tr>
        <td style="mso-number-format:'\\@';">${escapeXml(p.id)}</td>
        <td style="font-weight:bold;">${escapeXml(p.business_name)}</td>
        <td>${escapeXml(p.pic_name)}</td>
        <td style="mso-number-format:'\\@'; font-weight:bold;">${escapeXml(p.phone)}</td>
        <td>${escapeXml(businessType)}</td>
        <td>${escapeXml(p.address)}</td>
        <td>${escapeXml(zone)}</td>
        <td>${escapeXml(sales)}</td>
        <td style="font-weight:bold; color:${getStatusColor(p.status)};">${escapeXml(p.status)}</td>
        <td style="background-color:#ecfdf5; color:#065f46; font-weight:bold;">${escapeXml(p.potential_needs || '-')}</td>
        <td>${escapeXml(p.notes || '-')}</td>
        <td style="mso-number-format:'0\\.000000';">${p.latitude ?? ''}</td>
        <td style="mso-number-format:'0\\.000000';">${p.longitude ?? ''}</td>
        <td>${p.gps_captured_at ? new Date(p.gps_captured_at).toLocaleString('id-ID') : '-'}</td>
        <td>${new Date(p.created_at).toLocaleString('id-ID')}</td>
        <td>${new Date(p.updated_at).toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Database Calon Customer</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 8px 12px; text-align: left; }
          td { border: 1px solid #d1d5db; padding: 6px 10px; }
          tr:nth-child(even) { background-color: #f9fafb; }
        </style>
      </head>
      <body>
        <h2>Laporan Database Calon Customer (Prospect) - PesanBuah.id</h2>
        <p>Tanggal Unduh: ${new Date().toLocaleString('id-ID')} | Total Data: ${prospects.length} Data</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Usaha</th>
              <th>Nama PIC</th>
              <th>No HP / WhatsApp</th>
              <th>Jenis Usaha</th>
              <th>Alamat Usaha</th>
              <th>Zone / Wilayah</th>
              <th>Sales Penanggung Jawab</th>
              <th>Status</th>
              <th>Potensial Kebutuhan Tambahan (Upselling)</th>
              <th>Catatan Tambahan</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Waktu GPS</th>
              <th>Dibuat</th>
              <th>Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Customer':
      return '#059669'; // Emerald
    case 'Follow Up':
      return '#d97706'; // Amber
    case 'Tidak Jadi':
      return '#e11d48'; // Rose
    default:
      return '#2563eb'; // Blue
  }
}
