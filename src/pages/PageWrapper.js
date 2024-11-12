import React from 'react';

const PageWrapper = ({ title, subtitle, breadcrumbs, children, navLinks, footerLinks }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5e3d8] via-[#f9f4f0] to-[#f5e3d8] flex flex-col">
      {/* Header with Title, Subtitle, and Breadcrumbs */}
      <header className="w-full bg-[#8b6f47] text-white py-6 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          {breadcrumbs && (
            <nav className="mb-2 w-full text-sm">
              <ul className="flex space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-white">/</span>}
                    <a href={crumb.href} className="hover:underline text-white">{crumb.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <h1 className="text-3xl font-bold text-center">{title}</h1>
          {subtitle && <p className="text-lg text-[#d1c2a7] text-center mt-2">{subtitle}</p>}
        </div>
      </header>

      {/* Navigation Links (Optional) */}
      {navLinks && (
        <nav className="w-full bg-[#a38967] text-white shadow-inner">
          <div className="max-w-5xl mx-auto px-4 py-3 flex space-x-4 justify-center">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="hover:underline hover:text-[#d1c2a7] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto px-4 py-8 flex-grow">
        <div className="bg-white shadow-lg rounded-lg p-8 border border-[#d1c2a7]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#f0e5da] text-gray-700 py-6 mt-8 shadow-inner">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          <div className="mb-4">
            {footerLinks && footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-sm text-gray-600 hover:text-[#8b6f47] mr-4 last:mr-0"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-sm text-center">© {new Date().getFullYear()} Creator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PageWrapper;
