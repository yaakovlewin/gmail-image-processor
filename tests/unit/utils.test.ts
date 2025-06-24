// Unit Tests for common/utils.ts
// Testing all pure utility functions

import {
  formatFileSize,
  exceedsMaxSize,
  isImageMimeType,
  generateFilename,
  createTempFilePath,
  sanitizeFolderName
} from '../../common/utils.js';
import { testUtils } from '../setup.js';

describe('Utils Module', () => {
  
  describe('formatFileSize', () => {
    test('should format zero bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
    
    test('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });
    
    test('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });
    
    test('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
    });
    
    test('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });
    
    test('should handle large numbers', () => {
      const result = formatFileSize(1024 * 1024 * 1024 * 1024);
      expect(result).toMatch(/TB$/);
    });
    
    test('should validate output format', () => {
      const results = [
        formatFileSize(0),
        formatFileSize(1024),
        formatFileSize(1024 * 1024),
        formatFileSize(1024 * 1024 * 1024)
      ];
      
      results.forEach(result => {
        expect(testUtils.isValidFileSize(result)).toBe(true);
      });
    });
  });
  
  describe('exceedsMaxSize', () => {
    test('should use default max size of 25MB', () => {
      const defaultMaxBytes = 25 * 1024 * 1024;
      
      expect(exceedsMaxSize(defaultMaxBytes - 1)).toBe(false);
      expect(exceedsMaxSize(defaultMaxBytes)).toBe(false);
      expect(exceedsMaxSize(defaultMaxBytes + 1)).toBe(true);
    });
    
    test('should respect custom max size', () => {
      const customMax = 10; // 10MB
      const customMaxBytes = customMax * 1024 * 1024;
      
      expect(exceedsMaxSize(customMaxBytes - 1, customMax)).toBe(false);
      expect(exceedsMaxSize(customMaxBytes, customMax)).toBe(false);
      expect(exceedsMaxSize(customMaxBytes + 1, customMax)).toBe(true);
    });
    
    test('should handle edge cases', () => {
      expect(exceedsMaxSize(0)).toBe(false);
      expect(exceedsMaxSize(0, 1)).toBe(false);
      expect(exceedsMaxSize(1024 * 1024, 1)).toBe(false); // Exactly 1MB
      expect(exceedsMaxSize(1024 * 1024 + 1, 1)).toBe(true); // 1MB + 1 byte
    });
    
    test('should handle fractional max sizes', () => {
      const halfMB = 0.5;
      const halfMBBytes = halfMB * 1024 * 1024;
      
      expect(exceedsMaxSize(halfMBBytes - 1, halfMB)).toBe(false);
      expect(exceedsMaxSize(halfMBBytes + 1, halfMB)).toBe(true);
    });
  });
  
  describe('isImageMimeType', () => {
    test('should recognize valid image MIME types', () => {
      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml'
      ];
      
      validMimeTypes.forEach(mimeType => {
        expect(isImageMimeType(mimeType)).toBe(true);
      });
    });
    
    test('should reject invalid MIME types', () => {
      const invalidMimeTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mp3',
        'application/json',
        'text/html',
        'image/invalid',
        'invalid/image',
        ''
      ];
      
      invalidMimeTypes.forEach(mimeType => {
        expect(isImageMimeType(mimeType)).toBe(false);
      });
    });
    
    test('should be case sensitive', () => {
      expect(isImageMimeType('IMAGE/JPEG')).toBe(false);
      expect(isImageMimeType('Image/Jpeg')).toBe(false);
      expect(isImageMimeType('image/JPEG')).toBe(false);
    });
  });
  
  describe('generateFilename', () => {
    test('should generate filename with correct extension', () => {
      const mimeType = 'image/jpeg';
      const filename = generateFilename(mimeType);
      
      expect(filename).toMatch(/^image_.*\.jpeg$/);
      expect(testUtils.isValidFilename(filename)).toBe(true);
    });
    
    test('should handle different MIME types', () => {
      const testCases = [
        { mimeType: 'image/png', extension: '.png' },
        { mimeType: 'image/gif', extension: '.gif' },
        { mimeType: 'image/webp', extension: '.webp' },
        { mimeType: 'image/svg+xml', extension: '.svg+xml' }
      ];
      
      testCases.forEach(({ mimeType, extension }) => {
        const filename = generateFilename(mimeType);
        expect(filename.endsWith(extension)).toBe(true);
        expect(filename).toMatch(/^image_.*\./);
      });
    });
    
    test('should use jpg as default extension for malformed MIME types', () => {
      const filename = generateFilename('invalid');
      expect(filename.endsWith('.jpg')).toBe(true);
    });
    
    test('should handle malformed MIME types', () => {
      const testCases = ['image', 'invalid', '', 'text/plain'];
      
      testCases.forEach(mimeType => {
        const filename = generateFilename(mimeType);
        expect(filename).toMatch(/^image_.*\./);
        expect(testUtils.isValidFilename(filename)).toBe(true);
      });
    });
    
    test('should generate unique filenames', async () => {
      const filename1 = generateFilename('image/jpeg');
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay
      const filename2 = generateFilename('image/jpeg');
      
      expect(filename1).not.toBe(filename2);
    });
    
    test('should include timestamp', () => {
      const beforeTime = new Date().toISOString();
      const filename = generateFilename('image/jpeg');
      const afterTime = new Date().toISOString();
      
      // Extract timestamp from filename (between image_ and .extension)
      const timestampMatch = filename.match(/image_(.*)\.jpeg/);
      expect(timestampMatch).toBeTruthy();
      
      if (timestampMatch) {
        const timestamp = timestampMatch[1].replace(/-/g, ':').replace(/T/, 'T');
        // Verify timestamp is within reasonable range
        expect(timestamp.length).toBeGreaterThan(15);
      }
    });
  });
  
  describe('createTempFilePath', () => {
    test('should create valid temp file path', () => {
      const filename = 'test-image.jpg';
      const path = createTempFilePath(filename);
      
      expect(path).toMatch(/^\/tmp\/\d+_test-image\.jpg$/);
    });
    
    test('should include prefix when provided', () => {
      const filename = 'test-image.jpg';
      const prefix = 'drive_';
      const path = createTempFilePath(filename, prefix);
      
      expect(path).toMatch(/^\/tmp\/\d+_drive_test-image\.jpg$/);
    });
    
    test('should sanitize filename', () => {
      const invalidFilename = 'test<>file?*.jpg';
      const path = createTempFilePath(invalidFilename);
      
      expect(path).toMatch(/^\/tmp\/\d+_test__file__\.jpg$/);
      expect(path).not.toMatch(/[<>?*]/);
    });
    
    test('should handle empty prefix', () => {
      const filename = 'test.jpg';
      const path = createTempFilePath(filename, '');
      
      expect(path).toMatch(/^\/tmp\/\d+_test\.jpg$/);
    });
    
    test('should generate unique paths', async () => {
      const filename = 'test.jpg';
      const path1 = createTempFilePath(filename);
      await new Promise(resolve => setTimeout(resolve, 2)); // Small delay
      const path2 = createTempFilePath(filename);
      
      expect(path1).not.toBe(path2);
    });
    
    test('should handle special characters', () => {
      const filename = 'test file & more@#$.jpg';
      const path = createTempFilePath(filename);
      
      expect(path).toMatch(/^\/tmp\/\d+_test_file___more___\.jpg$/);
    });
  });
  
  describe('sanitizeFolderName', () => {
    test('should remove invalid characters', () => {
      const invalid = 'folder<>:"/\\|?*name';
      const sanitized = sanitizeFolderName(invalid);
      
      expect(sanitized).toBe('folder_name');
      expect(testUtils.isValidFilename(sanitized)).toBe(true);
    });
    
    test('should replace multiple underscores with single', () => {
      const input = 'folder___name____test';
      const sanitized = sanitizeFolderName(input);
      
      expect(sanitized).toBe('folder_name_test');
    });
    
    test('should trim leading and trailing underscores', () => {
      const input = '_folder_name_';
      const sanitized = sanitizeFolderName(input);
      
      expect(sanitized).toBe('folder_name');
    });
    
    test('should trim whitespace', () => {
      const input = '  folder name  ';
      const sanitized = sanitizeFolderName(input);
      
      expect(sanitized).toBe('folder_name');
    });
    
    test('should truncate to max length', () => {
      const longName = 'a'.repeat(100); // Longer than FOLDER_NAME.MAX_LENGTH (50)
      const sanitized = sanitizeFolderName(longName);
      
      expect(sanitized.length).toBeLessThanOrEqual(50);
    });
    
    test('should return fallback for empty input', () => {
      expect(sanitizeFolderName('')).toBe('Unknown Sender');
      expect(sanitizeFolderName('   ')).toBe('Unknown Sender');
      expect(sanitizeFolderName('___')).toBe('Unknown Sender');
    });
    
    test('should handle normal names correctly', () => {
      const testCases = [
        { input: 'John Doe', expected: 'John_Doe' },
        { input: 'user@example.com', expected: 'user_example.com' },
        { input: 'Simple Name', expected: 'Simple_Name' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(sanitizeFolderName(input)).toBe(expected);
      });
    });
    
    test('should handle edge cases', () => {
      expect(sanitizeFolderName('a')).toBe('a');
      expect(sanitizeFolderName('123')).toBe('123');
      expect(sanitizeFolderName('!')).toBe('!');
    });
  });
  
  describe('Integration Tests', () => {
    test('should work together in typical workflow', () => {
      // Simulate typical usage
      const mimeType = 'image/jpeg';
      const fileSize = 1024 * 1024; // 1MB
      const senderName = 'John Doe <john@example.com>';
      
      // Generate filename
      const filename = generateFilename(mimeType);
      expect(isImageMimeType(mimeType)).toBe(true);
      expect(testUtils.isValidFilename(filename)).toBe(true);
      
      // Check file size
      expect(exceedsMaxSize(fileSize, 25)).toBe(false);
      expect(formatFileSize(fileSize)).toBe('1 MB');
      
      // Create temp path
      const tempPath = createTempFilePath(filename);
      expect(tempPath).toContain('/tmp/');
      
      // Sanitize folder name
      const folderName = sanitizeFolderName(senderName);
      expect(folderName).toBe('John_Doe_john_example.com');
    });
  });
});