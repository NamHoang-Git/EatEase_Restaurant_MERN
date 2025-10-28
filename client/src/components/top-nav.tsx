'use client';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/contexts/settings-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import React from 'react';
import { ThemeToggle } from './theme-toggle';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export function TopNav() {
    const pathname = usePathname() || '';
    const { settings, isLoading } = useSettings();
    const user = useSelector((state: any) => state.user);

    // Get path segments safely
    const pathSegments = pathname ? pathname.split('/').filter(Boolean) : [];

    // Safely get initials from fullName
    const getInitials = (name: string | null | undefined) => {
        if (!name || typeof name !== 'string') return 'U';
        const words = name.trim().split(/\s+/);
        return (
            words
                .slice(0, 2) // Take first two words max
                .map((word) => word[0] || '')
                .filter(Boolean)
                .join('')
                .toUpperCase() || 'U'
        );
    };

    // Show loading state if settings are not yet loaded
    if (isLoading || !settings) {
        return (
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="h-8 w-8" />
                    <div className="h-8 w-8 rounded-full bg-muted" />
                </div>
            </header>
        );
    }

    // Get safe values from settings
    const safeSettings = {
        fullName: settings?.fullName || 'User',
        email: settings?.email || 'No email',
        avatar: settings?.avatar || undefined,
    };

    return (
        <header className="sticky top-0 z-40 border-b bg-background">
            <div className="flex h-16 items-center md:justify-between justify-end px-4 md:px-6 w-full">
                <div className="hidden md:block">
                    <nav className="flex items-center space-x-2">
                        {pathSegments.map((segment, index) => (
                            <React.Fragment key={segment}>
                                <span className="text-muted-foreground">/</span>
                                <Link
                                    to={`/${pathSegments
                                        .slice(0, index + 1)
                                        .join('/')}`}
                                    className="text-sm font-medium"
                                >
                                    {segment.charAt(0).toUpperCase() +
                                        segment.slice(1)}
                                </Link>
                            </React.Fragment>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-8 w-8 rounded-full"
                            >
                                <Avatar className="h-8 w-8">
                                    {user?.avatar ? (
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name || 'User'}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                    width={32}
                                    height={32}
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user.name}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/settings">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
