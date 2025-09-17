# PDF Tools Suite - React Application

A comprehensive, privacy-focused PDF tools suite built with React that processes files entirely in the browser. No server uploads, no data collection, complete privacy.

## Features

### PDF Tools
- **PDF to Word**: Convert PDFs to editable Word documents
- **Merge PDF**: Combine multiple PDF files into one
- **Split PDF**: Extract pages or split into individual files
- **Compress PDF**: Reduce file sizes while maintaining quality
- **PDF to Images**: Convert pages to PNG or JPEG images
- **Word to PDF**: Convert Word documents to PDF format

### Key Benefits
- 🔒 **100% Private**: All processing happens in your browser
- 💰 **Completely Free**: No hidden costs or subscriptions
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark/Light Theme**: Customizable interface
- ⚡ **Works Offline**: No internet required after initial load
- 🎨 **Modern UI**: Clean, intuitive design with smooth animations

## Project Structure

```
pdf-tools-suite/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Header/
│   │   │   └── Header.js
│   │   ├── Hero/
│   │   │   └── Hero.js
│   │   ├── Tools/
│   │   │   ├── ToolsSection.js
│   │   │   └── ToolCard.js
│   │   ├── Modal/
│   │   │   ├── Modal.js
│   │   │   ├── ToolInterface.js
│   │   │   ├── FileUpload.js
│   │   │   ├── ProgressBar.js
│   │   │   ├── Results.js
│   │   │   └── ToolOptions.js
│   │   ├── FAQ/
│   │   │   └── FAQ.js
│   │   └── Footer/
│   │       └── Footer.js
│   ├── context/
│   │   └── ThemeContext.js
│   ├── utils/
│   │   ├── fileProcessors.js
│   │   └── toolConfigurations.js
│   ├── styles/
│   │   └── main.css
│   ├── App.js
│   ├── index.js
│   └── reportWebVitals.js
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Step 1: Create React App
```bash
npx create-react-app pdf-tools-suite
cd pdf-tools-suite
```

### Step 2: Install Dependencies
```bash
npm install pdf-lib pdfjs-dist mammoth jszip react-router-dom
```

### Step 3: Replace Generated Files
Replace the default Create React App files with the components provided in this project:

1. Replace `src/App.js` with the App component
2. Replace `src/index.js` with the index file
3. Create the component structure as shown above
4. Add the CSS file to `src/styles/main.css`
5. Update `package.json` with the provided dependencies

### Step 4: Public Folder Setup
Update `public/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#6366f1" />
    <meta name="description" content="Free online PDF tools - Convert, merge, split, and compress PDF files in your browser" />
    <title>PDF Tools Suite - Free Online PDF Converter</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

## Development

### Start Development Server
```bash
npm start
```
The app will run on `http://localhost:3000`

### Build for Production
```bash
npm run build
```
Creates optimized production build in the `build` folder.

### Testing
```bash
npm test
```

## Theme Customization

The application uses CSS custom properties for easy theme customization. To change the color scheme, modify the variables in `src/styles/main.css`:

```css
:root {
  /* Change these colors to customize the theme */
  --primary: #6366f1;        /* Main brand color */
  --primary-dark: #4f46e5;   /* Darker shade */
  --accent: #10b981;         /* Success/accent color */
  --danger: #ef4444;         /* Error/danger color */
  --warning: #f59e0b;        /* Warning color */
  
  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
}
```

For dark theme, the application automatically switches variables when `[data-theme="dark"]` is applied.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Modern browser features required:
- ES6+ JavaScript
- CSS Grid and Flexbox
- FileReader API
- Blob and URL APIs

## Performance Optimization

### File Processing
- Files are processed in chunks to prevent browser blocking
- Progress indicators provide user feedback
- Memory management for large files
- Automatic cleanup of blob URLs

### UI Performance
- CSS animations use GPU acceleration
- Lazy loading of components
- Debounced file processing
- Efficient re-rendering with React hooks

## Security & Privacy

### Client-Side Processing
- All file processing happens in the browser
- No files are uploaded to any server
- No tracking or analytics
- Local storage only for theme preference

### Content Security
- Input validation for file types
- File size recommendations
- Error handling for corrupted files
- Memory cleanup after processing

## Deployment Options

### Static Hosting (Recommended)
Deploy to any static hosting service:

- **Netlify**: Drag and drop the build folder
- **Vercel**: Connect GitHub repo for automatic deployments
- **GitHub Pages**: Push build folder to gh-pages branch
- **Firebase Hosting**: Use Firebase CLI to deploy

### Example Netlify Deployment
```bash
npm run build
# Upload the 'build' folder to Netlify
```

### Example Vercel Deployment
```bash
npm install -g vercel
vercel --prod
```

## Contributing

### Development Guidelines
1. Follow React functional component patterns
2. Use CSS custom properties for theming
3. Maintain accessibility standards
4. Test on multiple browsers
5. Keep file processing client-side only

### Adding New Tools
To add a new PDF tool:

1. Add configuration to `toolConfigurations.js`
2. Create processor function in `fileProcessors.js`
3. Add tool card to `ToolsSection.js`
4. Update tool options in `ToolOptions.js` if needed

## Technical Details

### Libraries Used
- **React 18**: Modern React with hooks
- **PDF-lib**: PDF creation and manipulation
- **PDF.js**: PDF parsing and rendering
- **Mammoth**: Word document processing
- **JSZip**: ZIP file creation for bulk downloads

### Architecture
- **Component-based**: Modular React components
- **Context API**: Theme management
- **Custom hooks**: File processing and state management
- **CSS-in-CSS**: Maintainable styling with custom properties

## Troubleshooting

### Common Issues

**Large file processing is slow**
- This is expected behavior as processing happens client-side
- Recommend files under 50MB for optimal performance
- Browser memory limits may affect very large files

**PDF conversion quality issues**
- Complex layouts may not convert perfectly
- Embedded fonts might not be preserved
- Images may be rasterized during conversion

**Browser compatibility**
- Ensure you're using a modern browser
- Check console for JavaScript errors
- Disable browser extensions that might interfere

### Performance Tips
- Close other browser tabs when processing large files
- Use desktop browsers for better performance
- Clear browser cache if experiencing issues

## License

This project is open source and available under the MIT License.

## Support

For issues, feature requests, or questions:
- Check the FAQ section in the application
- Review this README for setup instructions
- Test with different browsers if issues persist

---

**Note**: This application prioritizes user privacy by processing all files locally in the browser. No data is ever transmitted to external servers, ensuring complete confidentiality of your documents.