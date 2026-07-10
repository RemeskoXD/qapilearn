const fs = require('fs');
const file = 'components/admin/AdminGamification.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative overflow-hidden"`;
const replacement = `className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative"`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed modal');
} else {
    console.log('Could not find modal target');
}
