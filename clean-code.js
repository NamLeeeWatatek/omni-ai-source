const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.turbo'];

// Patterns để giữ lại comment (declaration comments)
const DECLARATION_KEYWORDS = [
    'interface', 'type', 'class', 'function', 'const', 'let', 'var',
    'export', 'import', 'enum', 'namespace', 'module'
];

function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return EXTENSIONS.includes(ext);
}

function isInExcludedDir(filePath) {
    return EXCLUDE_DIRS.some(dir => filePath.includes(path.sep + dir + path.sep));
}

function cleanCode(content) {
    let lines = content.split('\n');
    let result = [];
    let i = 0;

    while (i < lines.length) {
        let line = lines[i];
        let trimmedLine = line.trim();

        // Xóa console.log
        if (trimmedLine.includes('console.log') || trimmedLine.includes('console.error') ||
            trimmedLine.includes('console.warn') || trimmedLine.includes('console.info')) {
            // Bỏ qua dòng này
            i++;
            continue;
        }

        // Kiểm tra comment block /** */
        if (trimmedLine.startsWith('/**')) {
            let commentBlock = [line];
            i++;

            // Đọc toàn bộ comment block
            while (i < lines.length && !lines[i].trim().includes('*/')) {
                commentBlock.push(lines[i]);
                i++;
            }
            if (i < lines.length) {
                commentBlock.push(lines[i]); // Dòng có */
                i++;
            }

            // Kiểm tra dòng tiếp theo có phải là declaration không
            if (i < lines.length) {
                let nextLine = lines[i].trim();
                let isDeclaration = DECLARATION_KEYWORDS.some(keyword =>
                    nextLine.startsWith(keyword) ||
                    nextLine.startsWith('export ' + keyword) ||
                    nextLine.startsWith('async ' + keyword) ||
                    nextLine.startsWith('public ' + keyword) ||
                    nextLine.startsWith('private ' + keyword) ||
                    nextLine.startsWith('protected ' + keyword)
                );

                if (isDeclaration) {
                    // Giữ lại comment block
                    result.push(...commentBlock);
                }
                // Nếu không phải declaration thì bỏ qua comment
            }
            continue;
        }

        // Xóa comment /* */ (không phải JSDoc)
        if (trimmedLine.startsWith('/*') && !trimmedLine.startsWith('/**')) {
            // Bỏ qua cho đến khi gặp */
            while (i < lines.length && !lines[i].includes('*/')) {
                i++;
            }
            i++; // Bỏ qua dòng có */
            continue;
        }

        // Xóa comment //
        if (trimmedLine.startsWith('//')) {
            i++;
            continue;
        }

        // Xóa inline comment //
        let commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
            // Kiểm tra xem // có nằm trong string không
            let beforeComment = line.substring(0, commentIndex);
            let singleQuotes = (beforeComment.match(/'/g) || []).length;
            let doubleQuotes = (beforeComment.match(/"/g) || []).length;
            let backticks = (beforeComment.match(/`/g) || []).length;

            // Nếu số lượng quotes là chẵn thì // không nằm trong string
            if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
                line = beforeComment.trimEnd();
            }
        }

        // Xóa inline comment /* */
        let blockCommentStart = line.indexOf('/*');
        if (blockCommentStart !== -1 && !line.substring(blockCommentStart).startsWith('/**')) {
            let blockCommentEnd = line.indexOf('*/', blockCommentStart);
            if (blockCommentEnd !== -1) {
                line = line.substring(0, blockCommentStart) + line.substring(blockCommentEnd + 2);
            }
        }

        result.push(line);
        i++;
    }

    // Xóa các dòng trống liên tiếp (giữ tối đa 1 dòng trống)
    let finalResult = [];
    let emptyLineCount = 0;

    for (let line of result) {
        if (line.trim() === '') {
            emptyLineCount++;
            if (emptyLineCount <= 1) {
                finalResult.push(line);
            }
        } else {
            emptyLineCount = 0;
            finalResult.push(line);
        }
    }

    return finalResult.join('\n');
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = cleanCode(content);

        if (content !== cleaned) {
            fs.writeFileSync(filePath, cleaned, 'utf8');
            console.log(`✓ Cleaned: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function walkDirectory(dir) {
    let filesProcessed = 0;

    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                if (!EXCLUDE_DIRS.includes(entry.name)) {
                    walk(fullPath);
                }
            } else if (entry.isFile() && shouldProcessFile(fullPath)) {
                if (!isInExcludedDir(fullPath)) {
                    if (processFile(fullPath)) {
                        filesProcessed++;
                    }
                }
            }
        }
    }

    walk(dir);
    return filesProcessed;
}

// Main execution
console.log('🧹 Starting code cleanup...\n');

const webDir = path.join(__dirname, 'apps', 'web');
const backendDir = path.join(__dirname, 'apps', 'backend');

console.log('📁 Processing frontend (apps/web)...');
const webFiles = walkDirectory(webDir);

console.log('\n📁 Processing backend (apps/backend)...');
const backendFiles = walkDirectory(backendDir);

console.log(`\n✨ Done! Cleaned ${webFiles + backendFiles} files.`);
console.log('   - Removed all console.log statements');
console.log('   - Removed inline comments (//)');
console.log('   - Removed block comments (/* */)');
console.log('   - Kept JSDoc comments (/** */) for declarations only');
