const { execSync } = require('child_process');
const path = require('path');

try {
  // Ejecutar el comando de generación de tipos
  execSync('supabase gen types typescript --local > src/types/supabase.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  console.log('✅ Types generated successfully');
} catch (error) {
  console.error('❌ Error generating types:', error);
  process.exit(1);
}
