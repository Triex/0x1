
      const fs = require('fs');
      const { transpile } = require('bun');
      
      async function processFile() {
        try {
          // Read the file content
          const source = fs.readFileSync('/mnt/ssd/00-DEV/0x1/templates/minimal/.temp-index.tsx'.trim(), 'utf8');
          
          // Transpile the content
          const result = transpile({
            source,
            loader: 'tsx',
            jsxFactory: 'createElement',
            jsxFragment: 'Fragment', 
            target: 'browser',
            minify: true
          });
          
          if (!result.success) {
            console.error('Transpilation failed:', result.error || 'Unknown error');
            process.exit(1);
          }
          
          // Save the result
          fs.writeFileSync('/mnt/ssd/00-DEV/0x1/templates/minimal/dist/index.js'.trim(), result.code);
          console.log('Successfully transpiled');
        } catch (error) {
          console.error('Error:', error);
          process.exit(1);
        }
      }
      
      processFile().catch(err => {
        console.error('Unhandled promise error:', err);
        process.exit(1);
      });
    