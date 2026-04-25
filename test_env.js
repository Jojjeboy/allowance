import { loadEnv } from 'vite'
const env = loadEnv('development', process.cwd(), '')
const PARENT_UIDS = (env.VITE_PARENT_UID || '').split(',').map(uid => uid.trim())
console.log("VITE_PARENT_UID is:", env.VITE_PARENT_UID)
console.log("PARENT_UIDS array:", PARENT_UIDS)
