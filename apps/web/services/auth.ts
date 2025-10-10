import api from '@/lib/axios';
import { tokenStore } from '@/lib/auth-tokens';

export async function logout() {
    try {
        await api.post('/auth/logout'); // BE nên clear refresh cookie
    } finally {
        tokenStore.clear();
    }
}
