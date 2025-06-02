/**
 * Terms of Service Page
 */

export const metadata = {
  title: "Terms of Service - 0x1 Crypto Dashboard",
  description: "Terms of service for the 0x1 Crypto Dashboard application.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Terms of Service
        </h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using the 0x1 Crypto Dashboard ("the Service"), you accept and agree 
              to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Description of Service</h2>
            <p className="mb-4">
              0x1 Crypto Dashboard is a decentralized application (dApp) that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wallet connection and management interface</li>
              <li>Token balance viewing and portfolio tracking</li>
              <li>Integration with various blockchain networks</li>
              <li>Access to DeFi protocols and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">User Responsibilities</h2>
            <p className="mb-4">
              As a user of this service, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service at your own risk</li>
              <li>Maintain the security of your private keys and wallet</li>
              <li>Verify all transaction details before confirming</li>
              <li>Comply with applicable laws and regulations</li>
              <li>Not use the service for illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Financial Risks</h2>
            <p className="mb-4">
              Cryptocurrency and DeFi activities involve significant risks:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cryptocurrency values can be highly volatile</li>
              <li>Smart contracts may contain bugs or vulnerabilities</li>
              <li>Transactions on blockchain networks are irreversible</li>
              <li>Market conditions can change rapidly</li>
              <li>Regulatory changes may affect cryptocurrency usage</li>
            </ul>
            <p className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <strong>Important:</strong> Never invest more than you can afford to lose. 
              Always do your own research before making any financial decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Disclaimer of Warranties</h2>
            <p className="mb-4">
              The service is provided "as is" without warranties of any kind:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not guarantee continuous availability of the service</li>
              <li>We do not warrant that the service will be error-free</li>
              <li>We are not responsible for third-party integrations</li>
              <li>Price data may be delayed or inaccurate</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, we shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any direct, indirect, or consequential damages</li>
              <li>Loss of funds due to user error or negligence</li>
              <li>Losses due to smart contract failures</li>
              <li>Market losses or missed opportunities</li>
              <li>Service interruptions or downtime</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Third-Party Integrations</h2>
            <p className="mb-4">
              Our service integrates with various third-party services and protocols. 
              We are not responsible for their functionality, security, or availability. 
              Each integration is subject to its own terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Governing Law</h2>
            <p className="mb-4">
              These terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have any questions about these terms, please contact us through our 
              <a href="https://github.com/Triex/0x1" className="text-violet-600 dark:text-violet-400 hover:underline"> GitHub repository</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}