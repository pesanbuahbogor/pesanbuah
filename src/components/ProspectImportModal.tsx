import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HelpCircle,
  FileText,
  ArrowRight,
  Database,
} from 'lucide-react';
import { BusinessType, Zone, Profile, Prospect } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { parseCsvText, processImportCsv, ImportPreviewItem } from '../lib/importUtils';
import { getSupabase } from '../lib/supabase';

interface ProspectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessTypes: BusinessType[];
  zones: Zone[];
  profiles: Profile[];
  existingProspects: Prospect[];
}

export const ProspectImportModal: React.FC<ProspectImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessTypes,
  zones,
  profiles,
  existingProspects,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [invalidItems, setInvalidItems] = useState<ImportPreviewItem[]>([]);
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid'>('valid');
  const [importResult, setImportResult] = useState<{ inserted: number; updated: number } | null>(null);

  if (!isOpen) return null;

  const isSupabaseConnected = !!getSupabase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    setIsParsing(true);
    setImportResult(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const rows = parseCsvText(text);

        const { validItems, invalidItems } = processImportCsv(rows, {
          businessTypes,
          zones,
          profiles,
          existingProspects,
        });

        setPreviewItems(validItems);
        setInvalidItems(invalidItems);
        setPreviewTab(validItems.length > 0 ? 'valid' : 'invalid');

        if (validItems.length === 0 && invalidItems.length === 0) {
          toastError('File CSV tidak memiliki baris data.');
        } else {
          success(`File terbaca! Ditemukan ${validItems.length} baris valid.`);
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memproses file CSV.');
        setPreviewItems([]);
        setInvalidItems([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      toastError('Gagal membaca file dari komputer/perangkat.');
      setIsParsing(false);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleStartImport = async () => {
    if (!currentUser || previewItems.length === 0) return;

    setIsImporting(true);
    try {
      const payload = previewItems.map((item) => ({
        id: item.data.id,
        business_name: item.data.business_name,
        pic_name: item.data.pic_name,
        phone: item.data.phone,
        business_type_id: item.matchedBusinessTypeId,
        address: item.data.address,
        zone_id: item.matchedZoneId,
        sales_id: item.matchedSalesId,
        status: item.data.status,
        notes: item.data.notes || null,
        potential_needs: item.data.potential_needs || null,
        latitude: item.data.latitude,
        longitude: item.data.longitude,
        gps_captured_at: item.data.gps_captured_at,
      }));

      const res = await db.importProspectsBatch(payload, currentUser);
      setImportResult(res);
      success(
        `Import Selesai! ${res.inserted} data baru ditambahkan, ${res.updated} data diperbarui.`
      );
      onSuccess();
    } catch (err: any) {
      toastError(err.message || 'Gagal melakukan import data.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = [
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
    ];

    const sampleRow = [
      'Kafe Kopi Kenanga',
      'Mas Budi',
      '081234567890',
      'Cafe & Coffee Shop',
      'Jl. Pajajaran No. 45, Bogor',
      'Zone 1 - Bogor Tengah & Pajajaran',
      'Rian Saputra',
      'Prospect',
      'Sawi, Lemon, Toge, Santan',
      'Butuh pasokan rutin 3x seminggu',
    ];

    const csvContent = '\uFEFF' + [templateHeaders.join(','), sampleRow.join(',')].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_import_calon_customer_pesanbuah.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewItems([]);
    setInvalidItems([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                Import Data Calon Customer dari CSV
              </h3>
              <p className="text-[11px] text-gray-500">
                Pindahkan database atau pulihkan data hasil export CSV / migrasi server.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Target Database:{' '}
                <strong>
                  {isSupabaseConnected ? 'Cloud Supabase (Online)' : 'Penyimpanan Lokal (Offline)'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Unduh Template CSV Standar
            </button>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50/40 rounded-2xl p-8 text-center cursor-pointer transition space-y-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  Klik untuk Memilih File CSV Calon Customer
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mendukung file hasil Export sistem ini maupun CSV buatan Excel (UTF-8)
                </p>
              </div>
              <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs">
                Pilih File .CSV
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-gray-900 truncate">{selectedFile.name}</span>
                  <span className="text-gray-400">
                    ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetImport}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Ganti File
                </button>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="py-8 text-center space-y-2 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs">Menganalisis baris file CSV...</p>
                </div>
              )}

              {/* Import Completed Result Box */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Proses Import Berhasil Selesai!
                  </div>
                  <p>
                    Database telah berhasil diperbarui dengan data dari file CSV:{' '}
                    <strong>{importResult.inserted} data baru</strong> dimasukkan, dan{' '}
                    <strong>{importResult.updated} data yang cocok</strong> berhasil diperbarui.
                  </p>
                </div>
              )}

              {/* Preview Table & Tabs */}
              {!isParsing && (previewItems.length > 0 || invalidItems.length > 0) && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('valid')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                          previewTab === 'valid'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap Diimport ({previewItems.length})
                      </button>
                      {invalidItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewTab('invalid')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                            previewTab === 'invalid'
                              ? 'bg-rose-600 text-white'
                              : 'bg-gray-100 text-rose-700 hover:bg-gray-200'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Baris Tidak Valid ({invalidItems.length})
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-500">
                      Total {previewItems.length + invalidItems.length} baris
                    </span>
                  </div>

                  {/* Valid Table */}
                  {previewTab === 'valid' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3">No</th>
                            <th className="py-2 px-3">Nama Usaha / PIC</th>
                            <th className="py-2 px-3">No HP / WA</th>
                            <th className="py-2 px-3">Jenis Usaha</th>
                            <th className="py-2 px-3">Potensial Kebutuhan</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80">
                              <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">
                                {item.rowNumber}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-bold text-gray-900">
                                  {item.data.business_name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  PIC: {item.data.pic_name}
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono font-medium text-gray-800">
                                {item.data.phone}
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {businessTypes.find((t) => t.id === item.matchedBusinessTypeId)
                                  ?.name || item.data.business_type_name}
                              </td>
                              <td className="py-2 px-3">
                                {item.data.potential_needs ? (
                                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 truncate max-w-[130px] block">
                                    {item.data.potential_needs}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[10px]">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border">
                                  {item.data.status}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {item.isExisting ? (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Update Data Lama
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Data Baru
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Invalid Table */}
                  {previewTab === 'invalid' && (
                    <div className="border border-rose-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-rose-50 text-[10px] font-bold text-rose-700 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Baris</th>
                            <th className="py-2 px-3">Nama Usaha</th>
                            <th className="py-2 px-3">No HP</th>
                            <th className="py-2 px-3">Penyebab Gagal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {invalidItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/50">
                              <td className="py-2 px-3 font-mono text-gray-500">
                                #{item.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-semibold text-gray-800">
                                {item.data.business_name || '(Kosong)'}
                              </td>
                              <td className="py-2 px-3 font-mono text-gray-600">
                                {item.data.phone || '(Kosong)'}
                              </td>
                              <td className="py-2 px-3 text-rose-600 font-medium">
                                {item.errors.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition cursor-pointer"
          >
            {importResult ? 'Selesai & Tutup' : 'Batal'}
          </button>

          {previewItems.length > 0 && !importResult && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengimpor {previewItems.length} Data...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Import ({previewItems.length} Data)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
