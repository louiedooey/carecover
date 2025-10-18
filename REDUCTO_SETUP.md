# Reducto API Setup Guide

## Getting Started

Your CareCover application is now configured to use the real Reducto API! Here's how to set it up:

### 1. Get Your API Key

1. Go to [Reducto Studio](https://studio.reducto.ai/)
2. Sign up or log in to your account
3. Navigate to the "API Keys" section
4. Create a new API key

### 2. Configure Your Environment

Create a `.env` file in your project root with:

```bash
# Reducto API Configuration
VITE_REDUCTO_API_KEY=your_actual_api_key_here
```

### 3. Test the Integration

1. Start your development server: `npm run dev`
2. Open the application in your browser
3. Try uploading a document (PDF, DOC, etc.)
4. The app will now use the real Reducto API instead of mock data

### 4. How It Works

- **With API Key**: Uses real Reducto API for document processing
- **Without API Key**: Falls back to mock mode for development
- **Async Processing**: Handles Reducto's job-based async processing automatically
- **Error Handling**: Comprehensive error handling and retry logic

### 5. Supported File Types

- PDF documents
- Microsoft Word (DOC, DOCX)
- Text files (TXT)
- Images (JPG, JPEG, PNG)

### 6. Troubleshooting

If you see the warning "Reducto SDK not available", it means:
- The API key is not set in your environment
- The app will use mock mode instead

This is normal behavior and allows development without requiring an API key.

## API Features

The integration includes:
- ✅ File upload to Reducto
- ✅ Async job processing with polling
- ✅ Text extraction from completed jobs
- ✅ Error handling and retry logic
- ✅ Fallback to mock mode when needed
