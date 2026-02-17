import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold">
                SL
              </span>
              <span className="text-sm font-medium text-gray-900">Student Laptop Access</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-600">
              <Link to="/about" className="hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link to="/universities" className="hover:text-gray-900 transition-colors">
                Universities
              </Link>
              <Link to="/src-partners" className="hover:text-gray-900 transition-colors">
                SRC Partners
              </Link>
              <Link to="/support" className="hover:text-gray-900 transition-colors">
                Support
              </Link>
            </nav>
          </div>

          {/* Copyright */}
          <div className="mt-6 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Fafa Access. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
