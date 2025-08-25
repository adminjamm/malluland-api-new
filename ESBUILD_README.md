# ESBuild Configuration for Malluland API

This project now uses ESBuild for fast, efficient building and bundling of the TypeScript code.

## Build Commands

### Main Build (Recommended)

```bash
npm run build
```

Uses the `esbuild.config.js` configuration file for full control over the build process.

### Simple Build

```bash
npm run build:simple
```

Uses inline esbuild command with basic configuration.

### Watch Mode

```bash
npm run build:watch
```

Watches for file changes and rebuilds automatically.

## Configuration Details

### ESBuild Config File (`esbuild.config.js`)

- **Entry Point**: `src/index.ts`
- **Output**: `dist/index.js`
- **Bundle**: Yes (all dependencies included)
- **Platform**: Node.js
- **Target**: Node 18
- **Format**: ESM (ES Modules)
- **Minify**: Yes
- **Source Maps**: Disabled (as requested)
- **Packages**: External (prevents bundling of node_modules)
- **External Dependencies**:
  - `pg-native` (PostgreSQL native bindings)
  - `aws-sdk` (AWS SDK)
  - `firebase-admin` (Firebase Admin SDK)

### Build Output

- Single bundled file: `dist/index.js`
- No source maps
- Minified for production
- All TypeScript compiled to JavaScript
- Dependencies bundled (except external ones)
- Node.js modules properly handled

## Benefits of ESBuild

1. **Speed**: Much faster than TypeScript compiler
2. **Bundling**: Creates a single output file
3. **Tree Shaking**: Removes unused code
4. **Minification**: Reduces file size
5. **No Source Maps**: Cleaner production builds
6. **Proper Node.js Support**: Handles built-in modules correctly

## Migration from TypeScript Compiler

The build process has been updated from:

- **Before**: `tsc -p tsconfig.json --noCheck`
- **After**: ESBuild with bundling and minification

## Running the Built Application

After building:

```bash
npm start
```

This will run the bundled `dist/index.js` file.

## Development vs Production

- **Development**: Use `npm run dev` (tsx with watch mode)
- **Production**: Use `npm run build` then `npm start`

## Troubleshooting

### Port Already in Use

If you get `EADDRINUSE` error, it means another instance is running:

```bash
# Find the process using port 8787
lsof -ti:8787

# Kill the process
kill <PID>

# Or kill all node processes
pkill -f "node dist/index.js"
```

### Build Issues

If you encounter build errors:

1. Ensure all dependencies are installed: `npm install`
2. Check that the entry point `src/index.ts` exists
3. Verify TypeScript configuration in `tsconfig.json`
