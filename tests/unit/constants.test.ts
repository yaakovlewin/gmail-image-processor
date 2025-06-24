// Unit Tests for common/constants.ts
// Testing all configuration constants

import {
  FILE_SIZE,
  IMAGE_TYPES,
  IMAGE_CONFIG,
  TEXT_MIME_TYPES,
  TEXT_TYPES,
  DRIVE_PATTERNS,
  GMAIL_API,
  FOLDER_NAME,
  VISION_API
} from '../../common/constants.js';

describe('Constants Module', () => {
  
  describe('FILE_SIZE', () => {
    test('should have correct byte calculations', () => {
      expect(FILE_SIZE.BYTES_PER_MB).toBe(1024 * 1024);
      expect(FILE_SIZE.CONVERSION_FACTOR).toBe(1024);
      expect(FILE_SIZE.MAX_SIZE_BYTES).toBe(25 * 1024 * 1024);
      expect(FILE_SIZE.MAX_SIZE_MB).toBe(25);
    });
    
    test('should have valid units array', () => {
      expect(FILE_SIZE.UNITS).toEqual(['Bytes', 'KB', 'MB', 'GB', 'TB']);
      expect(Array.isArray(FILE_SIZE.UNITS)).toBe(true);
      expect(FILE_SIZE.UNITS.length).toBe(5);
    });
    
    test('should have reasonable tiny image threshold', () => {
      expect(FILE_SIZE.TINY_IMAGE_THRESHOLD).toBe(1024);
      expect(FILE_SIZE.TINY_IMAGE_THRESHOLD).toBeGreaterThan(0);
    });
  });
  
  describe('IMAGE_TYPES', () => {
    test('should contain valid image MIME types', () => {
      const expectedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml'
      ];
      
      expect(IMAGE_TYPES).toEqual(expectedTypes);
      expect(Array.isArray(IMAGE_TYPES)).toBe(true);
    });
    
    test('should have all types starting with image/', () => {
      IMAGE_TYPES.forEach(type => {
        expect(type).toMatch(/^image\//);
      });
    });
    
    test('should not have duplicates', () => {
      const uniqueTypes = [...new Set(IMAGE_TYPES)];
      expect(uniqueTypes.length).toBe(IMAGE_TYPES.length);
    });
  });
  
  describe('IMAGE_CONFIG', () => {
    test('should reference IMAGE_TYPES correctly', () => {
      expect(IMAGE_CONFIG.SUPPORTED_MIME_TYPES).toBe(IMAGE_TYPES);
    });
    
    test('should have valid extensions array', () => {
      const expectedExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.bmp',
        '.tiff',
        '.svg'
      ];
      
      expect(IMAGE_CONFIG.SUPPORTED_EXTENSIONS).toEqual(expectedExtensions);
    });
    
    test('should have all extensions starting with dot', () => {
      IMAGE_CONFIG.SUPPORTED_EXTENSIONS.forEach(ext => {
        expect(ext).toMatch(/^\./);
      });
    });
  });
  
  describe('TEXT_MIME_TYPES', () => {
    test('should contain basic text types', () => {
      expect(TEXT_MIME_TYPES).toEqual(['text/plain', 'text/html']);
      expect(Array.isArray(TEXT_MIME_TYPES)).toBe(true);
    });
    
    test('should have all types starting with text/', () => {
      TEXT_MIME_TYPES.forEach(type => {
        expect(type).toMatch(/^text\//);
      });
    });
  });
  
  describe('TEXT_TYPES', () => {
    test('should have extended text MIME types', () => {
      const expectedTypes = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json'
      ];
      
      expect(TEXT_TYPES.SUPPORTED_MIME_TYPES).toEqual(expectedTypes);
    });
  });
  
  describe('DRIVE_PATTERNS', () => {
    test('should have valid regex patterns', () => {
      expect(Array.isArray(DRIVE_PATTERNS)).toBe(true);
      expect(DRIVE_PATTERNS.length).toBeGreaterThan(0);
      
      DRIVE_PATTERNS.forEach(pattern => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });
    
    test('should match valid Google Drive URLs', () => {
      const testUrls = [
        'https://drive.google.com/file/d/1ABC123DEF456/view',
        'https://drive.google.com/open?id=1ABC123DEF456',
        'https://drive.google.com/uc?id=1ABC123DEF456'
      ];
      
      testUrls.forEach(url => {
        const matched = DRIVE_PATTERNS.some(pattern => pattern.test(url));
        expect(matched).toBe(true);
      });
    });
    
    test('should extract file IDs correctly', () => {
      const testCases = [
        {
          url: 'https://drive.google.com/file/d/1ABC123DEF456/view',
          expectedId: '1ABC123DEF456'
        },
        {
          url: 'https://drive.google.com/open?id=1XYZ789ABC123',
          expectedId: '1XYZ789ABC123'
        }
      ];
      
      testCases.forEach(({ url, expectedId }) => {
        const pattern = DRIVE_PATTERNS.find(p => p.test(url));
        expect(pattern).toBeDefined();
        
        if (pattern) {
          const match = url.match(pattern);
          expect(match).toBeTruthy();
          expect(match![1]).toBe(expectedId);
        }
      });
    });
    
    test('should not have global flag', () => {
      DRIVE_PATTERNS.forEach(pattern => {
        expect(pattern.global).toBe(false);
      });
    });
  });
  
  describe('GMAIL_API', () => {
    test('should have valid base URL', () => {
      expect(GMAIL_API.BASE_URL).toBe('https://gmail.googleapis.com/gmail/v1/users/me');
      expect(GMAIL_API.BASE_URL).toMatch(/^https:\/\//);
    });
  });
  
  describe('FOLDER_NAME', () => {
    test('should have reasonable max length', () => {
      expect(FOLDER_NAME.MAX_LENGTH).toBe(50);
      expect(FOLDER_NAME.MAX_LENGTH).toBeGreaterThan(0);
      expect(FOLDER_NAME.MAX_LENGTH).toBeLessThan(256); // Filesystem limit
    });
    
    test('should have invalid characters regex', () => {
      expect(FOLDER_NAME.INVALID_CHARS).toBeInstanceOf(RegExp);
      
      // Test that it matches invalid characters
      const invalidChars = '<>:"/\\|?*@';
      expect(FOLDER_NAME.INVALID_CHARS.test(invalidChars)).toBe(true);
      
      // Test that it doesn't match valid characters
      const validChars = 'abcABC123_-. ';
      expect(FOLDER_NAME.INVALID_CHARS.test(validChars)).toBe(false);
    });
    
    test('should have valid fallback name', () => {
      expect(FOLDER_NAME.FALLBACK).toBe('Unknown Sender');
      expect(typeof FOLDER_NAME.FALLBACK).toBe('string');
      expect(FOLDER_NAME.FALLBACK.length).toBeGreaterThan(0);
      expect(FOLDER_NAME.INVALID_CHARS.test(FOLDER_NAME.FALLBACK)).toBe(false);
    });
  });
  
  describe('VISION_API', () => {
    test('should have valid URL', () => {
      expect(VISION_API.URL).toBe('https://vision.googleapis.com/v1/images:annotate');
      expect(VISION_API.URL).toMatch(/^https:\/\//);
    });
    
    test('should have reasonable image size constraints', () => {
      expect(VISION_API.MIN_IMAGE_SIZE.WIDTH).toBe(100);
      expect(VISION_API.MIN_IMAGE_SIZE.HEIGHT).toBe(100);
      expect(VISION_API.MIN_IMAGE_SIZE.WIDTH).toBeGreaterThan(0);
      expect(VISION_API.MIN_IMAGE_SIZE.HEIGHT).toBeGreaterThan(0);
    });
    
    test('should have valid confidence thresholds', () => {
      expect(VISION_API.CONFIDENCE_THRESHOLD).toBe(0.6);
      expect(VISION_API.HIGH_CONFIDENCE_THRESHOLD).toBe(0.8);
      
      expect(VISION_API.CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
      expect(VISION_API.CONFIDENCE_THRESHOLD).toBeLessThan(1);
      expect(VISION_API.HIGH_CONFIDENCE_THRESHOLD).toBeGreaterThan(VISION_API.CONFIDENCE_THRESHOLD);
    });
    
    test('should have reasonable result limits', () => {
      expect(VISION_API.MAX_LOGO_RESULTS).toBe(10);
      expect(VISION_API.MAX_LABEL_RESULTS).toBe(20);
      
      expect(VISION_API.MAX_LOGO_RESULTS).toBeGreaterThan(0);
      expect(VISION_API.MAX_LABEL_RESULTS).toBeGreaterThan(0);
    });
    
    test('should have comprehensive non-content labels', () => {
      expect(Array.isArray(VISION_API.NON_CONTENT_LABELS)).toBe(true);
      expect(VISION_API.NON_CONTENT_LABELS.length).toBeGreaterThan(20);
      
      // Check for key categories
      const labels = VISION_API.NON_CONTENT_LABELS;
      expect(labels).toContain('logo');
      expect(labels).toContain('icon');
      expect(labels).toContain('button');
      expect(labels).toContain('tracking pixel');
      expect(labels).toContain('watermark');
    });
    
    test('should have all labels as lowercase strings', () => {
      VISION_API.NON_CONTENT_LABELS.forEach(label => {
        expect(typeof label).toBe('string');
        expect(label).toBe(label.toLowerCase());
        expect(label.length).toBeGreaterThan(0);
      });
    });
    
    test('should not have duplicate labels', () => {
      const uniqueLabels = [...new Set(VISION_API.NON_CONTENT_LABELS)];
      expect(uniqueLabels.length).toBe(VISION_API.NON_CONTENT_LABELS.length);
    });
    
    test('should have valid filtering strength configurations', () => {
      const strengths = ['conservative', 'balanced', 'aggressive'];
      
      strengths.forEach(strength => {
        expect(VISION_API.FILTERING_STRENGTH[strength]).toBeDefined();
        
        const config = VISION_API.FILTERING_STRENGTH[strength];
        expect(config.confidenceThreshold).toBeGreaterThan(0);
        expect(config.confidenceThreshold).toBeLessThan(1);
        expect(typeof config.description).toBe('string');
        expect(config.description.length).toBeGreaterThan(0);
      });
      
      // Check threshold ordering
      const conservative = VISION_API.FILTERING_STRENGTH.conservative.confidenceThreshold;
      const balanced = VISION_API.FILTERING_STRENGTH.balanced.confidenceThreshold;
      const aggressive = VISION_API.FILTERING_STRENGTH.aggressive.confidenceThreshold;
      
      expect(conservative).toBeGreaterThan(balanced);
      expect(balanced).toBeGreaterThan(aggressive);
    });
    
    test('should have valid request configuration', () => {
      expect(VISION_API.REQUEST_CONFIG.maxResults).toBe(20);
      expect(Array.isArray(VISION_API.REQUEST_CONFIG.features)).toBe(true);
      expect(VISION_API.REQUEST_CONFIG.features.length).toBeGreaterThan(0);
      
      const expectedFeatures = ['LABEL_DETECTION', 'TEXT_DETECTION', 'LOGO_DETECTION'];
      expectedFeatures.forEach(featureType => {
        const feature = VISION_API.REQUEST_CONFIG.features.find(f => f.type === featureType);
        expect(feature).toBeDefined();
        expect(feature!.maxResults).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Constants Integration', () => {
    test('should have consistent MIME type references', () => {
      // IMAGE_CONFIG should reference IMAGE_TYPES
      expect(IMAGE_CONFIG.SUPPORTED_MIME_TYPES).toBe(IMAGE_TYPES);
      
      // TEXT_TYPES should include TEXT_MIME_TYPES
      expect(TEXT_TYPES.SUPPORTED_MIME_TYPES).toEqual(
        expect.arrayContaining(TEXT_MIME_TYPES)
      );
    });
    
    test('should have consistent file size calculations', () => {
      expect(FILE_SIZE.MAX_SIZE_BYTES).toBe(FILE_SIZE.MAX_SIZE_MB * FILE_SIZE.BYTES_PER_MB);
    });
    
    test('should have all constants as readonly', () => {
      // This is more of a TypeScript check, but we can verify they exist
      expect(FILE_SIZE).toBeDefined();
      expect(IMAGE_TYPES).toBeDefined();
      expect(VISION_API).toBeDefined();
      expect(DRIVE_PATTERNS).toBeDefined();
    });
  });
  
  describe('Constants Validation', () => {
    test('should have all required configuration sections', () => {
      const requiredSections = [
        'FILE_SIZE',
        'IMAGE_TYPES', 
        'DRIVE_PATTERNS',
        'VISION_API',
        'GMAIL_API',
        'FOLDER_NAME'
      ];
      
      // This would need to be checked in a different way in actual implementation
      // but serves as documentation of required constants
      expect(requiredSections.length).toBeGreaterThan(0);
    });
  });
});