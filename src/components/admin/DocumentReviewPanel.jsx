import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Admin-facing panel to fetch and view documents for an application.
 * Shows Ghana card (front/back) and selfie so the admin can visually verify identity.
 */
export default function DocumentReviewPanel() {
  const { authFetch } = useAuth();
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);

  const loadDocuments = async () => {
    if (!applicationId.trim()) {
      setError('Enter an application ID to load documents');
      return;
    }
    setLoading(true);
    setError('');
    setDocuments([]);
    
    try {
      const url = `/api/documents/review/${applicationId.trim()}`;
      const fullUrl = `${window.location.origin}${url}`;
      console.log(`[DocumentReviewPanel] Current page:`, window.location.href);
      console.log(`[DocumentReviewPanel] Fetching:`, url);
      console.log(`[DocumentReviewPanel] Full URL:`, fullUrl);
      console.log(`[DocumentReviewPanel] Browser supports fetch:`, typeof fetch !== 'undefined');
      
      let res;
      try {
        res = await authFetch(url, {
          method: 'GET',
        });
      } catch (networkErr) {
        console.error(`[DocumentReviewPanel] Network error details:`, {
          name: networkErr.name,
          message: networkErr.message,
          stack: networkErr.stack,
          cause: networkErr.cause,
          url: url,
          fullUrl: fullUrl
        });
        
        // Check if it's a CORS or network connectivity issue
        if (networkErr.message === 'Failed to fetch') {
          throw new Error(
            `Browser blocked the request. This could be due to:\n` +
            `1. Ad blocker or browser extension\n` +
            `2. CORS issue (check browser console for CORS errors)\n` +
            `3. Backend not running (check http://localhost:3000/health in new tab)\n` +
            `4. Try disabling browser extensions and retry\n\n` +
            `URL: ${url}`
          );
        }
        
        throw new Error(
          `Network error: Could not reach ${url}. ` +
          `Make sure the backend server is running on port 3000. ` +
          `Original error: ${networkErr.message}`
        );
      }
      
      console.log(`[DocumentReviewPanel] Response status: ${res.status}`);
      console.log(`[DocumentReviewPanel] Content-Type: ${res.headers.get('content-type')}`);
      
      // Handle redirects (302 = no documents found, returning placeholder)
      if (res.status === 302) {
        console.log('[DocumentReviewPanel] No documents found (302 redirect)');
        setError('No documents uploaded yet for this application. Please upload Ghana Card, ID, and selfie first.');
        setDocuments([]);
        return;
      }
      
      let data;
      let textContent;
      try {
        textContent = await res.text();
        data = JSON.parse(textContent);
      } catch (parseErr) {
        const preview = textContent?.substring(0, 200) || 'No response body';
        console.error(`[DocumentReviewPanel] JSON parse error. Response: ${preview}`);
        throw new Error(
          `API returned invalid JSON (status ${res.status}). ` +
          `Endpoint: ${url}. ` +
          `Response preview: ${preview}`
        );
      }
      
      if (!res.ok) {
        throw new Error(data?.errors?.[0] || data?.message || `API returned ${res.status}`);
      }
      
      const documents = data?.data?.documents || [];
      console.log(`[DocumentReviewPanel] Loaded ${documents.length} documents`);
      setDocuments(documents);
      
      if (!documents.length) {
        setError('No documents found for this application');
      }
    } catch (err) {
      console.error('[DocumentReviewPanel] Error:', err);
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Application ID or Reference</label>
          <input
            type="text"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="Paste application UUID or reference (APP-2024-0012)"
            className="w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-500">Accepts either UUID or application reference (APP-YYYY-XXXX)</p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load Documents'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.documentId} className="border rounded-lg overflow-hidden shadow-sm">
            <div className="p-3 border-b">
              <p className="text-sm font-semibold text-gray-800">{doc.documentType}</p>
              <p className="text-xs text-gray-500">{doc.mimeType}</p>
            </div>
            <div className="bg-gray-50">
              <img
                src={doc.url}
                alt={doc.documentType}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-3 text-xs text-gray-500 space-y-1">
              <p>Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'n/a'}</p>
              <a
                className="text-emerald-600 font-semibold hover:underline"
                href={doc.url}
                target="_blank"
                rel="noreferrer"
              >
                Open full size
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
