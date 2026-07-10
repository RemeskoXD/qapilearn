const fs = require('fs');
const file = 'components/admin/AdminCaflou.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/title="Smazat záznam o výplatě"/g, 'title="Smazat lokální záznam o výplatě"');
content = content.replace(/title="Smazat zakázku"/g, 'title="Smazat lokální záznam zakázky"');

fs.writeFileSync(file, content, 'utf8');
console.log('Updated labels');
