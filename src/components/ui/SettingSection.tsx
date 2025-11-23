import React from 'react';
import { cn } from '@/lib/utils';

interface SettingSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingSection({ title, description, children, className }: SettingSectionProps) {
    return (
        <div className={cn("bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden", className)}>
            <div className="p-6 border-b border-zinc-800/50">
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
                {description && (
                    <p className="text-sm text-zinc-400 mt-1">{description}</p>
                )}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
