# Gmail Image Processor - Modular Architecture

A comprehensive, modular Gmail image processing system built for Pipedream using official common files pattern.

## 🏗️ Architecture Overview

This system follows Pipedream's official common files pattern with a main app file and shared common modules:

```
gmail-image-processor/
├── gmail-image-processor.app.mjs     # Main app with prop definitions
├── common/                           # Shared modules (Pipedream pattern)
│   ├── constants.mjs                 # All constants and configuration
│   ├── utils.mjs                     # Utility functions
│   └── types.mjs                     # Type definitions and validation
└── actions/                          # Individual components
    ├── email-image-detector.mjs      # Detects images in emails
    ├── image-extractor.mjs           # Downloads detected images
    ├── vision-content-filter.mjs     # Filters using Google Vision
    └── image-processor-orchestrator.mjs # Complete pipeline
```

## 🚀 Components

### 1. **Email Image Detector** (`email-image-detector.mjs`)

-   **Purpose**: Detects images in Gmail emails
-   **Sources**: Gmail attachments, Google Drive links
-   **Output**: List of detected images with metadata
-   **Key Features**:
    -   Recursive email part parsing
    -   Google Drive link extraction
    -   Sender information parsing
    -   Comprehensive image detection

### 2. **Image Extractor** (`image-extractor.mjs`)

-   **Purpose**: Downloads detected images to temporary storage
-   **Input**: Detection results from step 1
-   **Output**: Extracted images with file paths
-   **Key Features**:
    -   Gmail attachment download via API
    -   Google Drive file download
    -   File size validation
    -   Error handling and cleanup

### 3. **Vision Content Filter** (`vision-content-filter.mjs`)

-   **Purpose**: Filters out non-content images using Google Cloud Vision
-   **Input**: Extracted images from step 2
-   **Output**: Filtered images (content only)
-   **Key Features**:
    -   Logo and brand detection
    -   Tracking pixel identification
    -   UI element filtering
    -   Configurable filtering strength
    -   Comprehensive statistics

### 5. **Drive Uploader** (`drive-uploader.mjs`)

-   **Purpose**: Uploads processed images to Google Drive with folder organization
-   **Input**: Processed images from previous steps
-   **Output**: Upload results with Drive links
-   **Key Features**:
    -   Automatic folder creation by sender
    -   Configurable folder structure
    -   Unique filename generation
    -   Comprehensive upload statistics
    -   Error handling and retry logic

### 6. **Image Processor Orchestrator** (`image-processor-orchestrator.mjs`)

-   **Purpose**: Image processing pipeline (detection → extraction → filtering)
-   **Input**: Email data from Gmail trigger
-   **Output**: Processed images ready for upload
-   **Key Features**:
    -   End-to-end image processing
    -   Vision filtering integration
    -   Performance monitoring
    -   Comprehensive logging

### 7. **Complete Workflow Orchestrator** (`complete-workflow-orchestrator.mjs`)

-   **Purpose**: Full end-to-end workflow (Gmail → Processing → Drive)
-   **Input**: Email data from Gmail trigger
-   **Output**: Complete workflow results with Drive upload
-   **Key Features**:
    -   Complete automation
    -   All processing steps integrated
    -   Drive upload included
    -   Comprehensive statistics and monitoring

## 📦 Common Modules

### Constants (`common/constants.mjs`)

-   File size configurations
-   Image type definitions
-   Google Drive URL patterns
-   Vision API settings
-   Gmail API endpoints

### Utils (`common/utils.mjs`)

-   File operations
-   Image utilities
-   Sender parsing
-   Vision API helpers
-   Logging functions
-   Validation utilities

### Types (`common/types.mjs`)

-   JSDoc type definitions
-   Runtime validation functions
-   Type creation helpers
-   Data structure validators

## 🔧 Usage Options

### Option 1: Individual Components (Maximum Flexibility)

Use components separately for custom workflows:

```javascript
// Step 1: Detect images
const detectionResult = await steps.email_image_detector.run({
	email: steps.trigger.event,
});

// Step 2: Extract images
const extractionResult = await steps.image_extractor.run({
	detectionResult: detectionResult,
	maxFileSize: 25,
});

// Step 3: Apply Vision filtering (optional)
const filterResult = await steps.vision_content_filter.run({
	extractionResult: extractionResult,
	enableVisionFiltering: true,
	visionFilteringStrength: "balanced",
});

// Step 4: Upload to Drive
const uploadResult = await steps.drive_uploader.run({
	processedImages: filterResult,
	createRootFolder: true,
	rootFolderName: "Gmail_Images",
});
```

### Option 2: Image Processing Only

Use the image processor orchestrator for processing without Drive upload:

```javascript
const result = await steps.image_processor_orchestrator.run({
	email: steps.trigger.event,
	enableVisionFiltering: true,
	visionFilteringStrength: "balanced",
});
```

### Option 3: Complete Workflow (Recommended)

Use the complete workflow orchestrator for end-to-end automation:

```javascript
const result = await steps.complete_workflow_orchestrator.run({
	email: steps.trigger.event,
	enableVisionFiltering: true,
	visionFilteringStrength: "balanced",
	createRootFolder: true,
	rootFolderName: "Gmail_Images",
	parentFolderId: "optional-parent-folder-id",
});
```

## ⚙️ Configuration

### Required Props

-   `email`: Email data from Gmail trigger
-   `gmail`: Gmail app connection
-   `googleDrive`: Google Drive app connection

### Optional Props

**Image Processing:**

-   `maxFileSize`: Maximum file size in MB (default: 25)
-   `enableVisionFiltering`: Enable smart filtering (default: false)
-   `googleCloudVision`: Vision API connection (required if filtering enabled)
-   `visionFilteringStrength`: "conservative" | "balanced" | "aggressive"
-   `skipTinyImages`: Skip tiny images (likely tracking pixels)

**Drive Upload:**

-   `parentFolderId`: Parent folder ID in Google Drive (optional)
-   `rootFolderName`: Root folder name (default: "Gmail_Images")
-   `createRootFolder`: Create root folder to organize sender folders (default: false)

## 📊 Output Structure

### Complete Result

```javascript
{
  emailId: "string",
  subject: "string",
  senderInfo: {
    email: "string",
    name: "string",
    displayName: "string",
    folderName: "string",
    rawFrom: "string"
  },
  images: [
    {
      type: "attachment" | "drive_link",
      filename: "string",
      mimeType: "string",
      size: number,
      filePath: "string",
      extractedAt: "ISO string",
      // ... additional fields based on type
    }
  ],
  processedAt: "ISO string",
  totalImages: number,
  processingStats: {
    totalDetected: number,
    totalExtracted: number,
    totalFiltered: number,
    finalCount: number,
    processingTimeMs: number
  },
  visionFiltering?: {
    enabled: boolean,
    strength: string,
    skipTinyImages: boolean
  },
  visionStats?: {
    totalDetected: number,
    totalExtracted: number,
    totalFiltered: number,
    logoCount: number,
    iconCount: number,
    trackingPixelCount: number,
    signatureCount: number,
    otherCount: number
  }
}
```

## 🎯 Vision Filtering

### Filtering Strength Levels

**Conservative**: High confidence threshold (0.8)

-   Only filters images with very high confidence
-   Minimal false positives
-   May miss some non-content images

**Balanced** (Recommended): Medium confidence threshold (0.6)

-   Good balance of accuracy and coverage
-   Filters most non-content images
-   Occasional false positives

**Aggressive**: Low confidence threshold (0.4)

-   Filters more aggressively
-   Higher chance of false positives
-   Maximum non-content removal

### Filtered Content Types

-   **Logos & Branding**: Company logos, trademarks, emblems
-   **Icons & Symbols**: UI icons, social media icons, symbols
-   **Tracking Pixels**: Email tracking, analytics pixels
-   **Signatures & Footers**: Email signatures, watermarks
-   **UI Elements**: Buttons, menus, navigation elements

## 🔍 Monitoring & Logging

### Logging Stages

-   🚀 **Start**: Processing initiation
-   🔍 **Detection**: Image detection phase
-   📥 **Extraction**: Image download phase
-   👁️ **Vision**: Vision API filtering
-   ✅ **Complete**: Processing completion
-   ❌ **Error**: Error handling

### Statistics Tracking

-   Processing time monitoring
-   Success/failure rates
-   Vision filtering effectiveness
-   File size distributions

## 🛠️ Development

### Adding New Features

1. Add constants to `common/constants.mjs`
2. Add utilities to `common/utils.mjs`
3. Add types to `common/types.mjs`
4. Create/modify components in `actions/`

### Testing

Each component can be tested independently:

```javascript
// Test individual components
const result = await emailImageDetector.run({...});
console.log("Detection result:", result);
```

## 🔄 Migration from Monolithic

The orchestrator component provides **100% compatibility** with the original monolithic component:

-   Same input structure
-   Same output format
-   Same functionality
-   Same error handling

Simply replace the old component with `image-processor-orchestrator.mjs`.

## 📈 Benefits

### Modularity

-   Independent component testing
-   Selective feature usage
-   Easier maintenance
-   Clear separation of concerns

### Scalability

-   Individual component optimization
-   Parallel processing potential
-   Resource-specific scaling
-   Performance monitoring

### Maintainability

-   Focused code modules
-   Shared utility functions
-   Consistent type definitions
-   Centralized configuration

### Flexibility

-   Mix and match components
-   Custom processing pipelines
-   Feature-specific deployments
-   Easy integration patterns

## 🚀 Getting Started

1. **Deploy Individual Components**: Upload each `.mjs` file to Pipedream
2. **Configure Connections**: Set up Gmail, Google Drive, and Vision API
3. **Choose Usage Pattern**: Individual components or complete orchestrator
4. **Test Processing**: Start with a simple email
5. **Monitor Performance**: Check logs and statistics

## 🔧 TypeScript Support

This component is being migrated to TypeScript using `@pipedream/types` for better type safety and IDE support.

### Development Setup

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Build TypeScript**:

    ```bash
    npm run build
    ```

3. **Watch Mode** (for development):

    ```bash
    npm run dev
    ```

4. **Deploy Compiled Components**:
    ```bash
    pd publish dist/actions/complete-workflow-orchestrator.js
    ```

### TypeScript Benefits

-   **Type Safety**: Catch errors at compile time
-   **Better IDE Support**: Enhanced autocomplete and refactoring
-   **Official Pipedream Types**: Using `@pipedream/types` for proper integration
-   **Future-Proof**: Aligned with Pipedream's TypeScript roadmap

## 📝 Version History

-   **v0.1.0**: Initial modular architecture
    -   Separated monolithic component
    -   Implemented Pipedream common files pattern
    -   Added comprehensive Vision filtering
    -   Created orchestrator for backward compatibility
-   **v0.2.0**: TypeScript migration (in progress)
    -   Added `@pipedream/types` support
    -   Enhanced type safety
    -   Better IDE integration
