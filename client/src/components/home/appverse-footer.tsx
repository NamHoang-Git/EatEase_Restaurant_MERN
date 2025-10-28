'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
// import logo from '../../assets/Apple-iPhone-17-Pro.jpg';
import GradientText from '../GradientText';
interface FooterContent {
    tagline: string;
    copyright: string;
}

const defaultContent: FooterContent = {
    tagline:
        'Experience 3D animation like never before. We craft cinematic visuals for brands and products.',
    copyright: '© 2025 — Skitbit International Uk',
};

export function AppverseFooter() {
    const [content, setContent] = useState<FooterContent>(defaultContent);

    useEffect(() => {
        const savedContent = localStorage.getItem('skitbit-content');
        if (savedContent) {
            try {
                const parsed = JSON.parse(savedContent);
                if (parsed.footer) {
                    setContent(parsed.footer);
                }
            } catch (error) {
                console.error('Error parsing saved content:', error);
            }
        }
    }, []);

    return (
        <section className="text-white">
            <div className="container mx-auto px-4 py-8 sm:py-10">
                <Card className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-10">
                    <div className="relative grid items-center gap-8 md:grid-cols-2">
                        <div>
                            <p className="mb-2 text-xs tracking-widest text-lime-300 uppercase">
                                Khám phá kỷ nguyên mới của hiệu năng và thiết kế
                            </p>
                            <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl uppercase">
                                Siêu phẩm mới nhất từ Apple – Bứt phá mọi giới
                                hạn
                            </h3>
                            <p className="mt-2 max-w-prose text-sm text-neutral-100">
                                Tốc độ, sắc nét và thông minh hơn bao giờ hết –
                                iPhone 17 Pro Max định nghĩa lại trải nghiệm di
                                động.
                            </p>
                        </div>

                        <div className="mx-auto w-full max-w-[320px]">
                            <div className="relative rounded-[28px] liquid-glass p-2 shadow-2xl">
                                <div className="relative aspect-[9/19] w-full overflow-hidden rounded-2xl bg-black">
                                    <img
                                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%202-YFaCK7cEiHWSMRv8XEHaLCoYj2SUAi.mp4"
                                        // src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%202-YFaCK7cEiHWSMRv8XEHaLCoYj2SUAi.mp4"
                                        className="absolute inset-0 h-full w-full object-cover opacity-40"
                                        aria-label="Skitbit app preview - approvals made easy"
                                    />
                                    <div className="relative p-3">
                                        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
                                        <div className="space-y-2 px-1">
                                            <GradientText
                                                colors={[
                                                    '#FF7F32',
                                                    '#FF6A13',
                                                    '#FF4500',
                                                    '#FFA500',
                                                    '#FFFFFF',
                                                    '#FF6347',
                                                    '#FF4500',
                                                    '#FFB84D',
                                                    '#FF7F50',
                                                    '#FF9966',
                                                ]}
                                                animationSpeed={5.5}
                                                showBorder={false}
                                                className="custom-class text-5xl font-extrabold"
                                            >
                                                iPhone 17 Pro Max
                                            </GradientText>
                                            <p className="text-xs text-white text-justify">
                                                iPhone 17 Pro Max – màn hình
                                                120Hz, chip A17 Bionic, camera
                                                48MP, pin bền bỉ.
                                            </p>
                                            <div className="inline-flex items-center rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-lime-300">
                                                New
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
}
