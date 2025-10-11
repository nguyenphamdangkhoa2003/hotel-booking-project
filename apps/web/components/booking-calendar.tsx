'use client';

import * as React from 'react';
import {
    Calendar,
    CalendarReserved,
    CalendarSelected,
} from '@demark-pro/react-booking-calendar';
import '@demark-pro/react-booking-calendar/dist/react-booking-calendar.css';

import { useLocale } from 'next-intl';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type OverbookType = 'selected' | 'reserved' | string;

export type BookingCalendarProps = {
    className?: string;

    // Data
    reserved?: CalendarReserved[];
    defaultSelected?: CalendarSelected[]; // uncontrolled
    selected?: CalendarSelected[]; // controlled
    onChange?: (value: CalendarSelected[]) => void;

    // Behavior
    range?: boolean;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    locale?: string; // override next-intl locale
    options?: Partial<Parameters<typeof Calendar>[0]['options']>;

    // Events
    onOverbook?: (date: Date, type: OverbookType) => void;

    // Extra constraints (tuỳ bạn dùng trong tương lai)
    minNights?: number;
    maxNights?: number;
};

export default function BookingCalendar({
    className,
    reserved,
    defaultSelected = [],
    selected, // nếu truyền -> controlled
    onChange,
    range = true,
    weekStartsOn = 0,
    locale: localeProp,
    options,
    onOverbook,
}: BookingCalendarProps) {
    const intlLocale = useLocale();
    const effectiveLocale = localeProp ?? intlLocale;

    // Uncontrolled state fallback
    const [internalSelected, setInternalSelected] =
        React.useState<CalendarSelected[]>(defaultSelected);

    const isControlled = selected !== undefined;
    const value = isControlled
        ? (selected as CalendarSelected[])
        : internalSelected;

    // Alert state (shadcn)
    const [alertMsg, setAlertMsg] = React.useState<{
        title: string;
        description?: string;
    } | null>(null);

    const handleChange = (v: CalendarSelected[]) => {
        if (!isControlled) setInternalSelected(v);
        onChange?.(v);
    };

    const handleOverbook = (date: Date, type: OverbookType) => {
        // Mặc định hiển thị bằng Alert; vẫn bắn event ra ngoài nếu cần
        onOverbook?.(date, type);

        const typeLabel =
            type === 'reserved'
                ? 'ngày đã có người đặt'
                : type === 'selected'
                  ? 'ngày đã chọn'
                  : String(type);

        setAlertMsg({
            title: 'Không thể đặt ngày này',
            description: `Bạn vừa chọn trùng với ${typeLabel} (${date.toDateString()}). Hãy chọn khoảng thời gian khác.`,
        });
    };

    return (
        <div className={cn('space-y-3', className)}>
            {alertMsg && (
                <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>{alertMsg.title}</AlertTitle>
                    <AlertDescription>{alertMsg.description}</AlertDescription>
                </Alert>
            )}

            <Calendar
                suppressHydrationWarning
                selected={value}
                reserved={reserved}
                range={range}
                options={{
                    locale: effectiveLocale,
                    weekStartsOn,
                    useAttributes: true,
                    ...options,
                }}
                onChange={handleChange}
                onOverbook={handleOverbook}
            />
        </div>
    );
}


