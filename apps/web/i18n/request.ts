import { getRequestConfig } from 'next-intl/server';
// (Tuỳ bạn để constant cố định hoặc import từ routing)
const DEFAULT_LOCALE = 'vi';

export default getRequestConfig(async ({ locale }) => {
    const l = locale ?? DEFAULT_LOCALE;

    return {
        locale: l,
        messages: (await import(`../messages/${l}.json`)).default,
    };
});
