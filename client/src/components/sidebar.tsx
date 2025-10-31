'use client';

import { useState } from 'react';
import {
    Home,
    BarChart2,
    Package,
    Layers,
    TicketPercent,
    Users2,
    Settings,
    HelpCircle,
    Menu,
    PanelLeftClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const navigation = [
    { name: 'Trang quản trị', href: '/admin/dashboard', icon: Home },
    { name: 'Quản lý người dùng', href: '/admin/users', icon: Users2 },
    { name: 'Quản lý sản phẩm', href: '/admin/products', icon: Package },
    { name: 'Quản lý danh mục', href: '/admin/categories', icon: Layers },
    { name: 'Mã giảm giá', href: '/admin/vouchers', icon: TicketPercent },
    { name: 'Báo cáo thống kê', href: '/admin/reports', icon: BarChart2 },
];

const bottomNavigation = [
    { name: 'Tài khoản', href: '/dashboard/profile', icon: Settings },
    { name: 'Hỗ trợ', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
    const { pathname } = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const NavItem = ({ item, isBottom = false }) => (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Link
                    to={item.href}
                    className={cn(
                        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        pathname === item.href
                            ? 'bg-secondary text-secondary-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                        isCollapsed && 'justify-center px-2'
                    )}
                >
                    <item.icon
                        className={cn('h-4 w-4', !isCollapsed && 'mr-3 mb-0.5')}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                </Link>
            </TooltipTrigger>
            {isCollapsed && (
                <TooltipContent
                    side="right"
                    className="flex items-center gap-4"
                >
                    {item.name}
                </TooltipContent>
            )}
        </Tooltip>
    );

    return (
        <TooltipProvider>
            <>
                <button
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md shadow-md"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle sidebar"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div
                    className={cn(
                        'fixed inset-y-0 z-20 flex flex-col bg-background transition-all duration-300 ease-in-out lg:static',
                        isCollapsed ? 'w-[72px]' : 'w-72',
                        isMobileOpen
                            ? 'translate-x-0'
                            : '-translate-x-full lg:translate-x-0'
                    )}
                >
                    <div className="border-b border-border">
                        <div
                            className={cn(
                                'flex h-16 items-center gap-2 px-4',
                                isCollapsed && 'justify-center px-2'
                            )}
                        >
                            {!isCollapsed && (
                                <Link
                                    to="/"
                                    className="lg:flex hidden items-center gap-1.5 font-semibold"
                                >
                                    <img
                                        src={logo}
                                        alt="EatEase logo"
                                        width={25}
                                        height={25}
                                    />
                                    <span className="tracking-wide">
                                        EatEase
                                    </span>
                                </Link>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    'ml-auto h-8 w-8 lg:block hidden',
                                    isCollapsed && 'ml-0'
                                )}
                                onClick={() => setIsCollapsed(!isCollapsed)}
                            >
                                <PanelLeftClose
                                    className={cn(
                                        'h-5 w-5 transition-transform',
                                        isCollapsed && 'rotate-180'
                                    )}
                                />
                                <span className="sr-only">
                                    {isCollapsed ? 'Expand' : 'Collapse'}{' '}
                                    Sidebar
                                </span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <div
                            className={cn(
                                'flex lg:hidden h-16 items-center gap-2 pt-4 justify-center'
                            )}
                        >
                            <Link
                                to="/"
                                className="flex items-center gap-1.5 font-semibold"
                            >
                                <img
                                    src={logo}
                                    alt="EatEase logo"
                                    width={25}
                                    height={25}
                                />
                                <span className="tracking-wide">EatEase</span>
                            </Link>
                        </div>
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => (
                                <NavItem key={item.name} item={item} />
                            ))}
                        </nav>
                    </div>
                    <div className="border-t border-border p-2">
                        <nav className="space-y-1">
                            {bottomNavigation.map((item) => (
                                <NavItem key={item.name} item={item} isBottom />
                            ))}
                        </nav>
                    </div>
                </div>
            </>
        </TooltipProvider>
    );
}
