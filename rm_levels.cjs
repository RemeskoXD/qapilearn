const fs = require('fs');
const file = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = "    { id: 'levels', icon: <Star size={18} />, label: 'Levely' },\n";
content = content.replace(target1, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed levels from AdminDashboard');
