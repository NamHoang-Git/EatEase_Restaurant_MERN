'use client';

import { useEffect, useState } from 'react';
import { Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterContent {
    tagline: string;
    copyright: string;
}

const defaultContent: FooterContent = {
    tagline:
        'Experience 3D animation like never before. We craft cinematic visuals for brands and products.',
    copyright: '© 2025 — TechSpace International Uk',
};

export function Footer() {
    const [content, setContent] = useState<FooterContent>(defaultContent);

    useEffect(() => {
        // Load content from localStorage
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
        <section className="text-amber-950 font-bold liquid-glass-menu">
            {/* Footer */}
            <footer className="border-t border-white/10 pb-20 md:pb-10">
                <div className="container mx-auto px-4 py-10">
                    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
                        {/* Brand */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5">
                                {/* <Image src="/icons/skitbit-white.svg" alt="Skitbit logo" width={24} height={24} className="h-6 w-6" /> */}
                                <span className="text-xl font-semibold text-red-700">
                                    TechSpace
                                </span>
                            </div>
                            <p className="max-w-sm text-sm">
                                {content.tagline}
                            </p>
                        </div>

                        {/* Navigation */}
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-2">
                            <div>
                                <h5 className="mb-2 text-xs font-semibold uppercase tracking-widest">
                                    Navigation
                                </h5>
                                <ul className="space-y-2 text-sm text-neutral-300">
                                    {[
                                        'Home',
                                        'Features',
                                        'Testimonials',
                                        'Pricing',
                                        'Blog',
                                        'Download',
                                    ].map((item) => (
                                        <li key={item}>
                                            {/* <Link href={`#${item.toLowerCase()}`} className="hover:text-lime-300">
                        {item}
                      </Link> */}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h5 className="mb-2 text-xs font-semibold uppercase tracking-widest">
                                    Social media
                                </h5>
                                <ul className="space-y-2 text-sm text-red-700">
                                    <li className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4" />
                                        <a
                                            href="https://twitter.com/theskitbit"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-lime-300"
                                            aria-label="Follow skitbit on Twitter"
                                        >
                                            X/Twitter
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Youtube className="h-4 w-4" />
                                        <a
                                            href="https://www.youtube.com/@skitbitinternational"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-lime-300"
                                            aria-label="Subscribe to skitbit on YouTube"
                                        >
                                            YouTube
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Instagram className="h-4 w-4" />
                                        <a
                                            href="https://instagram.com/theskitbit"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-lime-300"
                                            aria-label="Follow skitbit on Instagram"
                                        >
                                            Instagram
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        <a
                                            href="https://threads.com/theskitbit"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-lime-300"
                                            aria-label="Follow skitbit on Threads"
                                        >
                                            Threads
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div
                        className="mt-8 flex flex-col items-center justify-between gap-4 border-t
                    border-red-700/40 pt-6 text-xs sm:flex-row"
                    >
                        <p>{content.copyright}</p>
                        <div className="flex items-center gap-6">
                            <a
                                href="/revisions"
                                className="hover:text-lime-300"
                            >
                                Revision Policy
                            </a>
                            <a href="/t&c" className="hover:text-lime-300">
                                Terms & Conditions
                            </a>
                            {/* <Link href="/revisions" className="hover:text-lime-300">
                Revision Policy
              </Link>
              <Link href="/t&c" className="hover:text-lime-300">
                Terms & Conditions
              </Link> */}
                        </div>
                    </div>
                </div>
            </footer>
        </section>
    );
}
