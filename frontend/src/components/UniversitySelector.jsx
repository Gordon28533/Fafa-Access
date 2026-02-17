/**
 * University Selector Component
 * 
 * Component for students to select a university during application.
 * Only displays active universities that are accepting applications.
 * 
 * FEATURES:
 * - Dropdown list of active universities
 * - Search/filter universities
 * - Validation
 * - Error handling
 * 
 * PROPS:
 * - value: Selected university ID
 * - onChange: Callback when selection changes
 * - error: Error message to display
 * - disabled: Disable the selector
 * - required: Mark as required field
 * 
 * Created: February 8, 2024
 */

import React, { useState, useEffect } from 'react';

export default function UniversitySelector({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  showCode = false
}) {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/universities', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }

      const result = await response.json();
      setUniversities(result.data.universities);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter universities based on search
  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.code && u.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUniversity = universities.find(u => u.id === value);

  const handleSelect = (uni) => {
    onChange(uni.id);
    setShowDropdown(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <label style={styles.label}>
          Select University {required && <span style={styles.required}>*</span>}
        </label>
        <div style={styles.skeleton}>
          <div style={styles.skeletonLine}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        Select University {required && <span style={styles.required}>*</span>}
      </label>

      <div style={styles.selectorWrapper}>
        {/* Main Input */}
        <div
          style={{
            ...styles.selectorInput,
            ...(error && styles.errorBorder),
            ...(disabled && styles.disabled)
          }}
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
        >
          {selectedUniversity ? (
            <div style={styles.selectedValue}>
              <div style={styles.selectedName}>{selectedUniversity.name}</div>
              {showCode && selectedUniversity.code && (
                <div style={styles.selectedCode}>{selectedUniversity.code}</div>
              )}
            </div>
          ) : (
            <div style={styles.placeholder}>Choose a university...</div>
          )}
          <div style={styles.chevron}>
            {showDropdown ? '▲' : '▼'}
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && !disabled && (
          <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />

            {/* Options */}
            <div style={styles.optionsList}>
              {filtered.length > 0 ? (
                filtered.map(uni => (
                  <div
                    key={uni.id}
                    style={{
                      ...styles.option,
                      ...(value === uni.id && styles.optionSelected)
                    }}
                    onClick={() => handleSelect(uni)}
                  >
                    <div>
                      <div style={styles.optionName}>{uni.name}</div>
                      {uni.address && (
                        <div style={styles.optionAddress}>{uni.address}</div>
                      )}
                    </div>
                    {showCode && uni.code && (
                      <div style={styles.optionCode}>{uni.code}</div>
                    )}
                    {value === uni.id && (
                      <div style={styles.checkmark}>✓</div>
                    )}
                  </div>
                ))
              ) : (
                <div style={styles.noResults}>
                  {searchTerm
                    ? 'No universities match your search'
                    : 'No universities available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div style={styles.errorMessage}>{error}</div>}

      {/* Help Text */}
      {universities.length === 0 && !loading && (
        <div style={styles.helpText}>
          No universities are currently available. Please try again later.
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    marginBottom: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333'
  },
  required: {
    color: '#dc3545',
    marginLeft: '0.25rem'
  },
  selectorWrapper: {
    position: 'relative'
  },
  selectorInput: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '0.375rem',
    backgroundColor: '#fff',
    cursor: 'pointer',
    minHeight: '44px',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  errorBorder: {
    borderColor: '#dc3545',
    boxShadow: '0 0 0 0.2rem rgba(220, 53, 69, 0.25)'
  },
  disabled: {
    backgroundColor: '#f8f9fa',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  selectedValue: {
    flex: 1,
    textAlign: 'left'
  },
  selectedName: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333'
  },
  selectedCode: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.25rem'
  },
  placeholder: {
    fontSize: '0.95rem',
    color: '#999'
  },
  chevron: {
    fontSize: '0.75rem',
    color: '#666',
    marginLeft: '0.75rem',
    transition: 'transform 0.2s'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.25rem)',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '0.375rem',
    boxShadow:
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    maxHeight: '300px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  searchInput: {
    flex: '0 0 auto',
    padding: '0.75rem 1rem',
    border: 'none',
    borderBottom: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit'
  },
  optionsList: {
    flex: '1',
    overflow: 'y',
    overflowY: 'auto'
  },
  option: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.15s'
  },
  optionSelected: {
    backgroundColor: '#e7f3ff',
    borderLeftWidth: '3px',
    borderLeftColor: '#0d6efd',
    borderLeftStyle: 'solid',
    paddingLeft: 'calc(1rem - 3px)'
  },
  optionName: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333'
  },
  optionAddress: {
    fontSize: '0.8rem',
    color: '#999',
    marginTop: '0.2rem'
  },
  optionCode: {
    fontSize: '0.8rem',
    backgroundColor: '#f0f0f0',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    color: '#666',
    marginLeft: '0.5rem',
    whiteSpace: 'nowrap'
  },
  checkmark: {
    color: '#28a745',
    fontWeight: 'bold',
    marginLeft: '0.5rem'
  },
  noResults: {
    padding: '1rem',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.9rem'
  },
  errorMessage: {
    marginTop: '0.375rem',
    fontSize: '0.875rem',
    color: '#dc3545'
  },
  helpText: {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    color: '#999',
    fontStyle: 'italic'
  },
  skeleton: {
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '0.375rem'
  },
  skeletonLine: {
    height: '1rem',
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem',
    animation: 'pulse 1.5s infinite'
  }
};

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(styleSheet);
}
