#!/usr/bin/env node

/**
 * Script to automatically update frontend types from number to UUID (string)
 * Run: node scripts/update-types-to-uuid.js
 */

const fs = require('fs');
const path = require('path');

const TYPES_DIR = path.join(__dirname, '../apps/web/lib/types');

const updates = [
    {
        file: 'flow.ts',
        replacements: [
            { from: /templateId\?: number/g, to: 'templateId?: string' },
            { from: /channelId\?: number/g, to: 'channelId?: string' },
        ]
    },
    {
        file: 'channel.ts',
        replacements: [
            { from: /credentialId\?: number/g, to: 'credentialId?: string' },
            { from: /workspaceId\?: number/g, to: 'workspaceId?: string' },
        ]
    },
    {
        file: 'inbox.ts',
        replacements: [
            { from: /id: number/g, to: 'id: string' },
            { from: /conversationId: number/g, to: 'conversationId: string' },
            { from: /botId: number/g, to: 'botId: string' },
            { from: /channelId\?: number/g, to: 'channelId?: string' },
        ]
    },
];

function updateFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
            content = content.replace(from, to);
            changed = true;
            console.log(`  ✅ Replaced: ${from} → ${to}`);
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${path.basename(filePath)}\n`);
        return true;
    } else {
        console.log(`⏭️  No changes needed: ${path.basename(filePath)}\n`);
        return false;
    }
}

console.log('🚀 Starting UUID migration for frontend types...\n');

let totalUpdated = 0;

updates.forEach(({ file, replacements }) => {
    const filePath = path.join(TYPES_DIR, file);
    console.log(`📝 Processing: ${file}`);

    if (updateFile(filePath, replacements)) {
        totalUpdated++;
    }
});

console.log(`\n✨ Migration complete! Updated ${totalUpdated} file(s).`);
console.log('\n📋 Next steps:');
console.log('  1. Review changes: git diff apps/web/lib/types/');
console.log('  2. Run type check: cd apps/web && npm run build');
console.log('  3. Test your application');
