import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { getUserHomePath } from '../utils/permissions';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const homePath = getUserHomePath(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-2">
          You don't have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Your role: <span className="font-semibold text-gray-700">{user.role}</span>
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to={homePath}
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>

        {/* Help */}
        <p className="mt-6 text-xs text-gray-500">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
