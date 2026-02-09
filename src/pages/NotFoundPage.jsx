import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const ROLE_HOME = {
  STUDENT: '/dashboard',
  SRC: '/src/dashboard',
  ADMIN: '/admin',
  DELIVERY: '/delivery/queue',
};

export default function NotFoundPage() {
  const { user } = useAuth();

  const homePath = user ? ROLE_HOME[user.role] || '/' : '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* 404 */}
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-green-600">404</h1>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {user ? (
            <Link
              to={homePath}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          )}
          <Link
            to="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>

        {/* Common Pages */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/" className="text-sm text-green-600 hover:text-green-700">
              Home
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/catalog" className="text-sm text-green-600 hover:text-green-700">
              Catalog
            </Link>
            {!user && (
              <>
                <span className="text-gray-300">•</span>
                <Link to="/login" className="text-sm text-green-600 hover:text-green-700">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
