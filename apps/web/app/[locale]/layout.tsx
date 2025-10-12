import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import { HeroHeader } from '@/components/hero-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Providers from '@/app/[locale]/providers';
import { Toaster } from 'sonner';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import AuthProvider from '@/app/(providers)/auth-provider';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'], // hỗ trợ EN + VI
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'], // hỗ trợ EN + VI
});

export const metadata: Metadata = {
    title: 'Stayra | Hotel Booking',
    description:
        'Stayra helps you search, compare and book hotels quickly and securely.',
};

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    // Load messages cho locale
    const messages = (await import(`../../messages/${locale}.json`)).default;

    return (
        <html lang={locale}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <section className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex flex-col flex-1">
                            <Providers>
                                <AuthProvider>
                                    <HeroHeader />
                                    <div className="p-6 space-y-4">
                                        <Breadcrumb />
                                        {children}
                                        <Toaster />
                                    </div>
                                </AuthProvider>
                            </Providers>
                        </div>
                    </section>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
