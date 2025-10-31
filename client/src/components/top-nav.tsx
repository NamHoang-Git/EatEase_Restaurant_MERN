'use client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { useSelector } from 'react-redux';
import defaultAvatar from '../assets/defaultAvatar.png';
import UserMenu from './UserMenu';

export function TopNav() {
    const user = useSelector((state: any) => state.user);

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

    return (
        <header className="sticky top-0 z-40 border-b-2 bg-background">
            <div className="flex h-16 justify-end px-4 md:px-6 w-full">
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
                                            src={user.avatar || defaultAvatar}
                                            alt={user.name || 'User'}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='mr-4'>
                            <UserMenu close={close} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
