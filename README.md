# Aave Health Factor Extension

A browser extension to monitor Aave health factors for multiple addresses. Compatible with both Chrome and Firefox.

## Requirements

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git

## Build Instructions

1. Clone the repository
   ```bash
   git clone [your-repository-url]
   cd aave-health-factor
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the extension
   ```bash
   npm run build
   ```

This will create a `build` directory with the extension files.

## Development Setup

### Chrome Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `build` directory

### Firefox Development
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" on the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `build` directory and select `manifest.json`

## Project Structure

```
aave-health-factor/
├── src/
│ ├── App.tsx # Main popup component
│ ├── background.ts # Background service worker
│ ├── utils/
│ │ └── browserAPI.ts # Browser compatibility layer
│ └── pages/
│ └── Options.tsx # Options page component
├── public/
│ ├── manifest.json # Extension manifest
│ ├── options.html # Options page HTML
│ └── icons/ # Extension icons
└── package.json
```


## Build Environment Details

### Operating System
- The extension can be built on any operating system that supports Node.js (Windows, macOS, Linux)

### Build Environment
- Node.js environment
- npm package manager
- Create React App build system
- TypeScript compiler
- Webpack (included in Create React App)

### Dependencies
All dependencies are managed through npm and listed in package.json. Key dependencies include:
- React 18.x
- TypeScript 4.x
- ethers.js 5.x
- @types/chrome for Chrome extension type definitions

## Production Build Process

The production build process:
1. Compiles TypeScript files
2. Bundles modules with Webpack
3. Minifies JavaScript and CSS
4. Copies static assets
5. Generates source maps
6. Creates a production-ready build in the `build` directory

## Firefox Add-on Specific Notes

For Firefox distribution:
1. Ensure you have a valid extension ID in manifest.json
2. The build process creates a Firefox-compatible extension
3. Test the extension in Firefox before submission
4. Submit to Firefox Add-ons (AMO) using the built files

## Available Scripts

### `npm start`
Runs the app in development mode with hot reload support.
Note: This is mainly for component development and testing.

### `npm run build`
Builds the extension for production:
- Bundles and minifies the code
- Optimizes assets
- Creates the `build` directory with the final extension

### `npm test`
Runs the test suite.

### `npm run lint`
Runs ESLint to check code quality.

## Troubleshooting

If you encounter build issues:
1. Ensure all dependencies are installed: `npm install`
2. Clear the build directory: `rm -rf build`
3. Ensure you're using the correct Node.js version
4. Check console for error messages

## License

[Your License Information]
