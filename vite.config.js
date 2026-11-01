import { defineConfig } from 'vite';
// GitHub project Pages uses /business/; Vercel/Netlify use /.
export default defineConfig({base:process.env.PUNCH_BASE_PATH||'/'});
