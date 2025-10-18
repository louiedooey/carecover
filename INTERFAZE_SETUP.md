# Interfaze API Setup Guide

This guide will help you set up the Interfaze API integration for the CareCover chat functionality.

## Prerequisites

1. An Interfaze API account and API key
2. Node.js and npm installed
3. The CareCover project set up

## Setup Steps

### 1. Get Your Interfaze API Key

1. Visit [Interfaze Dashboard](https://interfaze.ai/dashboard)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate or copy your API key

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace `your_interfaze_api_key_here` with your actual API key:
   ```env
   VITE_INTERFAZE_API_KEY=your_actual_api_key_here
   VITE_INTERFAZE_API_URL=https://api.interfaze.ai/v1
   ```

### 3. Test the API Connection

You can test the API connection using the built-in test button in the application, or by running:

```bash
npm run dev
```

Then navigate to the application and use the "Test Interfaze API" button.

## Features

The Interfaze integration provides:

- **Multiple AI Models**: Access to various AI models through a single API
- **Streaming Responses**: Real-time chat responses for better user experience
- **Document Context**: AI responses are enhanced with uploaded medical and insurance documents
- **Error Handling**: Comprehensive error handling and user feedback
- **Medical Assistant**: Specialized system prompts for healthcare-related queries

## API Configuration

The integration supports the following configuration options:

- **Model**: Choose from available AI models (default: `interfaze-beta`)
- **Temperature**: Control response creativity (default: `0.7`)
- **Max Tokens**: Limit response length (default: `1000`)
- **Streaming**: Enable real-time response streaming (default: `true`)

## Usage

Once configured, the chat functionality will:

1. Send user messages to the Interfaze API
2. Include relevant document context in the system prompt
3. Stream responses back to the user in real-time
4. Handle errors gracefully with user-friendly messages

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Make sure your `.env` file contains the correct API key
2. **Network Errors**: Check your internet connection and API endpoint
3. **Rate Limits**: Interfaze may have rate limits - check your dashboard for usage

### Debug Mode

To enable debug logging, you can check the browser console for detailed error messages.

## Support

For Interfaze API support, visit:
- [Interfaze Documentation](https://interfaze.ai/docs)
- [Interfaze Support](https://interfaze.ai/support)

For CareCover application issues, check the project's main README.
