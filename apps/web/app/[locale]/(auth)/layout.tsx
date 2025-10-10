import React from 'react';

function layout({ children }: { children: React.ReactNode }) {
    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            {children}
        </section>
    );
}

export default layout;
