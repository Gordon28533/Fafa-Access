/**
 * SRC Agreement Acceptance Page
 * 
 * Public-facing page for SRC officers to:
 * - View their invitation details
 * - Read partnership agreement
 * - Accept or reject
 * 
 * Route: /src/accept/:token
 * Auth: None (token-based)
 * 
 * Created: February 8, 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SRCAgreementAcceptance.css';

export default function SRCAgreementAcceptance() {
  const { token } = useParams();
  const navigate = useNavigate();

  // State
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load invitation details
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, fetchInvitation]);

  const fetchInvitation = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/src/invitations/${token}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Invalid or expired invitation');
      }

      const result = await response.json();
      setInvitation(result.data.invitation);
      setAccepted(result.data.invitation.agreementAccepted);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAcceptAgreement = async () => {
    if (!agreedToTerms) {
      setError('You must accept the partnership agreement to continue');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/src/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          agree: true,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to accept agreement');
      }

      setSuccess(true);
      setAccepted(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error accepting agreement:', err);
      setError(err.message || 'Failed to accept agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="src-acceptance-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="src-acceptance-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h1>Invalid Invitation</h1>
          <p>{error}</p>
          <p className="help-text">
            If you believe this is an error, please contact your administrator for a new invitation link.
          </p>
          <a href="/" className="btn btn-primary">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="src-acceptance-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h1>Invitation Not Found</h1>
          <p>We could not find your invitation. Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="src-acceptance-container">
        <div className="success-state">
          <div className="success-icon">✅</div>
          <h1>Agreement Accepted!</h1>
          <p>Thank you, {invitation.firstName}!</p>
          <div className="success-details">
            <p>Your partnership agreement has been successfully accepted.</p>
            <p>An administrator will now:</p>
            <ul>
              <li>Review your information</li>
              <li>Verify your details</li>
              <li>Contact you within 24 hours to complete account setup</li>
            </ul>
            <p className="contact-info">
              You will receive an email with the next steps at <strong>{invitation.email}</strong>
            </p>
          </div>
          <p className="redirect-text">Redirecting you home in a few seconds...</p>
          <a href="/" className="btn btn-primary">
            Return to Home Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="src-acceptance-container">
      {/* Header Card */}
      <div className="header-card">
        <div className="header-content">
          <h1>🎓 SRC Partnership Agreement</h1>
          <p className="subtitle">Review and accept the partnership agreement</p>
        </div>
        <div className="invitation-info">
          <div className="info-item">
            <span className="info-label">For:</span>
            <span className="info-value">
              {invitation.firstName} {invitation.lastName}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">University:</span>
            <span className="info-value">{invitation.universityName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Expires:</span>
            <span className="info-value">{new Date(invitation.tokenExpiry).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Already Accepted */}
      {accepted && !success && (
        <div className="alert alert-info">
          ℹ️ You have already accepted this agreement. An administrator will contact you soon to complete account
          setup.
        </div>
      )}

      {/* Agreement Content */}
      <div className="agreement-container">
        <div className="agreement-section">
          <h2>📋 Partnership Agreement</h2>
          <p className="section-intro">
            By accepting this agreement, you commit to serving as an SRC (Student Representative Council) Officer for{' '}
            <strong>{invitation.universityName}</strong>.
            Please read and understand all terms before accepting.
          </p>
        </div>

        {/* 1. Rights & Responsibilities */}
        <div className="agreement-section">
          <h3>1. Rights & Responsibilities</h3>
          <p>As an SRC officer, you have the right and responsibility to:</p>
          <ul>
            <li>Review student applications and provide fair, unbiased assessments</li>
            <li>Represent your university's interests with professionalism and integrity</li>
            <li>Participate in regular meetings and training sessions</li>
            <li>Maintain accurate records of all decisions and communications</li>
            <li>Escalate conflicts of interest to administration immediately</li>
          </ul>
        </div>

        {/* 2. Data Confidentiality */}
        <div className="agreement-section">
          <h3>2. Data Confidentiality & Protection</h3>
          <ul>
            <li>
              <strong>Strictly confidential:</strong> All student data, university information, and system details are
              strictly confidential
            </li>
            <li>
              <strong>No sharing:</strong> You may not share, discuss, or disclose any information outside of your official
              duties
            </li>
            <li>
              <strong>GDPR/Data Protection:</strong> You must comply with all applicable data protection regulations
            </li>
            <li>
              <strong>After offboarding:</strong> All access will be revoked and data must not be retained after your role
              ends
            </li>
          </ul>
        </div>

        {/* 3. Account Security */}
        <div className="agreement-section">
          <h3>3. Account Security & Access</h3>
          <ul>
            <li>
              <strong>Password security:</strong> Create a strong password and change it regularly
            </li>
            <li>
              <strong>No sharing:</strong> Never share your login credentials with anyone
            </li>
            <li>
              <strong>Logout:</strong> Always logout when leaving your device unattended
            </li>
            <li>
              <strong>Suspicious activity:</strong> Report any unauthorized access immediately
            </li>
            <li>
              <strong>2FA:</strong> You are required to enable two-factor authentication
            </li>
          </ul>
        </div>

        {/* 4. Acceptable Use Policy */}
        <div className="agreement-section">
          <h3>4. Acceptable Use Policy</h3>
          <p>You must use the system responsibly and agree not to:</p>
          <ul>
            <li>Attempt to access unauthorized areas or other users' accounts</li>
            <li>Share your login credentials or provide access to others</li>
            <li>Download, export, or store student data outside the system</li>
            <li>Make decisions based on personal relationships or biases</li>
            <li>Discuss application details in public or outside official channels</li>
            <li>Use the system for any purpose other than official duties</li>
          </ul>
        </div>

        {/* 5. Conduct Standards */}
        <div className="agreement-section">
          <h3>5. Professional Conduct Standards</h3>
          <ul>
            <li>
              <strong>Professionalism:</strong> Maintain professional conduct in all communications and decisions
            </li>
            <li>
              <strong>Fairness:</strong> Treat all applications and applicants fairly without discrimination
            </li>
            <li>
              <strong>Conflicts of interest:</strong> Disclose any conflicts of interest immediately
            </li>
            <li>
              <strong>Communication:</strong> Respond to requests and queries in a timely manner
            </li>
            <li>
              <strong>Training:</strong> Complete any required training and stay updated on policies
            </li>
          </ul>
        </div>

        {/* 6. Termination */}
        <div className="agreement-section">
          <h3>6. Termination & Offboarding</h3>
          <ul>
            <li>Either party may terminate this agreement with written notice</li>
            <li>Upon termination, all access will be revoked immediately</li>
            <li>You will return any sensitive materials or documentation</li>
            <li>Non-disclosure obligations continue after termination</li>
          </ul>
        </div>

        {/* 7. Support & Escalation */}
        <div className="agreement-section">
          <h3>7. Support & Escalation</h3>
          <ul>
            <li>Technical support: Contact the admin team for system issues</li>
            <li>Questions about policies: Reach out to your designated administrator</li>
            <li>Escalations: Use the official escalation channels for complex situations</li>
            <li>Training: Ongoing training and documentation will be provided</li>
          </ul>
        </div>

        {/* Acceptance Section */}
        <div className="agreement-section acceptance-section">
          <h3>✓ Accept Agreement</h3>

          <div className="checkbox-group">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="form-checkbox"
              />
              <span className="checkbox-label">
                I have read and fully understand the partnership agreement. I agree to comply with all terms,
                responsibilities, and policies outlined above.
              </span>
            </label>
          </div>

          <div className="agreement-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleAcceptAgreement}
              disabled={!agreedToTerms || isSubmitting || accepted}
            >
              {isSubmitting ? 'Accepting Agreement...' : 'Accept & Continue'}
            </button>

            <p className="action-note">
              By clicking "Accept", you formally agree to this partnership agreement and the terms outlined above.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="acceptance-footer">
        <p>Questions about this agreement? Contact your administrator or system support.</p>
        <p className="text-muted">
          This invitation was sent to <strong>{invitation.email}</strong> and expires on{' '}
          <strong>{new Date(invitation.tokenExpiry).toLocaleDateString()}</strong>
        </p>
      </div>
    </div>
  );
}
