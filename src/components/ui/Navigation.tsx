'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Image as ImageIcon, Settings, Zap } from 'lucide-react';

export function Navigation() {
    const pathname = usePathname();

    const navItems = [
        {
            name: '스튜디오',
            href: '/',
            icon: ImageIcon,
        },
        {
            name: '업스케일',
            href: '/upscale',
            icon: Zap,
        },
        {
            name: '갤러리',
            href: '/gallery',
            icon: LayoutGrid,
        },
        {
            name: '설정',
            href: '/setting',
            icon: Settings,
        },
    ];

    return (
        <nav className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">
                    weet AI Studio
                </span>
            </div>

            {/* Menu */}
            <div className="flex items-center gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
