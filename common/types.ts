// Shared Type Definitions
// All interfaces used across the Gmail Image Processor components

/**
 * Email data structure from Gmail trigger
 */
export interface EmailData {
	id: string;
	subject?: string;
	from?: string;
	payload: any;
	parsedHeaders?: {
		from?: {
			name?: string;
			email: string;
		};
	};
}

/**
 * Parsed sender information with display formatting
 */
export interface SenderInfo {
	email: string;
	name: string;
	displayName: string;
	folderName: string;
	rawFrom: string;
}

/**
 * Image attachment found in email (either direct attachment or Drive link)
 */
export interface ImageAttachment {
	type: 'attachment' | 'drive_link';
	filename: string;
	mimeType: string;
	size: number;
	attachmentId?: string;
	partId?: string;
	fileId?: string;
	url?: string;
}

/**
 * Successfully extracted image with local file path
 */
export interface ExtractedImage extends ImageAttachment {
	filePath: string;
	extractedAt: string;
}

/**
 * Final processing result returned by the component
 */
export interface ProcessingResult {
	emailId: string;
	subject?: string;
	senderInfo: SenderInfo;
	images: ExtractedImage[];
	processedAt?: string;
	totalImages?: number;
	skipped?: boolean;
	reason?: string;
	visionFiltering?: {
		enabled: boolean;
		strength: string;
		skipTinyImages: boolean;
	};
}

/**
 * Result from Google Cloud Vision API analysis
 */
export interface VisionResult {
	isLogoOrSignature: boolean;
	type?: string;
	description?: string;
	confidence?: number;
	error?: string;
	skipped?: boolean;
}

/**
 * Component context interface for proper typing of 'this'
 */
export interface ComponentContext {
	email?: any;
	maxFileSize?: number;
	enableVisionFiltering?: boolean;
	googleCloudVision?: any;
	visionFilteringStrength?: string;
	skipTinyImages?: boolean;
	gmail?: any;
	googleDrive?: any;
}

/**
 * Configuration for Vision API filtering strength
 */
export type VisionFilteringStrength = 'conservative' | 'balanced' | 'aggressive';

/**
 * Image attachment type discriminator
 */
export type AttachmentType = 'attachment' | 'drive_link';

/**
 * Utility type for email parsing callbacks
 */
export type TextExtractionCallback = (content: string) => void;