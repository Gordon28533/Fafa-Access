import React, { useState, useEffect } from 'react';
import { X, Download, Filter, Calendar } from 'lucide-react';
import '../styles/export-modal.css';

type ExportType = 'applications' | 'payments' | 'deliveries' | 'analytics' | 'comprehensive';
type ExportFormat = 'csv' | 'json' | 'pdf';

interface University {
  id: string;
  name: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState<ExportType>('applications');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [status, setStatus] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch universities for filter
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUniversities(data.universities || []);
        }
      } catch (err) {
        console.error('Failed to fetch universities:', err);
      }
    };

    if (isOpen) {
      fetchUniversities();
      // Set default dates (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setEndDate(today.toISOString().split('T')[0]);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Update format options based on export type
  useEffect(() => {
    if (exportType === 'analytics') {
      setFormat('json');
    } else if (exportType === 'comprehensive') {
      setFormat('pdf');
    } else {
      setFormat('csv');
    }
  }, [exportType]);

  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (universityId) params.append('universityId', universityId);
      if (status) {
        if (exportType === 'applications') params.append('status', status);
        if (exportType === 'payments') params.append('paymentStatus', status);
        if (exportType === 'deliveries') params.append('deliveryStatus', status);
      }

      // Build endpoint URL
      let endpoint = '';
      if (exportType === 'analytics') {
        endpoint = `/api/admin/export/analytics/json?${params.toString()}`;
      } else if (exportType === 'comprehensive') {
        endpoint = `/api/admin/export/comprehensive/pdf?${params.toString()}`;
      } else {
        endpoint = `/api/admin/export/${exportType}/${format}?${params.toString()}`;
      }

      // Make request
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Handle download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export-${exportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Close modal on success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = () => {
    switch (exportType) {
      case 'applications':
        return [
          { value: '', label: 'All Statuses' },
          { value: 'PENDING_SRC_REVIEW', label: 'Pending SRC Review' },
          { value: 'SRC_APPROVED', label: 'SRC Approved' },
          { value: 'SRC_REJECTED', label: 'SRC Rejected' },
          { value: 'PENDING_ADMIN_REVIEW', label: 'Pending Admin Review' },
          { value: 'ADMIN_APPROVED', label: 'Admin Approved' },
          { value: 'ADMIN_REJECTED', label: 'Admin Rejected' },
        ];
      case 'payments':
        return [
          { value: '', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'VERIFIED', label: 'Verified' },
          { value: 'FAILED', label: 'Failed' },
        ];
      case 'deliveries':
        return [
          { value: '', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'DELIVERED', label: 'Delivered' },
        ];
      default:
        return [];
    }
  };

  const getFormatOptions = () => {
    if (exportType === 'analytics') {
      return [{ value: 'json', label: 'JSON' }];
    }
    if (exportType === 'comprehensive') {
      return [{ value: 'pdf', label: 'PDF/HTML' }];
    }
    return [{ value: 'csv', label: 'CSV' }];
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>
            <Download size={24} />
            Export Reports
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="export-modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Export Type Selection */}
          <div className="form-group">
            <label htmlFor="export-type">
              <Filter size={16} />
              Report Type
            </label>
            <select
              id="export-type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
              disabled={loading}
            >
              <option value="applications">Applications</option>
              <option value="payments">Payments</option>
              <option value="deliveries">Deliveries</option>
              <option value="analytics">Analytics Summary</option>
              <option value="comprehensive">Comprehensive Report</option>
            </select>
          </div>

          {/* Format Selection */}
          <div className="form-group">
            <label htmlFor="format">
              <Download size={16} />
              Format
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              disabled={loading || exportType === 'analytics' || exportType === 'comprehensive'}
            >
              {getFormatOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {exportType === 'comprehensive' && (
              <small className="form-hint">PDF reports are generated as HTML for browser printing</small>
            )}
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">
                <Calendar size={16} />
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-date">
                <Calendar size={16} />
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* University Filter */}
          <div className="form-group">
            <label htmlFor="university">
              <Filter size={16} />
              University (Optional)
            </label>
            <select
              id="university"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              disabled={loading}
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (only for applications, payments, deliveries) */}
          {exportType !== 'analytics' && exportType !== 'comprehensive' && (
            <div className="form-group">
              <label htmlFor="status">
                <Filter size={16} />
                Status (Optional)
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <p>
              <strong>Note:</strong> Exports are filtered based on the selected criteria. 
              Large datasets may take a few moments to generate.
            </p>
          </div>
        </div>

        <div className="export-modal-footer">
          <button
            className="button-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
