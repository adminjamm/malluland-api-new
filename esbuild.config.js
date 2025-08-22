import * as esbuild from 'esbuild';

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/index.js',
  format: 'esm',
  minify: true,
  sourcemap: false,
  packages: 'external',
//   external: [
//     // External packages that shouldn't be bundled
//     'pg-native',
//     'aws-sdk',
//     'firebase-admin'
//   ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  loader: {
    '.ts': 'ts'
  },
  tsconfig: 'tsconfig.json'
};

// Build function
async function build() {
  try {
    await esbuild.build(buildOptions);
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Watch mode for development
async function watch() {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log('👀 Watching for changes...');
}

// CLI handling
const command = process.argv[2];
if (command === 'watch') {
  watch();
} else {
  build();
} 