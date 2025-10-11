'use client';

import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function SearchForm() {
    const router = useRouter();
    const t = useTranslations('search');

    const Schema = z.object({
        destination: z.string().min(1, { message: t('errors.destination') }),
        guests: z.coerce
            .number()
            .int()
            .min(1, { message: t('errors.guests') }),
        rooms: z.coerce
            .number()
            .int()
            .min(1, { message: t('errors.rooms') }),
        checkIn: z.date().optional(),
        checkOut: z.date().optional(),
    });

    type FormInput = z.input<typeof Schema>;
    type FormValues = z.output<typeof Schema>;

    const form = useForm<FormInput, any, FormValues>({
        resolver: zodResolver(Schema),
        defaultValues: {
            destination: '',
            guests: 2,
            rooms: 1,
            checkIn: undefined,
            checkOut: undefined,
        },
        mode: 'onSubmit',
    });

    const onSubmit: SubmitHandler<FormValues> = (values) => {
        const qs = new URLSearchParams({
            destination: values.destination,
            guests: String(values.guests),
            rooms: String(values.rooms),
            ...(values.checkIn
                ? { checkIn: values.checkIn.toISOString().slice(0, 10) }
                : {}),
            ...(values.checkOut
                ? { checkOut: values.checkOut.toISOString().slice(0, 10) }
                : {}),
        });
        router.push(`/search?${qs.toString()}`);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 md:grid-cols-12">
                {/* Destination */}
                <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                        <FormItem className="md:col-span-6">
                            <FormLabel>{t('destination.label')}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={t('destination.placeholder')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Guests */}
                <FormField
                    control={form.control}
                    name="guests"
                    render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>{t('guests')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    value={
                                        Number.isFinite(field.value as any)
                                            ? (field.value as any)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        field.onChange(
                                            e.currentTarget.valueAsNumber
                                        )
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Rooms */}
                <FormField
                    control={form.control}
                    name="rooms"
                    render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>{t('rooms')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    value={
                                        Number.isFinite(field.value as any)
                                            ? (field.value as any)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        field.onChange(
                                            e.currentTarget.valueAsNumber
                                        )
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Check-in */}
                <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                        <FormItem className="md:col-span-6">
                            <FormLabel>{t('check-in')}</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !field.value &&
                                                    'text-muted-foreground'
                                            )}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value
                                                ? format(
                                                      field.value,
                                                      'yyyy-MM-dd'
                                                  )
                                                : t('select-date')}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(d) => field.onChange(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Check-out */}
                <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                        <FormItem className="md:col-span-6">
                            <FormLabel>{t("check-out")}</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !field.value &&
                                                    'text-muted-foreground'
                                            )}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value
                                                ? format(
                                                      field.value,
                                                      'yyyy-MM-dd'
                                                  )
                                                : t('select-date')}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="p-0">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(d) => field.onChange(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit */}
                <div className="md:col-span-12">
                    <Button type="submit" className="w-full">
                        {t('search')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
