const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./resources/js', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // next/navigation
        content = content.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/navigation['"];?/g, 'import { router } from "@inertiajs/react";');
        content = content.replace(/const\s+router\s*=\s*useRouter\(\);?/g, '');
        content = content.replace(/router\.push\(/g, 'router.visit(');

        // next/link
        content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"];?/g, 'import { Link } from "@inertiajs/react";');

        // next/font/google
        content = content.replace(/import\s+\{.*\}\s+from\s+['"]next\/font\/google['"];?/g, '');
        content = content.replace(/const\s+cormorant\s*=\s*Cormorant\([^)]*\);?/g, '');
        content = content.replace(/const\s+inter\s*=\s*Inter\([^)]*\);?/g, '');
        content = content.replace(/\$\{inter\.className\}/g, 'font-sans');
        content = content.replace(/\$\{cormorant\.className\}/g, 'font-serif');

        // "use client"
        content = content.replace(/"use client";?\n?/g, '');
        content = content.replace(/'use client';?\n?/g, '');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
