const fs = require('fs');
const file = 'components/admin/AdminGamification.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = "                <button onClick={() => setActiveTab('levels')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'levels' ? 'bg-yellow-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>Levely</button>\n";
content = content.replace(target1, '');

const startTab = "        {/* --- LEVELS TAB --- */}";
const endTab = "        {/* --- EDIT MODALS --- */}";

const startIdx = content.indexOf(startTab);
const endIdx = content.indexOf(endTab);
if (startIdx > -1 && endIdx > -1) {
    const toReplace = content.substring(startIdx, endIdx);
    content = content.replace(toReplace, "");
    console.log("Removed levels tab block");
}

fs.writeFileSync(file, content, 'utf8');
