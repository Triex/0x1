/**
 * 0x1 Full App - Dashboard Page
 * Using app directory structure
 */

export default function DashboardPage() {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 gradient-text">
          Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Users</h2>
              <span className="text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                12%
              </span>
            </div>
            <p className="text-3xl font-bold">1,248</p>
            <p className="opacity-60 text-sm mt-1">+156 this week</p>
          </div>
          
          <div className="card p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Total Revenue</h2>
              <span className="text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                8.3%
              </span>
            </div>
            <p className="text-3xl font-bold">$24,568</p>
            <p className="opacity-60 text-sm mt-1">+$2,100 this month</p>
          </div>
          
          <div className="card p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pending Orders</h2>
              <span className="text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                3%
              </span>
            </div>
            <p className="text-3xl font-bold">36</p>
            <p className="opacity-60 text-sm mt-1">-12 since yesterday</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start pb-4 border-b border-border/40">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md mr-4">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">New order #{1000 + i}</h3>
                      <span className="text-sm opacity-60">{i}h ago</span>
                    </div>
                    <p className="opacity-75 text-sm">Customer {i} placed an order for Product X</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="btn btn-primary w-full">
                Add New Product
              </button>
              <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                View Orders
              </button>
              <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                Generate Report
              </button>
              <button className="btn btn-secondary w-full">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
