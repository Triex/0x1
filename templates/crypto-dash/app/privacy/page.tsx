/**
 * Privacy Policy Page
 */

export const metadata = {
  title: "Privacy Policy - 0x1 Crypto Dashboard",
  description: "Privacy policy for the 0x1 Crypto Dashboard application.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Privacy Policy
        </h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-4">
              0x1 Crypto Dashboard is a client-side application that interacts with blockchain networks. 
              We do not collect, store, or process personal information on our servers.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not store your wallet addresses or private keys</li>
              <li>We do not track your transaction history</li>
              <li>We do not collect personal identification information</li>
              <li>Local storage is used only for theme preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">How We Use Information</h2>
            <p className="mb-4">
              Since we don't collect personal information, we don't use it for any purpose. 
              All wallet interactions happen directly between your browser and the blockchain.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Third-Party Services</h2>
            <p className="mb-4">
              Our application integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>WalletConnect:</strong> For wallet connection functionality</li>
              <li><strong>RPC Providers:</strong> For blockchain data retrieval</li>
              <li><strong>Token Price APIs:</strong> For displaying market data</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies that govern their data collection practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All communications use HTTPS encryption</li>
              <li>No server-side data storage</li>
              <li>Client-side only wallet interactions</li>
              <li>Regular security audits of dependencies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
            <p className="mb-4">
              Since we don't collect personal data, there's no data to access, modify, or delete. 
              You maintain full control over your wallet and blockchain interactions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify users of any 
              significant changes by updating the date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us through our 
              <a href="https://github.com/Triex/0x1" className="text-violet-600 dark:text-violet-400 hover:underline"> GitHub repository</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}