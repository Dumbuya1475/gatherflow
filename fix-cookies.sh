#!/bin/bash

# Fix all cookies() calls to await cookies()
# Recursively search through app directory

find app -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
    # Replace "= cookies()" with "= await cookies()"
    sed -i 's/\(const [a-zA-Z_][a-zA-Z0-9_]* =\) cookies();/\1 await cookies();/g' "$file"
    echo "Fixed: $file"
done

echo "✅ All cookies() calls have been updated to await cookies()"
