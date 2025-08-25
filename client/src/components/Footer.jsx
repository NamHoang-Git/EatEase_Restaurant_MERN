import React from 'react';
import { FaFacebookSquare, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="border-t border-neutral-600">
            <div
                className="container select-none mx-auto px-4 py-6 text-center flex flex-col
            lg:flex-row lg:justify-between gap-4"
            >
                <p>© All Rights Reserved 2025.</p>
                <div className="flex items-end gap-4 justify-center text-2xl">
                    <a href="" className="hover:text-primary-100">
                        <FaFacebookSquare />
                    </a>
                    <a href="" className="hover:text-primary-100">
                        <FaInstagram />
                    </a>
                    <a href="" className="hover:text-primary-100">
                        <FaLinkedin />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
