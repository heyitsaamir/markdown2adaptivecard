# Markdown to Adaptive Cards

Convert Markdown to Adaptive Cards JSON format with a live preview interface.

## Features

- **Full Markdown Support**: Headings, paragraphs, lists, code blocks, tables, blockquotes, bold, italic, and horizontal rules
- **Live Preview**: Two-column interface with real-time conversion
- **Syntax Highlighting**: Beautiful JSON output with color-coded syntax
- **Persistent Storage**: Your markdown is automatically saved in localStorage

## Project Structure

```
mk2ac/
├── packages/
│   ├── markdown2ac/     # Core library for converting Markdown to Adaptive Cards
│   └── fe/              # React frontend application
```

## Getting Started

### Prerequisites

- Node.js (>= 20)
- npm

### Installation

```bash
npm install
```

### Development

Run both the library watcher and frontend dev server:

```bash
npm run dev
```

This will:
- Watch and rebuild the `markdown2ac` library on changes
- Start the Vite dev server for the frontend at http://localhost:5173

### Building

Build the library:

```bash
npm run build -w markdown2ac
```

Build the frontend:

```bash
npm run build -w markdown2ac-fe
```

## Supported Markdown Features

- **Headings** (h1-h6) - Mapped to different text sizes
- **Paragraphs** - Standard text blocks
- **Lists** (ordered and unordered)
- **Code Blocks** - With language syntax support
- **Tables** - With headers and data rows
- **Blockquotes** - With nested element support
- **Inline Formatting** - Bold and italic text
- **Horizontal Rules** - Rendered as separators

## License

ISC
