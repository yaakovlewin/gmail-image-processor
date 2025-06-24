// Unit Tests for common/types.ts
// Testing TypeScript interface definitions and type safety

import {
  EmailData,
  SenderInfo,
  ImageAttachment,
  ExtractedImage,
  ProcessingResult,
  VisionResult,
  ComponentContext,
  VisionFilteringStrength,
  AttachmentType,
  TextExtractionCallback
} from '../../common/types.js';
import { testUtils } from '../setup.js';

describe('Types Module', () => {
  
  describe('EmailData Interface', () => {
    test('should accept valid email data', () => {
      const validEmailData: EmailData = {
        id: 'email-123',
        subject: 'Test Subject',
        from: 'test@example.com',
        payload: { parts: [] },
        parsedHeaders: {
          from: {
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      };
      
      expect(validEmailData.id).toBe('email-123');
      expect(validEmailData.subject).toBe('Test Subject');
      expect(testUtils.isValidEmail(validEmailData.from!)).toBe(true);
    });
    
    test('should work with minimal required fields', () => {
      const minimalEmailData: EmailData = {
        id: 'minimal-123',
        payload: {}
      };
      
      expect(minimalEmailData.id).toBe('minimal-123');
      expect(minimalEmailData.subject).toBeUndefined();
      expect(minimalEmailData.from).toBeUndefined();
    });
    
    test('should handle parsed headers structure', () => {
      const emailWithHeaders: EmailData = {
        id: 'headers-123',
        payload: {},
        parsedHeaders: {
          from: {
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      };
      
      expect(emailWithHeaders.parsedHeaders?.from?.name).toBe('John Doe');
      expect(emailWithHeaders.parsedHeaders?.from?.email).toBe('john@example.com');
    });
  });
  
  describe('SenderInfo Interface', () => {
    test('should accept complete sender information', () => {
      const senderInfo: SenderInfo = {
        email: 'sender@example.com',
        name: 'Sender Name',
        displayName: 'Sender Display',
        folderName: 'Sender_Display',
        rawFrom: 'Sender Name <sender@example.com>'
      };
      
      expect(testUtils.isValidEmail(senderInfo.email)).toBe(true);
      expect(testUtils.isValidFilename(senderInfo.folderName)).toBe(true);
      expect(senderInfo.name).toBe('Sender Name');
    });
    
    test('should have all required fields', () => {
      const senderInfo = testUtils.createMockSenderInfo();
      
      expect(typeof senderInfo.email).toBe('string');
      expect(typeof senderInfo.name).toBe('string');
      expect(typeof senderInfo.displayName).toBe('string');
      expect(typeof senderInfo.folderName).toBe('string');
      expect(typeof senderInfo.rawFrom).toBe('string');
    });
  });
  
  describe('ImageAttachment Interface', () => {
    test('should accept attachment type', () => {
      const attachment: ImageAttachment = {
        type: 'attachment',
        filename: 'image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        attachmentId: 'att-123',
        partId: '1.2'
      };
      
      expect(attachment.type).toBe('attachment');
      expect(attachment.attachmentId).toBe('att-123');
      expect(attachment.partId).toBe('1.2');
      expect(attachment.fileId).toBeUndefined();
      expect(attachment.url).toBeUndefined();
    });
    
    test('should accept drive_link type', () => {
      const driveLink: ImageAttachment = {
        type: 'drive_link',
        filename: 'drive-image.png',
        mimeType: 'image/png',
        size: 2048,
        fileId: 'drive-file-123',
        url: 'https://drive.google.com/file/d/drive-file-123/view'
      };
      
      expect(driveLink.type).toBe('drive_link');
      expect(driveLink.fileId).toBe('drive-file-123');
      expect(driveLink.url).toContain('drive.google.com');
      expect(driveLink.attachmentId).toBeUndefined();
      expect(driveLink.partId).toBeUndefined();
    });
    
    test('should have valid MIME types', () => {
      const attachment = testUtils.createMockImageAttachment();
      
      expect(attachment.mimeType).toMatch(/^image\//);
      expect(testUtils.isValidFilename(attachment.filename)).toBe(true);
      expect(attachment.size).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('ExtractedImage Interface', () => {
    test('should extend ImageAttachment with additional fields', () => {
      const extractedImage: ExtractedImage = {
        type: 'attachment',
        filename: 'extracted.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        attachmentId: 'att-123',
        filePath: '/tmp/extracted.jpg',
        extractedAt: new Date().toISOString()
      };
      
      // Should have all ImageAttachment properties
      expect(extractedImage.type).toBe('attachment');
      expect(extractedImage.filename).toBe('extracted.jpg');
      expect(extractedImage.mimeType).toBe('image/jpeg');
      
      // Should have additional ExtractedImage properties
      expect(extractedImage.filePath).toBe('/tmp/extracted.jpg');
      expect(extractedImage.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
    });
    
    test('should have valid extracted timestamp', () => {
      const extractedImage: ExtractedImage = {
        ...testUtils.createMockImageAttachment(),
        filePath: '/tmp/test.jpg',
        extractedAt: new Date().toISOString()
      };
      
      const timestamp = new Date(extractedImage.extractedAt);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
  
  describe('ProcessingResult Interface', () => {
    test('should accept complete processing result', () => {
      const result: ProcessingResult = {
        emailId: 'email-123',
        subject: 'Test Email',
        senderInfo: testUtils.createMockSenderInfo(),
        images: [
          {
            ...testUtils.createMockImageAttachment(),
            filePath: '/tmp/image1.jpg',
            extractedAt: new Date().toISOString()
          }
        ],
        processedAt: new Date().toISOString(),
        totalImages: 1,
        visionFiltering: {
          enabled: true,
          strength: 'balanced',
          skipTinyImages: true
        }
      };
      
      expect(result.emailId).toBe('email-123');
      expect(result.images.length).toBe(1);
      expect(result.totalImages).toBe(1);
      expect(result.visionFiltering?.enabled).toBe(true);
    });
    
    test('should work with minimal required fields', () => {
      const minimalResult: ProcessingResult = {
        emailId: 'minimal-123',
        senderInfo: testUtils.createMockSenderInfo(),
        images: []
      };
      
      expect(minimalResult.emailId).toBe('minimal-123');
      expect(minimalResult.images).toEqual([]);
      expect(minimalResult.subject).toBeUndefined();
      expect(minimalResult.totalImages).toBeUndefined();
    });
    
    test('should handle skipped processing', () => {
      const skippedResult: ProcessingResult = {
        emailId: 'skipped-123',
        senderInfo: testUtils.createMockSenderInfo(),
        images: [],
        skipped: true,
        reason: 'No images found'
      };
      
      expect(skippedResult.skipped).toBe(true);
      expect(skippedResult.reason).toBe('No images found');
    });
  });
  
  describe('VisionResult Interface', () => {
    test('should handle positive logo detection', () => {
      const logoResult: VisionResult = {
        isLogoOrSignature: true,
        type: 'logo',
        description: 'Google Logo',
        confidence: 0.95
      };
      
      expect(logoResult.isLogoOrSignature).toBe(true);
      expect(logoResult.type).toBe('logo');
      expect(logoResult.confidence).toBeGreaterThan(0.9);
    });
    
    test('should handle negative results', () => {
      const negativeResult: VisionResult = {
        isLogoOrSignature: false
      };
      
      expect(negativeResult.isLogoOrSignature).toBe(false);
      expect(negativeResult.type).toBeUndefined();
      expect(negativeResult.confidence).toBeUndefined();
    });
    
    test('should handle error cases', () => {
      const errorResult: VisionResult = {
        isLogoOrSignature: false,
        error: 'Vision API timeout',
        skipped: true
      };
      
      expect(errorResult.isLogoOrSignature).toBe(false);
      expect(errorResult.error).toBe('Vision API timeout');
      expect(errorResult.skipped).toBe(true);
    });
  });
  
  describe('ComponentContext Interface', () => {
    test('should accept complete component context', () => {
      const context: ComponentContext = {
        email: { id: 'test-email' },
        maxFileSize: 25,
        enableVisionFiltering: true,
        googleCloudVision: { $auth: {} },
        visionFilteringStrength: 'balanced',
        skipTinyImages: true,
        gmail: { $auth: {} },
        googleDrive: { $auth: {} }
      };
      
      expect(context.maxFileSize).toBe(25);
      expect(context.enableVisionFiltering).toBe(true);
      expect(context.visionFilteringStrength).toBe('balanced');
      expect(context.skipTinyImages).toBe(true);
    });
    
    test('should work with minimal configuration', () => {
      const minimalContext: ComponentContext = {};
      
      expect(minimalContext.email).toBeUndefined();
      expect(minimalContext.maxFileSize).toBeUndefined();
      expect(minimalContext.enableVisionFiltering).toBeUndefined();
    });
  });
  
  describe('Type Aliases', () => {
    test('VisionFilteringStrength should have correct values', () => {
      const conservative: VisionFilteringStrength = 'conservative';
      const balanced: VisionFilteringStrength = 'balanced';
      const aggressive: VisionFilteringStrength = 'aggressive';
      
      expect(conservative).toBe('conservative');
      expect(balanced).toBe('balanced');
      expect(aggressive).toBe('aggressive');
    });
    
    test('AttachmentType should have correct values', () => {
      const attachment: AttachmentType = 'attachment';
      const driveLink: AttachmentType = 'drive_link';
      
      expect(attachment).toBe('attachment');
      expect(driveLink).toBe('drive_link');
    });
    
    test('TextExtractionCallback should be callable', () => {
      const callback: TextExtractionCallback = (content: string) => {
        expect(typeof content).toBe('string');
      };
      
      callback('test content');
    });
  });
  
  describe('Interface Relationships', () => {
    test('ExtractedImage should extend ImageAttachment', () => {
      const imageAttachment = testUtils.createMockImageAttachment();
      const extractedImage: ExtractedImage = {
        ...imageAttachment,
        filePath: '/tmp/test.jpg',
        extractedAt: new Date().toISOString()
      };
      
      // Should have all properties from ImageAttachment
      expect(extractedImage.type).toBe(imageAttachment.type);
      expect(extractedImage.filename).toBe(imageAttachment.filename);
      expect(extractedImage.mimeType).toBe(imageAttachment.mimeType);
      expect(extractedImage.size).toBe(imageAttachment.size);
      
      // Plus additional properties
      expect(extractedImage.filePath).toBeDefined();
      expect(extractedImage.extractedAt).toBeDefined();
    });
    
    test('ProcessingResult should contain correct related types', () => {
      const result: ProcessingResult = {
        emailId: 'test-123',
        senderInfo: testUtils.createMockSenderInfo(),
        images: [
          {
            ...testUtils.createMockImageAttachment(),
            filePath: '/tmp/test.jpg',
            extractedAt: new Date().toISOString()
          }
        ]
      };
      
      // Verify type relationships
      expect(Array.isArray(result.images)).toBe(true);
      expect(result.images[0]).toHaveProperty('filePath');
      expect(result.images[0]).toHaveProperty('extractedAt');
      expect(result.senderInfo).toHaveProperty('email');
      expect(result.senderInfo).toHaveProperty('folderName');
    });
  });
  
  describe('Type Safety Validation', () => {
    test('should prevent invalid attachment types', () => {
      // This is more of a compile-time check, but we can verify valid values
      const validTypes: AttachmentType[] = ['attachment', 'drive_link'];
      
      validTypes.forEach(type => {
        const attachment: ImageAttachment = {
          type,
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024
        };
        
        expect(['attachment', 'drive_link']).toContain(attachment.type);
      });
    });
    
    test('should validate filtering strength options', () => {
      const validStrengths: VisionFilteringStrength[] = ['conservative', 'balanced', 'aggressive'];
      
      validStrengths.forEach(strength => {
        const context: ComponentContext = {
          visionFilteringStrength: strength
        };
        
        expect(['conservative', 'balanced', 'aggressive']).toContain(context.visionFilteringStrength);
      });
    });
  });
  
  describe('Interface Usage Patterns', () => {
    test('should support typical workflow types', () => {
      // Email data from trigger
      const emailData: EmailData = testUtils.createMockEmailData();
      
      // Sender extraction
      const senderInfo: SenderInfo = testUtils.createMockSenderInfo();
      
      // Image detection
      const imageAttachment: ImageAttachment = testUtils.createMockImageAttachment();
      
      // Image extraction
      const extractedImage: ExtractedImage = {
        ...imageAttachment,
        filePath: '/tmp/extracted.jpg',
        extractedAt: new Date().toISOString()
      };
      
      // Vision analysis
      const visionResult: VisionResult = {
        isLogoOrSignature: false
      };
      
      // Final result
      const result: ProcessingResult = {
        emailId: emailData.id,
        subject: emailData.subject,
        senderInfo,
        images: [extractedImage]
      };
      
      // Verify the complete workflow types work together
      expect(result.emailId).toBe(emailData.id);
      expect(result.images[0].filename).toBe(imageAttachment.filename);
      expect(visionResult.isLogoOrSignature).toBe(false);
    });
  });
});