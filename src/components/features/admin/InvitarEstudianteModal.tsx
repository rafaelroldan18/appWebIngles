import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { InvitationService } from '@/services/invitation.service';
import { ParallelService } from '@/services/parallel.service';
import type { Parallel } from '@/types/parallel.types';
import { UserPlus, X, Mail, CheckCircle, Users, Upload, Download, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InvitarEstudianteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvitarEstudianteModal({ onClose, onSuccess }: InvitarEstudianteModalProps) {
  const { usuario } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [parallels, setParallels] = useState<Parallel[]>([]);
  const [selectedParallel, setSelectedParallel] = useState<string>('');

  // Bulk upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<number>(0);

  // Load parallels on mount
  useEffect(() => {
    const loadParallels = async () => {
      try {
        if (!usuario) return;

        let data;
        if (usuario.role === 'docente') {
          data = await ParallelService.getTeacherParallels(usuario.user_id);
        } else {
          data = await ParallelService.getAll();
        }
        setParallels(data);
      } catch (err) {
        console.error('Error loading parallels:', err);
      }
    };
    loadParallels();
  }, [usuario]);

  const validation = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      id_card: '',
      email: '',
    },
    validationRules: {
      first_name: commonValidations.name,
      last_name: commonValidations.name,
      id_card: commonValidations.idCard,
      email: commonValidations.email,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    // Validate parallel selection
    if (!selectedParallel) {
      setError('Debe seleccionar un paralelo para el estudiante');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await InvitationService.create({
        email: validation.values.email,
        first_name: validation.values.first_name,
        last_name: validation.values.last_name,
        id_card: validation.values.id_card,
        role: 'estudiante',
        parallel_id: selectedParallel,
      });

      if (result.success) {
        setShowSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear invitación');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch(`/api/invitations/template?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_invitaciones_estudiantes.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error al descargar plantilla');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Por favor selecciona un archivo CSV o Excel (.csv, .xlsx, .xls)');
        return;
      }

      setSelectedFile(file);
      setUploadErrors([]);
      setUploadSuccess(0);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const student: any = {};
        headers.forEach((header, index) => {
          student[header] = values[index];
        });
        students.push(student);
      }
    }

    return students;
  };



  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          // Normalize keys to lowercase for consistency
          const normalizedData = jsonData.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
              newRow[key.trim().toLowerCase()] = row[key];
            });
            return newRow;
          });

          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleBulkUpload = async () => {
    if (!selectedParallel) {
      alert('Por favor selecciona un paralelo para los estudiantes');
      return;
    }

    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(10);

      let students: any[] = [];

      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        setUploadProgress(30);
        students = parseCSV(text);
      } else {
        // Excel files
        students = await readExcel(selectedFile);
        setUploadProgress(30);
      }

      if (students.length === 0) {
        alert('El archivo no contiene datos válidos');
        setLoading(false);
        return;
      }

      setUploadProgress(50);

      const response = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students,
          parallel_id: selectedParallel
        }),
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!response.ok) {
        setUploadErrors(data.details || [data.error]);
        setLoading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(100);
      setUploadSuccess(data.created || 0);

      setTimeout(() => {
        setShowSuccess(true);
        setLoading(false);
      }, 500);

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadErrors(['Error al procesar el archivo']);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="bg-orange-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {showSuccess ? t.invitations.successTitle : t.invitations.createTitle}
            </h3>
          </div>
          <button
            onClick={handleClose}
            aria-label={t.common.close}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-90"
          >
            <X className="w-5 h-5 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {showSuccess ? (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  {mode === 'individual'
                    ? t.invitations.messages.successIndividual
                    : `¡${uploadSuccess} ${t.invitations.messages.successBulk}`}
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                  {mode === 'individual'
                    ? `${t.invitations.messages.sentTo} ${validation.values.email}.`
                    : t.invitations.messages.bulkSent}
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    {t.invitations.messages.important}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t.invitations.messages.importantNote}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
              >
                {t.common.close}
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 p-4 bg-slate-50 dark:bg-gray-900">
                <button
                  onClick={() => setMode('individual')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-4 ${mode === 'individual'
                    ? 'bg-orange-600 text-white shadow-sm focus:ring-orange-300'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 focus:ring-slate-300'
                    }`}
                >
                  <UserPlus className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                  {t.invitations.form.individual}
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-4 ${mode === 'bulk'
                    ? 'bg-orange-600 text-white shadow-sm focus:ring-orange-300'
                    : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 focus:ring-slate-300'
                    }`}
                >
                  <Users className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                  {t.invitations.form.bulk}
                </button>
              </div>

              {mode === 'individual' ? (
                <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder={t.invitations.form.name}
                      value={validation.values.first_name}
                      onChange={(e) => validation.handleChange('first_name', e.target.value)}
                      onBlur={() => validation.handleBlur('first_name')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.first_name && validation.touched.first_name
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    />
                    {validation.errors.first_name && validation.touched.first_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={t.invitations.form.lastName}
                      value={validation.values.last_name}
                      onChange={(e) => validation.handleChange('last_name', e.target.value)}
                      onBlur={() => validation.handleBlur('last_name')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.last_name && validation.touched.last_name
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    />
                    {validation.errors.last_name && validation.touched.last_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={t.invitations.form.idCard}
                      value={validation.values.id_card}
                      onChange={(e) => validation.handleChange('id_card', e.target.value)}
                      onBlur={() => validation.handleBlur('id_card')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.id_card && validation.touched.id_card
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    />
                    {validation.errors.id_card && validation.touched.id_card && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.id_card}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder={t.invitations.form.email}
                      value={validation.values.email}
                      onChange={(e) => validation.handleChange('email', e.target.value)}
                      onBlur={() => validation.handleBlur('email')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.email && validation.touched.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    />
                    {validation.errors.email && validation.touched.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.email}
                      </p>
                    )}
                  </div>

                  {/* Parallel Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      {t.invitations.form.parallel} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedParallel}
                      onChange={(e) => setSelectedParallel(e.target.value)}
                      required
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${!selectedParallel && error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    >
                      <option value="">{t.invitations.form.selectParallel}</option>
                      {parallels.map((parallel) => (
                        <option key={parallel.parallel_id} value={parallel.parallel_id}>
                          {parallel.name} - {parallel.academic_year}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      {t.invitations.form.assignmentNote}
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-xs text-orange-800 dark:text-orange-300">
                        {t.invitations.form.emailNote}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-300"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
                    >
                      {loading ? t.invitations.form.sending : t.invitations.form.send}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Download Template Buttons - Compact Design */}
                  <div className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-2">
                      {t.invitations.form.downloadTemplate}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadTemplate('csv')}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95"
                      >
                        <FileText className="w-4 h-4" aria-hidden="true" />
                        CSV
                      </button>
                      <button
                        onClick={() => downloadTemplate('xlsx')}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                        XLSX
                      </button>
                    </div>
                  </div>

                  {/* Parallel Selection for Bulk */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      {t.invitations.form.parallel} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedParallel}
                      onChange={(e) => setSelectedParallel(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${!selectedParallel && uploadErrors.length > 0
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                        }`}
                    >
                      <option value="">{t.invitations.form.selectParallel}</option>
                      {parallels.map((parallel) => (
                        <option key={parallel.parallel_id} value={parallel.parallel_id}>
                          {parallel.name} - {parallel.academic_year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">

                      <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="text-xs text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">{t.invitations.form.instructions}</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Descarga la plantilla en el formato que prefieras</li>
                          <li>Completa los datos de los estudiantes</li>
                          <li>Guarda el archivo</li>
                          <li>Sube el archivo completado</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${selectedFile
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : 'border-slate-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-600'
                    }`}>
                    {selectedFile ? (
                      <>
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                          {t.invitations.form.fileSelected}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                          {selectedFile.name}
                        </p>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          {t.invitations.form.changeFile}
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">
                          {t.invitations.form.upload}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
                          {t.invitations.form.formats}
                        </p>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload-bulk"
                        />
                        <label
                          htmlFor="file-upload-bulk"
                          className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
                        >
                          {t.invitations.form.selectFile}
                        </label>
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {loading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700 dark:text-gray-300">{t.invitations.form.bulkProcessing}</span>
                        <span className="text-slate-700 dark:text-gray-300 font-semibold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {uploadErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                          {t.invitations.messages.errorValidation}
                        </p>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-red-700 dark:text-red-300 ml-7">
                        {uploadErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!selectedFile || loading}
                      className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
                    >
                      {loading ? t.invitations.form.bulkProcessing : t.invitations.form.bulkSend}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
