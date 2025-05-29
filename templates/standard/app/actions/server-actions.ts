"use server"

/**
 * Server Actions - Demonstrates "use server" directive
 * These functions run on the server and can be called from client components
 */

// Example server action for fetching data
export async function fetchUserData(userId: string) {
  // Simulate database call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    createdAt: new Date().toISOString()
  };
}

// Example server action for form submission
export async function submitContactForm(formData: {
  name: string;
  email: string;
  message: string;
}) {
  // Validate input
  if (!formData.name || !formData.email || !formData.message) {
    throw new Error('All fields are required');
  }
  
  // Simulate sending email
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Contact form submitted:', formData);
  
  return {
    success: true,
    message: 'Thank you for your message! We\'ll get back to you soon.'
  };
}

// Example server action for data processing
export async function processAnalytics(data: {
  page: string;
  event: string;
  timestamp: number;
}) {
  // Simulate analytics processing
  await new Promise(resolve => setTimeout(resolve, 50));
  
  console.log('Analytics event processed:', data);
  
  return {
    processed: true,
    eventId: `evt_${Date.now()}`
  };
}

// Example server action with error handling
export async function validateApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Simulate API validation
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const isValid = apiKey.startsWith('sk_') && apiKey.length > 10;
  
  if (!isValid) {
    throw new Error('Invalid API key format');
  }
  
  return {
    valid: true,
    keyType: 'secret',
    permissions: ['read', 'write']
  };
} 