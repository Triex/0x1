/**
 * Footer Component
 */

// Simple Link component for now
function Link({ href, children, className, ...props }: { href: string; children: any; className?: string; [key: string]: any }) {
  return (
    <a 
      href={href} 
      className={className}
      onClick={(e) => {
        if (href.startsWith('/')) {
          e.preventDefault();
          if ((window as any).__0x1_router?.navigate) {
            (window as any).__0x1_router.navigate(href);
          } else if ((window as any).router?.navigate) {
            (window as any).router.navigate(href);
          } else {
            window.history.pushState(null, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} 0x1 App. Built with <Link href="https://bun.sh" className="text-blue-600 dark:text-blue-400 hover:underline">Bun</Link></p>
          </div>
          <div className="flex space-x-6">
            <Link href="https://github.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">GitHub</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Documentation</Link>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}