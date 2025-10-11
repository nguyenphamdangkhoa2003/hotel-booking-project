'use client';

import { useRef } from 'react';
import Image, { StaticImageData } from 'next/image';
import { motion, useInView } from 'motion/react';
import { useTranslations } from 'next-intl';
import avtMem1Src from '../public/mem1.jpg';
import avtMem2Src from '../public/mem2.jpg';

const avatarMap: Record<number, StaticImageData> = {
    0: avtMem1Src,
    1: avtMem2Src,
};

interface TeamGridProps {
    title?: string;
    description?: string;
}

export function TeamGridSection(props: TeamGridProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const t = useTranslations('team-section');
    const members = t.raw('members') as {
        name: string;
        role: string;
        location: string;
        bio: string;
        avatar: string;
    }[];

    return (
        <section>
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-2xl lg:mx-0">
                    <h2 className="text-foreground text-4xl font-semibold tracking-tight text-pretty sm:text-5xl">
                        {t('title')}
                    </h2>
                    <p className="text-foreground/70 mt-6 text-lg/8">
                        {t('description')}
                    </p>
                </motion.div>

                <motion.ul
                    ref={ref}
                    className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-14 
                   sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-1 xl:grid-cols-2">
                    {members.map((member, index) => {
                        const avatar = avatarMap[index]; // lấy avatar theo id
                        return (
                            <motion.li
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={
                                    isInView
                                        ? { opacity: 1, y: 0 }
                                        : { opacity: 0, y: 30 }
                                }
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                }}>
                                <motion.div
                                    className="group"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    }}>
                                    {/* Avatar */}
                                    <motion.div
                                        className="relative overflow-hidden rounded-2xl"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                        }}>
                                        <Image
                                            alt={member.name}
                                            src={avatar}
                                            width={400}
                                            height={400}
                                            className="aspect-14/13 w-full rounded-2xl object-cover
                               outline-1 -outline-offset-1 outline-black/5
                               transition-all duration-300 group-hover:outline-black/10
                               dark:outline-white/10 dark:group-hover:outline-white/20"
                                        />
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br
                               from-black/5 to-transparent opacity-0
                               group-hover:opacity-100"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </motion.div>
                                    {/* Name */}
                                    <h3 className="text-foreground mt-6 text-lg/8 font-semibold tracking-tight">
                                        {member.name}
                                    </h3>
                                    {/* Role */}
                                    <p className="text-foreground/70 text-base/7">
                                        {member.role}
                                    </p>
                                    {/* Location */}
                                    {member.location && (
                                        <p className="text-foreground/70 text-sm/6">
                                            {member.location}
                                        </p>
                                    )}
                                    {/* Bio */}
                                    {member.bio && (
                                        <p className="text-foreground/70 mt-2 text-sm">
                                            {member.bio}
                                        </p>
                                    )}
                                </motion.div>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            </div>
        </section>
    );
}
