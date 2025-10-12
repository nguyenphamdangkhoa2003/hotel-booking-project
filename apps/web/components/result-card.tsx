import { motion } from 'framer-motion';
import { BadgeCheck, XCircle, Loader2 } from 'lucide-react';

interface ResultCardProps {
    status: 'success' | 'error';
    title: string;
    message: string;
}

export default function ResultCard({
    status,
    title,
    message,
}: ResultCardProps) {
    const isSuccess = status === 'success';
    const Icon = isSuccess ? BadgeCheck : XCircle;
    const color = isSuccess ? 'text-green-500' : 'text-red-500';
    const bg = isSuccess ? 'bg-green-50' : 'bg-red-50';
    const border = isSuccess ? 'border-green-200' : 'border-red-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`w-full max-w-md text-center rounded-2xl p-8 shadow-sm border ${bg} ${border}`}>
            <div className="flex justify-center mb-4">
                <div
                    className={`rounded-full p-3 bg-white shadow-sm border ${border}`}>
                    <Icon className={`${color} h-10 w-10`} strokeWidth={1.5} />
                </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-800">
                {title}
            </h1>
            <p className="text-gray-600 leading-relaxed">{message}</p>
        </motion.div>
    );
}
