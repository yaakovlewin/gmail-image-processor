// Test Setup Configuration
// Basic setup for Jest testing environment

// Test environment configuration
process.env.NODE_ENV = 'test';

// Export test utilities
export const testUtils = {
  createMockEmailData: (overrides: any = {}) => ({
    id: 'test-email-123',
    subject: 'Test Email',
    from: 'test@example.com',
    payload: {},
    ...overrides
  }),
  
  createMockImageAttachment: (overrides: any = {}) => ({
    type: 'attachment' as const,
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    attachmentId: 'attachment-123',
    ...overrides
  }),
  
  createMockSenderInfo: (overrides: any = {}) => ({
    email: 'test@example.com',
    name: 'Test User',
    displayName: 'Test User',
    folderName: 'Test_User',
    rawFrom: 'Test User <test@example.com>',
    ...overrides
  }),
  
  // Validation helpers
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidFilename: (filename: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename) && filename.length > 0;
  },
  
  isValidFileSize: (fileSize: string): boolean => {
    const fileSizeRegex = /^\d+(\.\d+)?\s*(Bytes|KB|MB|GB)$/;
    return fileSizeRegex.test(fileSize);
  }
};