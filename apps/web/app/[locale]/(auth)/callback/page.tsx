'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { tokenStore } from '@/lib/auth-tokens'; // bạn đã có sẵn
import { useAuth } from '@/app/(providers)/auth-provider';
import { toast } from 'sonner';
import Loader from '@/components/kokonutui/loader';

function parseHash(hash: string) {
    const qs = new URLSearchParams(
        hash?.startsWith('#') ? hash.slice(1) : hash || ''
    );
    return {
        access: qs.get('access'),
        refresh: qs.get('refresh'),
        next: qs.get('next'), // nếu BE có truyền đích đến
        state: qs.get('state'), // nếu bạn có state chống CSRF
    };
}

export default function CallbackPage() {
    const router = useRouter();
    const { refetchMe } = useAuth();

    const [status, setStatus] = useState(false);

    useEffect(() => {
        try {
            const { access, refresh } = parseHash(window.location.hash);

            if (!access || !refresh) {
                toast.error('Thiếu token trong callback. Vui lòng thử lại.');
                setStatus(true);
                return;
            }

            // 1) Lưu token (tạm thời) theo cơ chế hiện tại
            tokenStore.setAccess(access);
            tokenStore.setRefresh(refresh);

            // 2) Xoá hash khỏi URL để không lộ token khi share/log
            history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search
            );

            // 3) (Tuỳ chọn) gọi API lấy user hiện tại để hydrate FE ngay
            //    Bạn có thể bỏ nếu không cần
            refetchMe();

            router.replace('/');
        } catch (e) {
            toast.error('Đã có lỗi khi xử lý callback.');
            setStatus(true);
        }
    }, [router]);

    return (
        <section className="mx-auto max-w-5xl min-h-screen px-6 flex items-center">
            {!status && <Loader />}
        </section>
    );
}
