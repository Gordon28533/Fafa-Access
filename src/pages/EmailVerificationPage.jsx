import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const { verifyEmail } = useAuth();
  // const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link. No token found.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token, verifyEmail]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Loading Spinner */}
            <div className="mx-auto w-16 h-16 mb-6">
              <svg className="animate-spin h-16 w-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifying Your Email</h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">Email Verified!</h2>
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. You can now access all features of FafaAccess.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                Go to Login
              </Link>
              <Link
                to="/"
                className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-3 rounded-lg border-2 border-green-600 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Log in with your email and password</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Browse available laptops</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submit your laptop application</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">Verification Failed</h2>
          <p className="text-gray-600 mb-8">
            {errorMessage}
          </p>

          <div className="space-y-3">
            <Link
              to="/register"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Create New Account
            </Link>
            <Link
              to="/login"
              className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-3 rounded-lg border-2 border-green-600 transition"
            >
              Go to Login
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Having trouble?</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-500">
                Verification links expire after 24 hours. If your link has expired, please register again.
              </p>
              <p className="text-gray-500">
                Need help? Contact{' '}
                <a href="mailto:support@fafaaccess.com" className="text-green-600 hover:text-green-700 font-semibold">
                  support@fafaaccess.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
