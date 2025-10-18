# CareCover - Healthcare Conversational Assistant UI

A modern, responsive React application for a healthcare conversational assistant that helps users understand their healthcare options, coverage, and next steps.

## Features

- **Chat Interface**: Clean, modern chat UI with message bubbles and file upload capabilities
- **Session Management**: Multiple chat sessions with history and context persistence
- **Profile Management**: 
  - Insurance Policies with document upload
  - Medical Records with file management
  - Demographic Information with editable forms
- **Responsive Design**: Mobile-first design with collapsible sidebar
- **Modern UI/UX**: Clean design with generous spacing, smooth transitions, and hover states

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Proxima Nova** font family

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── modals/
│   │   ├── InsuranceModal.tsx
│   │   ├── MedicalRecordsModal.tsx
│   │   └── DemographicModal.tsx
│   ├── ChatArea.tsx
│   ├── ChatInput.tsx
│   ├── Message.tsx
│   └── Sidebar.tsx
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Key Components

### App.tsx
Main application component that manages state and coordinates between sidebar and chat area.

### Sidebar.tsx
- User profile display
- Navigation menu for profile sections
- Session history and management
- New session creation

### ChatArea.tsx
- Chat interface container
- Message display
- Input handling
- Modal management

### Message.tsx
Individual message component with support for bot and user messages.

### ChatInput.tsx
Text input with file upload capabilities and auto-resize functionality.

### Modals
- **InsuranceModal**: Manage insurance policies and upload documents
- **MedicalRecordsModal**: Manage medical records and upload files
- **DemographicModal**: View and edit personal information

## Design System

### Colors
- Primary Blue: `#3B82F6`
- Light Blue: `#60A5FA`
- Teal: `#14B8A6`
- Light Teal: `#5EEAD4`

### Typography
- Font Family: Proxima Nova (with Inter fallback)
- Clean, modern sans-serif design

### Spacing
- Generous padding and margins for clean layout
- Consistent spacing scale using Tailwind utilities

## Responsive Design

- Mobile-first approach
- Collapsible sidebar on mobile devices
- Touch-friendly interface elements
- Optimized for various screen sizes

## Future Enhancements

- Integration with LLM APIs for actual conversational AI
- Real-time message updates
- Advanced file management
- User authentication
- Data persistence
- Accessibility improvements

## License

This project is for demonstration purposes.
