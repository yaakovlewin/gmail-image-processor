// Simplified Image Processor - TypeScript Version (Exact Parity with Working JS)
// Combines image detection, extraction, and sender parsing into one streamlined component

// Constants - Embedded directly for reliability (like the original)
const CONSTANTS = {
	FILE_SIZE: {
		BYTES_PER_MB: 1024 * 1024,
		UNITS: ["Bytes", "KB", "MB", "GB"],
		CONVERSION_FACTOR: 1024,
	},
	IMAGE_TYPES: [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/bmp",
		"image/tiff",
		"image/svg+xml",
	],
	DRIVE_PATTERNS: [
		/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
		/https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
		/https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
	],
	VISION_API: {
		URL: "https://vision.googleapis.com/v1/images:annotate",
		// Labels that indicate non-content images to filter out
		NON_CONTENT_LABELS: [
			// Logos and branding
			"logo",
			"brand",
			"trademark",
			"emblem",
			"symbol",
			"icon",
			"badge",
			"seal",

			// Email signatures and footers
			"signature",
			"email signature",
			"footer",
			"watermark",

			// Tracking and technical elements
			"tracking pixel",
			"pixel",
			"beacon",
			"tracker",

			// UI elements and buttons
			"button",
			"interface",
			"menu",
			"navigation",
			"toolbar",
			"widget",

			// Social media icons
			"social media",
			"facebook icon",
			"twitter icon",
			"linkedin icon",
			"instagram icon",
			"youtube icon",

			// Generic non-content indicators
			"clipart",
			"graphic design",
			"template",
			"placeholder",
		],
		// Minimum image dimensions to avoid tiny tracking pixels
		MIN_IMAGE_SIZE: {
			WIDTH: 100,
			HEIGHT: 100,
		},
		CONFIDENCE_THRESHOLD: 0.6, // Lowered for better detection
		HIGH_CONFIDENCE_THRESHOLD: 0.8, // For stricter filtering
		MAX_LOGO_RESULTS: 10,
		MAX_LABEL_RESULTS: 20,
	},
	GMAIL_API: {
		BASE_URL: "https://gmail.googleapis.com/gmail/v1/users/me",
	},
	TEXT_MIME_TYPES: ["text/plain", "text/html"],
	FOLDER_NAME: {
		MAX_LENGTH: 50,
		INVALID_CHARS: /[<>:"/\\|?*]/g,
		FALLBACK: "Unknown Sender",
	},
} as const;

// Type definitions
interface EmailData {
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

interface SenderInfo {
	email: string;
	name: string;
	displayName: string;
	folderName: string;
	rawFrom: string;
}

interface ImageAttachment {
	type: 'attachment' | 'drive_link';
	filename: string;
	mimeType: string;
	size: number;
	attachmentId?: string;
	partId?: string;
	fileId?: string;
	url?: string;
}

interface ExtractedImage extends ImageAttachment {
	filePath: string;
	extractedAt: string;
}

interface ProcessingResult {
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

interface VisionResult {
	isLogoOrSignature: boolean;
	type?: string;
	description?: string;
	confidence?: number;
	error?: string;
	skipped?: boolean;
}

// Component interface for proper typing
interface ComponentContext {
	email?: any;
	maxFileSize?: number;
	enableVisionFiltering?: boolean;
	googleCloudVision?: any;
	visionFilteringStrength?: string;
	skipTinyImages?: boolean;
	gmail?: any;
	googleDrive?: any;
}

export default {
	name: "simplified-image-processor",
	version: "2.0.0",
	key: "simplified-image-processor-ts",
	description:
		"Detects, extracts, and intelligently filters images from Gmail emails with enhanced Cloud Vision integration (TypeScript)",
	type: "action",

	props: {
		email: {
			type: "object",
			label: "Email Data",
			description:
				"Email data from Gmail trigger (e.g., steps.trigger.event)",
		},
		gmail: {
			type: "app",
			app: "gmail",
		},
		googleDrive: {
			type: "app",
			app: "google_drive",
		},
		maxFileSize: {
			type: "integer",
			label: "Max File Size (MB)",
			description: "Maximum file size to download (in MB)",
			default: 25,
			min: 1,
			max: 100,
		},
		enableVisionFiltering: {
			type: "boolean",
			label: "Enable Smart Image Filtering (Optional)",
			description:
				"Use Google Cloud Vision to filter out logos, icons, tracking pixels, and other non-content images",
			default: false,
			optional: true,
		},
		googleCloudVision: {
			type: "app",
			app: "google_cloud_vision_api",
			label: "Google Cloud Vision",
			description:
				"Connect your Google Cloud Vision account (required if filtering enabled)",
		},
		visionFilteringStrength: {
			type: "string",
			label: "Filtering Strength",
			description: "How aggressively to filter non-content images",
			options: [
				{
					label: "Conservative (High confidence only)",
					value: "conservative",
				},
				{ label: "Balanced (Recommended)", value: "balanced" },
				{
					label: "Aggressive (Lower confidence threshold)",
					value: "aggressive",
				},
			],
			default: "balanced",
			optional: true,
		},
		skipTinyImages: {
			type: "boolean",
			label: "Skip Tiny Images",
			description:
				"Automatically skip very small images (likely tracking pixels)",
			default: true,
			optional: true,
		},
	},

	async run({ steps, $ }: { steps: any; $: any }): Promise<ProcessingResult> {
		const self = this as any;
		const email = self.getEmailData(steps);
		self.logEmailProcessingStart(email);

		try {
			const senderInfo = self.extractSenderFromTrigger(email);
			self.logSenderInfo(senderInfo);

			const detectedImages = await self.detectAllImages(email);
			self.logDetectedImages(detectedImages);

			if (detectedImages.length === 0) {
				return self.createNoImagesResult(email, senderInfo);
			}

			const extractedImages = await self.extractAllImages(
				detectedImages,
				email.id
			);
			self.logExtractedImages(extractedImages);
			self.logVisionFilteringStats(
				detectedImages.length,
				extractedImages.length,
				detectedImages.length - extractedImages.length
			);

			const result = self.createSuccessResult(
				email,
				senderInfo,
				extractedImages
			);
			$.export("processed_images", result);
			return result;
		} catch (error) {
			self.handleProcessingError(error);
			throw error; // This line will never be reached but satisfies TypeScript
		}
	},

	methods: {
		// === EMAIL DATA HANDLING ===
		getEmailData(steps: any): EmailData {
			const self = this as any;
			const email = self.email || steps.trigger?.event;
			if (!email) {
				throw new Error("No email data provided from Gmail trigger");
			}
			return email;
		},

		// === LOGGING METHODS ===
		logEmailProcessingStart(email: EmailData): void {
			console.log(
				`📧 Processing email: "${email.subject || 'No Subject'}" from ${email.from || 'Unknown'}`
			);
		},

		logSenderInfo(senderInfo: SenderInfo): void {
			console.log(
				`👤 Sender: ${senderInfo.displayName} (${senderInfo.email})`
			);
		},

		logDetectedImages(detectedImages: ImageAttachment[]): void {
			console.log(`🔍 Found ${detectedImages.length} images`);
		},

		logExtractedImages(extractedImages: ExtractedImage[]): void {
			console.log(
				`📥 Successfully extracted ${extractedImages.length} images`
			);
		},

		logVisionFilteringStats(totalDetected: number, totalExtracted: number, filteredCount: number): void {
			const self = this as any;
			if (self.enableVisionFiltering && filteredCount > 0) {
				console.log(
					`🔍 Vision filtering results: ${totalDetected} detected → ${totalExtracted} kept (${filteredCount} filtered out)`
				);
			}
		},

		// === RESULT CREATION ===
		createNoImagesResult(email: EmailData, senderInfo: SenderInfo): ProcessingResult {
			console.log("⏭️ No images found in email");
			return {
				emailId: email.id,
				senderInfo,
				images: [],
				skipped: true,
				reason: "No images found",
			};
		},

		createSuccessResult(email: EmailData, senderInfo: SenderInfo, extractedImages: ExtractedImage[]): ProcessingResult {
			const self = this as any;
			const result: ProcessingResult = {
				emailId: email.id,
				subject: email.subject || 'No Subject',
				senderInfo,
				images: extractedImages,
				processedAt: new Date().toISOString(),
				totalImages: extractedImages.length,
			};

			// Add Vision filtering information if enabled
			if (self.enableVisionFiltering) {
				result.visionFiltering = {
					enabled: true,
					strength: self.visionFilteringStrength || "balanced",
					skipTinyImages: self.skipTinyImages || false,
				};
			}

			return result;
		},

		// === ERROR HANDLING ===
		handleProcessingError(error: any): never {
			console.error("❌ Image processing failed:", error);
			throw new Error(`Image processing failed: ${error.message}`);
		},

		// === SENDER EXTRACTION ===
		extractSenderFromTrigger(email: EmailData): SenderInfo {
			try {
				const parsedFrom = email.parsedHeaders?.from;

				if (this.hasParsedSenderData(parsedFrom)) {
					console.log(
						`✅ Using pre-parsed sender data: ${parsedFrom!.name || 'Unknown'} <${parsedFrom!.email}>`
					);
					return this.createSenderInfoFromParsed(parsedFrom!, email);
				}

				console.warn(
					"⚠️ Pre-parsed sender data not available, falling back to manual parsing"
				);
				return this.fallbackSenderExtraction(email.from || '');
			} catch (error) {
				console.warn(
					"Failed to extract sender from trigger data:",
					error
				);
				return this.fallbackSenderExtraction(email.from || '');
			}
		},

		hasParsedSenderData(parsedFrom: any): parsedFrom is { name?: string; email: string } {
			return parsedFrom && parsedFrom.email;
		},

		createSenderInfoFromParsed(parsedFrom: { name?: string; email: string }, email: EmailData): SenderInfo {
			const name: string = parsedFrom.name || parsedFrom.email.split("@")[0] || 'Unknown';
			const senderInfo: SenderInfo = {
				email: parsedFrom.email,
				name: name,
				displayName: name,
				folderName: "",
				rawFrom:
					email.from || `${parsedFrom.name || 'Unknown'} <${parsedFrom.email}>`,
			};

			senderInfo.folderName = this.sanitizeFolderName(
				senderInfo.displayName
			);
			return senderInfo;
		},

		fallbackSenderExtraction(fromHeader: string): SenderInfo {
			const senderInfo = this.createEmptySenderInfo(fromHeader);

			try {
				if (!fromHeader) {
					throw new Error("No from header provided");
				}

				this.parseFromHeader(fromHeader, senderInfo);
				this.finalizeSenderInfo(senderInfo);
				return senderInfo;
			} catch (error) {
				console.warn("Fallback sender extraction failed:", error);
				return this.createUnknownSenderInfo(fromHeader);
			}
		},

		createEmptySenderInfo(fromHeader: string): SenderInfo {
			return {
				email: "",
				name: "",
				displayName: "",
				folderName: "",
				rawFrom: fromHeader || "Unknown",
			};
		},

		parseFromHeader(fromHeader: string, senderInfo: SenderInfo): void {
			const emailRegex = /<([^>]+)>/;
			const nameRegex = /^([^<]+)</;

			const emailMatch = fromHeader.match(emailRegex);
			if (emailMatch && emailMatch[1]) {
				senderInfo.email = emailMatch[1].trim();
				const nameMatch = fromHeader.match(nameRegex);
				if (nameMatch && nameMatch[1]) {
					senderInfo.name = nameMatch[1].trim().replace(/"/g, "");
				}
			} else {
				senderInfo.email = fromHeader.trim();
			}
		},

		finalizeSenderInfo(senderInfo: SenderInfo): void {
			if (!senderInfo.name && senderInfo.email) {
				senderInfo.name = senderInfo.email.split("@")[0] || 'Unknown';
			}
			senderInfo.displayName = senderInfo.name || senderInfo.email || 'Unknown';
			senderInfo.folderName = this.sanitizeFolderName(
				senderInfo.displayName
			);
		},

		createUnknownSenderInfo(fromHeader: string): SenderInfo {
			return {
				email: "unknown@example.com",
				name: "Unknown Sender",
				displayName: "Unknown Sender",
				folderName: "Unknown Sender",
				rawFrom: fromHeader || "Unknown",
			};
		},

		sanitizeFolderName(name: string): string {
			return (
				name
					.replace(CONSTANTS.FOLDER_NAME.INVALID_CHARS, "_")
					.replace(/_{2,}/g, "_")
					.replace(/^_|_$/g, "")
					.trim()
					.substring(0, CONSTANTS.FOLDER_NAME.MAX_LENGTH) ||
				CONSTANTS.FOLDER_NAME.FALLBACK
			);
		},

		// === IMAGE DETECTION ===
		async detectAllImages(email: EmailData): Promise<ImageAttachment[]> {
			const allImages: ImageAttachment[] = [];

			const attachments = this.findImageAttachments(email.payload);
			allImages.push(...attachments);

			const driveLinks = await this.findDriveLinks(email);
			allImages.push(...driveLinks);

			return allImages;
		},

		findImageAttachments(payload: any): ImageAttachment[] {
			const attachments: ImageAttachment[] = [];
			this.searchPartsForAttachments(payload, attachments);
			return attachments;
		},

		searchPartsForAttachments(payload: any, attachments: ImageAttachment[]): void {
			if (payload.parts) {
				this.searchPartsRecursively(payload.parts, attachments);
			} else if (this.isSinglePartImageAttachment(payload)) {
				attachments.push(this.createAttachmentInfo(payload, "0"));
			}
		},

		searchPartsRecursively(parts: any[], attachments: ImageAttachment[], parentPartId = ""): void {
			if (!parts) return;

			parts.forEach((part, index) => {
				const partId = parentPartId
					? `${parentPartId}.${index}`
					: `${index}`;

				if (this.isImageAttachment(part)) {
					attachments.push(this.createAttachmentInfo(part, partId));
				}

				if (part.parts) {
					this.searchPartsRecursively(
						part.parts,
						attachments,
						partId
					);
				}
			});
		},

		isImageAttachment(part: any): boolean {
			return (
				part.body?.attachmentId && this.isImageMimeType(part.mimeType)
			);
		},

		isSinglePartImageAttachment(payload: any): boolean {
			return (
				payload.body?.attachmentId &&
				this.isImageMimeType(payload.mimeType)
			);
		},

		createAttachmentInfo(part: any, partId: string): ImageAttachment {
			return {
				type: "attachment",
				filename: part.filename || this.generateFilename(part.mimeType),
				mimeType: part.mimeType,
				size: part.body.size || 0,
				attachmentId: part.body.attachmentId,
				partId,
			};
		},

		// === DRIVE LINKS DETECTION ===
		async findDriveLinks(email: EmailData): Promise<ImageAttachment[]> {
			const driveLinks: ImageAttachment[] = [];
			const textContent = this.extractAllTextContent(email.payload);
			const self = this as any;

			// Check if Google Drive is connected
			if (!self.googleDrive) {
				console.warn(
					`⚠️ Google Drive not connected - Drive links will be skipped. Please connect your Google Drive account in the workflow configuration.`
				);
				return driveLinks;
			}

			// Safety check: Skip processing if text content is extremely large (>1MB)
			if (textContent.length > 1024 * 1024) {
				console.warn(
					`⚠️ Skipping Drive link detection: text content too large (${textContent.length} characters)`
				);
				return driveLinks;
			}

			for (const pattern of CONSTANTS.DRIVE_PATTERNS) {
				await this.processDrivePattern(
					pattern,
					textContent,
					driveLinks
				);
			}

			return driveLinks;
		},

		async processDrivePattern(pattern: RegExp, textContent: string, driveLinks: ImageAttachment[]): Promise<void> {
			// Create a global version of the pattern for matchAll
			const globalPattern = new RegExp(pattern.source, "g");
			const matches = textContent.matchAll(globalPattern);

			for (const match of matches) {
				const fileId = match[1];
				if (fileId) {
					const driveLink = await this.createDriveLinkInfo(
						fileId,
						match[0]
					);
					if (driveLink) {
						driveLinks.push(driveLink);
					}
				}
			}
		},

		async createDriveLinkInfo(fileId: string, url: string): Promise<ImageAttachment | null> {
			try {
				const metadata = await this.getDriveFileMetadata(fileId);

				if (!metadata) {
					return null;
				}

				if (metadata && this.isImageMimeType(metadata.mimeType)) {
					return {
						type: "drive_link",
						fileId,
						filename: metadata.name || `drive-file-${fileId}`,
						mimeType: metadata.mimeType,
						size: parseInt(metadata.size || '0') || 0,
						url,
					};
				}
			} catch (error: any) {
				console.warn(
					`Could not access Drive file ${fileId}: ${error.message}`
				);
			}
			return null;
		},

		// === TEXT CONTENT EXTRACTION ===
		extractAllTextContent(payload: any): string {
			let textContent = "";
			this.extractTextFromPayload(payload, (content) => {
				textContent += content + "\n";
			});
			return textContent;
		},

		extractTextFromPayload(payload: any, callback: (content: string) => void): void {
			if (payload.parts) {
				payload.parts.forEach((part: any) =>
					this.extractTextFromPart(part, callback)
				);
			} else {
				this.extractTextFromPart(payload, callback);
			}
		},

		extractTextFromPart(part: any, callback: (content: string) => void): void {
			if (this.isTextMimeType(part.mimeType) && part.body?.data) {
				// Use atob for base64 decoding in browser/Pipedream environment
				const decodedContent = atob(part.body.data);
				callback(decodedContent);
			}

			if (part.parts) {
				part.parts.forEach((subPart: any) =>
					this.extractTextFromPart(subPart, callback)
				);
			}
		},

		isTextMimeType(mimeType: string): boolean {
			return (CONSTANTS.TEXT_MIME_TYPES as readonly string[]).includes(mimeType);
		},

		// === IMAGE EXTRACTION ===
		async extractAllImages(detectedImages: ImageAttachment[], emailId: string): Promise<ExtractedImage[]> {
			const extractedImages: ExtractedImage[] = [];

			// Safety limit: Don't process more than 20 images at once
			const maxImages = 20;
			if (detectedImages.length > maxImages) {
				console.warn(
					`⚠️ Too many images detected (${detectedImages.length}). Processing only the first ${maxImages} images.`
				);
				detectedImages = detectedImages.slice(0, maxImages);
			}

			for (const image of detectedImages) {
				const extractedImage = await this.processDetectedImage(
					image,
					emailId
				);
				if (extractedImage) {
					extractedImages.push(extractedImage);
				}
			}

			return extractedImages;
		},

		async processDetectedImage(image: ImageAttachment, emailId: string): Promise<ExtractedImage | null> {
			try {
				console.log(`   📎 Processing: ${image.filename}`);

				if (this.exceedsMaxSize(image.size)) {
					console.warn(
						`   ⚠️ Skipping large file: ${
							image.filename
						} (${this.formatFileSize(image.size)})`
					);
					return null;
				}

				const extractedImage = await this.downloadImage(image, emailId);
				if (!extractedImage) return null;

				if (
					await this.shouldSkipImageDueToVision(extractedImage, image)
				) {
					await this.cleanupTempFile(extractedImage.filePath);
					return null;
				}

				return {
					...image,
					filePath: extractedImage.filePath,
					extractedAt: new Date().toISOString(),
				};
			} catch (error: any) {
				console.error(
					`   ❌ Failed to extract ${image.filename}:`,
					error.message
				);
				return null;
			}
		},

		async downloadImage(image: ImageAttachment, emailId: string): Promise<{ filePath: string; size: number } | null> {
			if (image.type === "attachment") {
				return await this.downloadGmailAttachment(
					emailId,
					image.attachmentId!,
					image.filename
				);
			} else if (image.type === "drive_link") {
				return await this.downloadDriveFile(
					image.fileId!,
					image.filename
				);
			}
			return null;
		},

		async shouldSkipImageDueToVision(extractedImage: { filePath: string; size: number }, image: ImageAttachment): Promise<boolean> {
			const self = this as any;
			if (!self.enableVisionFiltering) return false;

			const visionCheck = await this.checkForLogoOrSignature(
				extractedImage.filePath,
				image.filename
			);

			if (visionCheck.isLogoOrSignature) {
				console.log(
					`   🚫 Skipping ${visionCheck.type}: ${image.filename} (${visionCheck.description})`
				);
				return true;
			}

			return false;
		},

		async cleanupTempFile(filePath: string): Promise<void> {
			try {
				const fs = await import("fs") as any;
				await fs.promises.unlink(filePath);
			} catch (e) {
				// Ignore cleanup errors
			}
		},

		// === FILE DOWNLOAD METHODS ===
		async downloadGmailAttachment(messageId: string, attachmentId: string, filename: string): Promise<{ filePath: string; size: number } | null> {
			try {
				const { axios } = await import("@pipedream/platform") as any;
				const fs = await import("fs") as any;

				const tmpFilePath = this.createTempFilePath(filename);
				const response = await this.makeGmailAttachmentRequest(
					messageId,
					attachmentId
				);

				if (response.data) {
					// Convert base64 to binary for file writing
					const binaryString = atob(response.data);
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					await fs.promises.writeFile(tmpFilePath, bytes);
					return { filePath: tmpFilePath, size: bytes.length };
				}

				return null;
			} catch (error: any) {
				console.error("Gmail API error:", error);
				throw new Error(
					`Failed to download Gmail attachment: ${error.message}`
				);
			}
		},

		async makeGmailAttachmentRequest(messageId: string, attachmentId: string): Promise<any> {
			const { axios } = await import("@pipedream/platform") as any;
			const self = this as any;
			return await axios(this, {
				url: `${CONSTANTS.GMAIL_API.BASE_URL}/messages/${messageId}/attachments/${attachmentId}`,
				headers: {
					Authorization: `Bearer ${self.gmail.$auth.oauth_access_token}`,
				},
			});
		},

		async getDriveFileMetadata(fileId: string): Promise<any | null> {
			const self = this as any;
			// Check if Google Drive is properly connected
			if (!self.googleDrive) {
				console.warn(
					`⚠️ Google Drive not connected - skipping file ${fileId}`
				);
				return null;
			}

			try {
				const { axios } = await import("@pipedream/platform") as any;

				const response = await axios(this, {
					method: "GET",
					url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
					headers: {
						Authorization: `Bearer ${self.googleDrive.$auth.oauth_access_token}`,
					},
					params: {
						fields: "id,name,mimeType,size,createdTime,modifiedTime",
					},
				});

				return response;
			} catch (error: any) {
				console.warn(
					`Could not access Drive file ${fileId}: ${error.message}`
				);
				return null;
			}
		},

		async downloadDriveFile(fileId: string, filename: string): Promise<{ filePath: string; size: number }> {
			const self = this as any;
			// Check if Google Drive is properly connected
			if (!self.googleDrive) {
				throw new Error("Google Drive not connected");
			}

			try {
				const fs = await import("fs") as any;
				const { axios } = await import("@pipedream/platform") as any;
				const tmpFilePath = this.createTempFilePath(filename, "drive_");

				const response = await axios(this, {
					method: "GET",
					url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
					headers: {
						Authorization: `Bearer ${self.googleDrive.$auth.oauth_access_token}`,
					},
					params: {
						alt: "media",
					},
					responseType: "arraybuffer",
				});

				// Convert arraybuffer to Uint8Array for file writing
				const bytes = new Uint8Array(response);
				await fs.promises.writeFile(tmpFilePath, bytes);
				return {
					filePath: tmpFilePath,
					size: bytes.length,
				};
			} catch (error: any) {
				throw new Error(
					`Failed to download Drive file: ${error.message}`
				);
			}
		},

		// === UTILITY METHODS ===
		createTempFilePath(filename: string, prefix = ""): string {
			const timestamp = Date.now();
			const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
			return `/tmp/${timestamp}_${prefix}${sanitizedFilename}`;
		},

		exceedsMaxSize(fileSize: number): boolean {
			const self = this as any;
			const maxSizeBytes =
				(self.maxFileSize || 25) * CONSTANTS.FILE_SIZE.BYTES_PER_MB;
			return fileSize > maxSizeBytes;
		},

		isImageMimeType(mimeType: string): boolean {
			return (CONSTANTS.IMAGE_TYPES as readonly string[]).includes(mimeType);
		},

		generateFilename(mimeType: string): string {
			const extension = mimeType.split("/")[1] || "jpg";
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			return `image_${timestamp}.${extension}`;
		},

		formatFileSize(bytes: number): string {
			if (bytes === 0) return "0 Bytes";

			const { UNITS, CONVERSION_FACTOR } = CONSTANTS.FILE_SIZE;
			const i = Math.floor(Math.log(bytes) / Math.log(CONVERSION_FACTOR));
			const size = parseFloat(
				(bytes / Math.pow(CONVERSION_FACTOR, i)).toFixed(2)
			);

			return `${size} ${UNITS[i]}`;
		},

		// === VISION API METHODS ===
		async checkForLogoOrSignature(imagePath: string, filename: string): Promise<VisionResult> {
			const self = this as any;
			if (!self.enableVisionFiltering || !self.googleCloudVision) {
				return { isLogoOrSignature: false, skipped: true };
			}

			try {
				console.log(
					`   🔍 Analyzing ${filename} for non-content images...`
				);

				// First check image dimensions if enabled
				if (self.skipTinyImages) {
					const dimensionCheck = await this.checkImageDimensions(
						imagePath,
						filename
					);
					if (dimensionCheck.isLogoOrSignature) {
						return dimensionCheck;
					}
				}

				const base64Image = await this.readImageAsBase64(imagePath);
				const visionResponse = await this.callVisionAPI(
					base64Image,
					filename
				);

				return this.processVisionResponse(visionResponse, filename);
			} catch (error: any) {
				console.warn(
					`   ⚠️ Vision API error for ${filename}:`,
					error.message
				);
				return { isLogoOrSignature: false, error: error.message };
			}
		},

		async checkImageDimensions(imagePath: string, filename: string): Promise<VisionResult> {
			try {
				// Use sharp or similar library to get image dimensions
				// For now, we'll use a basic approach with the file system
				const fs = await import("fs") as any;
				const stats = await fs.promises.stat(imagePath);

				// If file is very small, likely a tracking pixel
				if (stats.size < 1000) {
					// Less than 1KB
					console.log(
						`   🚫 Skipping tiny file: ${filename} (${stats.size} bytes)`
					);
					return {
						isLogoOrSignature: true,
						type: "tiny image",
						description: `Very small file (${stats.size} bytes)`,
						confidence: 1.0,
					};
				}

				return { isLogoOrSignature: false };
			} catch (error: any) {
				console.warn(
					`   ⚠️ Could not check dimensions for ${filename}:`,
					error.message
				);
				return { isLogoOrSignature: false };
			}
		},

		async readImageAsBase64(imagePath: string): Promise<string> {
			const fs = await import("fs") as any;
			const imageBuffer = await fs.promises.readFile(imagePath);
			// Convert buffer to base64 string
			const bytes = new Uint8Array(imageBuffer);
			let binary = '';
			for (let i = 0; i < bytes.byteLength; i++) {
				const byte = bytes[i];
				if (byte !== undefined) {
					binary += String.fromCharCode(byte);
				}
			}
			return btoa(binary);
		},

		async callVisionAPI(base64Image: string, filename: string): Promise<any> {
			const { axios } = await import("@pipedream/platform") as any;

			try {
				// Safety check: Skip if base64 image is too large (>10MB when encoded)
				if (base64Image.length > 10 * 1024 * 1024) {
					console.warn(
						`   ⚠️ Skipping Vision API for ${filename}: image too large for processing`
					);
					return {
						isLogoOrSignature: false,
						error: "Image too large for Vision API processing",
					};
				}

				// Add timeout to prevent hanging
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(
						() => reject(new Error("Vision API timeout")),
						30000
					); // 30 second timeout
				});

				const self = this as any;
				const apiPromise = axios(this, {
					method: "POST",
					url: CONSTANTS.VISION_API.URL,
					headers: {
						Authorization: `Bearer ${self.googleCloudVision.$auth.oauth_access_token}`,
						"Content-Type": "application/json",
					},
					data: this.createVisionAPIRequest(base64Image),
				});

				return await Promise.race([apiPromise, timeoutPromise]);
			} catch (apiError: any) {
				console.warn(
					`   ⚠️ Vision API call failed for ${filename}:`,
					apiError.message
				);
				return {
					isLogoOrSignature: false,
					error: `Vision API call failed: ${apiError.message}`,
				};
			}
		},

		createVisionAPIRequest(base64Image: string): any {
			return {
				requests: [
					{
						image: { content: base64Image },
						features: [
							{
								type: "LOGO_DETECTION",
								maxResults:
									CONSTANTS.VISION_API.MAX_LOGO_RESULTS,
							},
							{
								type: "LABEL_DETECTION",
								maxResults:
									CONSTANTS.VISION_API.MAX_LABEL_RESULTS,
							},
							{
								type: "IMAGE_PROPERTIES",
								maxResults: 1,
							},
						],
					},
				],
			};
		},

		processVisionResponse(visionResponse: any, filename: string): VisionResult {
			if (!this.isValidVisionResponse(visionResponse, filename)) {
				return {
					isLogoOrSignature: false,
					error: "Invalid Vision API response",
				};
			}

			const result = visionResponse.responses[0];

			if (result.error) {
				console.warn(
					`   ⚠️ Vision API error for ${filename}:`,
					result.error.message || "Unknown error"
				);
				return {
					isLogoOrSignature: false,
					error: result.error.message || "Vision API error",
				};
			}

			// Check image properties for tiny dimensions
			const dimensionResult = this.checkImageProperties(result, filename);
			if (dimensionResult) return dimensionResult;

			// Check for logos
			const logoResult = this.checkForLogos(result);
			if (logoResult) return logoResult;

			// Check for non-content labels (enhanced filtering)
			const nonContentResult = this.checkForNonContentLabels(
				result,
				filename
			);
			if (nonContentResult) return nonContentResult;

			return { isLogoOrSignature: false };
		},

		checkImageProperties(result: any, filename: string): VisionResult | null {
			if (!result.imagePropertiesAnnotation) return null;

			// This would contain image dimensions if available
			// For now, we rely on file size check done earlier
			return null;
		},

		checkForNonContentLabels(result: any, filename: string): VisionResult | null {
			if (!result.labelAnnotations) return null;

			const confidenceThreshold = this.getConfidenceThreshold();

			for (const label of result.labelAnnotations) {
				const labelText = label.description.toLowerCase();

				// Check against our comprehensive non-content labels list
				if (
					CONSTANTS.VISION_API.NON_CONTENT_LABELS.includes(labelText)
				) {
					if (label.score >= confidenceThreshold) {
						console.log(
							`   🚫 Skipping non-content image: ${
								label.description
							} (${(label.score * 100).toFixed(1)}% confidence)`
						);
						return {
							isLogoOrSignature: true,
							type: this.categorizeNonContentType(labelText),
							description: label.description,
							confidence: label.score,
						};
					}
				}

				// Check for partial matches (e.g., "facebook" in "facebook icon")
				if (
					this.isPartialNonContentMatch(
						labelText,
						label.score,
						confidenceThreshold
					)
				) {
					console.log(
						`   🚫 Skipping non-content image (partial match): ${
							label.description
						} (${(label.score * 100).toFixed(1)}% confidence)`
					);
					return {
						isLogoOrSignature: true,
						type: "non-content",
						description: label.description,
						confidence: label.score,
					};
				}
			}

			return null;
		},

		getConfidenceThreshold(): number {
			const self = this as any;
			const strength = self.visionFilteringStrength || "balanced";
			switch (strength) {
				case "conservative":
					return CONSTANTS.VISION_API.HIGH_CONFIDENCE_THRESHOLD;
				case "aggressive":
					return CONSTANTS.VISION_API.CONFIDENCE_THRESHOLD - 0.2;
				case "balanced":
				default:
					return CONSTANTS.VISION_API.CONFIDENCE_THRESHOLD;
			}
		},

		categorizeNonContentType(labelText: string): string {
			if (
				labelText.includes("logo") ||
				labelText.includes("brand") ||
				labelText.includes("trademark")
			) {
				return "logo/brand";
			}
			if (labelText.includes("icon") || labelText.includes("symbol")) {
				return "icon";
			}
			if (
				labelText.includes("pixel") ||
				labelText.includes("tracker") ||
				labelText.includes("beacon")
			) {
				return "tracking pixel";
			}
			if (
				labelText.includes("signature") ||
				labelText.includes("footer") ||
				labelText.includes("watermark")
			) {
				return "signature/footer";
			}
			if (
				labelText.includes("button") ||
				labelText.includes("interface") ||
				labelText.includes("menu")
			) {
				return "UI element";
			}
			return "non-content";
		},

		isPartialNonContentMatch(labelText: string, confidence: number, threshold: number): boolean {
			// Check for social media platform names that might indicate icons
			const socialPlatforms = [
				"facebook",
				"twitter",
				"linkedin",
				"instagram",
				"youtube",
				"tiktok",
				"snapchat",
			];
			const uiTerms = [
				"button",
				"icon",
				"menu",
				"navigation",
				"interface",
			];
			const brandTerms = ["logo", "brand", "trademark", "symbol"];

			const partialMatches = [
				...socialPlatforms,
				...uiTerms,
				...brandTerms,
			];

			return partialMatches.some(
				(term) => labelText.includes(term) && confidence >= threshold
			);
		},

		isValidVisionResponse(visionResponse: any, filename: string): boolean {
			if (!visionResponse || !visionResponse.responses) {
				console.warn(
					`   ⚠️ Invalid Vision API response structure for ${filename}`
				);
				return false;
			}

			if (!visionResponse.responses[0]) {
				console.warn(
					`   ⚠️ No response from Vision API for ${filename}`
				);
				return false;
			}

			return true;
		},

		checkForLogos(result: any): VisionResult | null {
			if (result.logoAnnotations && result.logoAnnotations.length > 0) {
				const logoName = result.logoAnnotations[0].description;
				console.log(`   🏷️ Logo detected: ${logoName}`);
				return {
					isLogoOrSignature: true,
					type: "logo",
					description: logoName,
					confidence: result.logoAnnotations[0].score,
				};
			}
			return null;
		},
	},
};