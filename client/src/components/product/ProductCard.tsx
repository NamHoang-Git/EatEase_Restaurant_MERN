'use client';

import { useState } from 'react';
// import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GlareHover from '../animation/GlareHover';
import { cn } from '@/lib/utils';

interface Product {
    _id: string;
    name: string;
    images: string[];
    price: number;
    originalPrice?: number;
    description?: string;
    unit: string;
    inStock: boolean;
    isActive: boolean;
    category: {
        _id: string;
        name: string;
    };
}

interface ProductCardProps {
    data: Product;
    onEdit?: (data: Product) => void;
    onDelete?: (data: Product) => void;
    onViewImage?: (urls: string[]) => void;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
}

export function ProductCard({
    data,
    onEdit,
    onDelete,
    onViewImage,
}: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    // const mainImage = data?.images?.[0] || '/placeholder-product.jpg';
    const hasDiscount =
        data?.originalPrice && data?.originalPrice > data?.price;
    const discountPercentage = hasDiscount
        ? Math.round(
              ((data?.originalPrice! - data?.price) / data?.originalPrice!) *
                  100
          )
        : 0;

    return (
        <div className="block rounded-[28px] backdrop-glass border border-input p-2 h-full">
            <Card
                className={cn(
                    'bg-input hover:bg-transparent rounded-3xl transition-all duration-300 overflow-hidden group relative h-full flex flex-col',
                    !data.isActive && 'opacity-70'
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Glow effect on hover */}
                <div
                    className={`absolute inset-0 bg-gradient-to-r from-highlight/20 to-highlight/10 opacity-0 transition-opacity
                        duration-500 pointer-events-none ${
                            isHovered ? 'opacity-100' : ''
                        }`}
                />

                {/* Border glow */}
                <div
                    className={`absolute inset-0 rounded-3xl border transition-all duration-500 ${
                        isHovered
                            ? 'border-highlight/70 shadow-[0_0_15px_rgba(var(--highlight),0.3)]'
                            : 'border-transparent'
                    }`}
                />

                {/* Product Image */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => onViewImage?.(data.images)}
                >
                    <img
                        src={data.images[0]}
                        alt={data.name}
                        className={`w-full h-32 sm:h-44 object-contain bg-white transition-transform duration-700 cursor-pointer ${
                            isHovered
                                ? 'scale-100 opacity-80'
                                : 'scale-100 opacity-100'
                        }`}
                    />
                    {!data.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Hết hàng
                            </span>
                        </div>
                    )}
                    {hasDiscount && (
                        <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                            -{discountPercentage}%
                        </Badge>
                    )}
                    {!data.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Tạm ẩn
                            </span>
                        </div>
                    )}
                </div>

                <CardContent className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-base mb-1 line-clamp-2">
                            {data.name}
                        </h3>
                        {data.category && (
                            <Badge variant="outline">
                                {data.category.name}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            {data.unit}
                        </span>
                        <span className="text-lg font-bold">
                            {formatPrice(data.price)}
                        </span>
                    </div>

                    <div className="flex w-full items-center justify-center gap-2">
                        <GlareHover
                            background="transparent"
                            glareOpacity={0.3}
                            glareAngle={-30}
                            glareSize={300}
                            transitionDuration={800}
                            playOnce={false}
                            className="flex-1"
                        >
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(data);
                                }}
                                className="bg-muted-foreground hover:bg-muted-foreground w-full"
                            >
                                Sửa
                            </Button>
                        </GlareHover>
                        <GlareHover
                            background="transparent"
                            glareOpacity={0.3}
                            glareAngle={-30}
                            glareSize={300}
                            transitionDuration={800}
                            playOnce={false}
                            className="flex-1"
                        >
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(data);
                                }}
                                className="bg-foreground w-full"
                            >
                                Xóa
                            </Button>
                        </GlareHover>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ProductCard;
