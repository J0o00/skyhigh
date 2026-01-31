require('dotenv').config();

console.log('--- Environment Variable Verification ---');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ FOUND (' + process.env.GEMINI_API_KEY.substring(0, 8) + '...)' : '❌ MISSING');
console.log('HUGGINGFACE_TOKEN:', process.env.HUGGINGFACE_TOKEN ? '✅ FOUND (' + process.env.HUGGINGFACE_TOKEN.substring(0, 5) + '...)' : '❌ MISSING');

if (process.env.GEMINI_API_KEY && process.env.HUGGINGFACE_TOKEN) {
    console.log('\n✨ Configuration valid! Ready to start server.');
} else {
    console.log('\n⚠️ Configuration missing keys.');
}
