import React from 'react';
import {
    FaFacebookSquare,
    FaInstagram,
    FaLinkedin,
    FaTwitter,
    FaYoutube,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
    FaClock,
    FaGithub,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import cod from '../assets/cash_on_delivery.png';
import momo from '../assets/momo.png';
import stripe from '../assets/stripe.png';
import vnpay from '../assets/vn_pay.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Sản phẩm', path: '/products' },
        { name: 'Khuyến mãi', path: '/promotions' },
        { name: 'Về chúng tôi', path: '/about' },
        { name: 'Liên hệ', path: '/contact' },
    ];

    const customerServices = [
        { name: 'Chính sách bảo mật', path: '/privacy-policy' },
        { name: 'Chính sách đổi trả', path: '/return-policy' },
        { name: 'Điều khoản dịch vụ', path: '/terms' },
        { name: 'Hướng dẫn mua hàng', path: '/shopping-guide' },
        { name: 'Hỏi đáp', path: '/faq' },
    ];

    const socialLinks = [
        {
            icon: <FaFacebookSquare />,
            url: 'https://facebook.com',
            name: 'Facebook',
        },
        {
            icon: <FaInstagram />,
            url: 'https://instagram.com',
            name: 'Instagram',
        },
        { icon: <FaTwitter />, url: 'https://twitter.com', name: 'Twitter' },
        { icon: <FaYoutube />, url: 'https://youtube.com', name: 'YouTube' },
        { icon: <FaLinkedin />, url: 'https://linkedin.com', name: 'LinkedIn' },
        {
            icon: <FaGithub />,
            url: 'https://github.com/NamHoang-Git/Ecommerce_SHOP_Full_Stack',
            name: 'GitHub',
        },
    ];

    return (
        <footer className="bg-secondary-100 text-primary-100 font-medium pt-12 pb-6">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* About Us */}
                    <div className="mb-6">
                        <h3 className="text-white text-lg font-bold mb-4 relative pb-2">
                            Về chúng tôi
                            <span className="absolute bottom-0 left-0 w-12 h-[3px] bg-primary-100"></span>
                        </h3>
                        <p className="text-sm leading-relaxed mb-4">
                            Chúng tôi cam kết mang đến những sản phẩm chất lượng
                            nhất với giá cả hợp lý và dịch vụ khách hàng tận
                            tâm.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary rounded-[4px] text-secondary-200 hover:text-primary-100 transition-colors
                                    duration-300 text-2xl p-0.5"
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="mb-6">
                        <h3 className="text-white text-lg font-bold mb-4 relative pb-2">
                            Liên kết nhanh
                            <span className="absolute bottom-0 left-0 w-12 h-[3px] bg-primary-100"></span>
                        </h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        to={link.path}
                                        className="text-sm hover:text-gray-700 hover:font-extrabold transition-colors duration-300"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="mb-6">
                        <h3 className="text-white text-lg font-bold mb-4 relative pb-2">
                            Hỗ trợ khách hàng
                            <span className="absolute bottom-0 left-0 w-12 h-[3px] bg-primary-100"></span>
                        </h3>
                        <ul className="space-y-2">
                            {customerServices.map((service, index) => (
                                <li key={index}>
                                    <Link
                                        to={service.path}
                                        className="text-sm hover:text-gray-700 hover:font-extrabold transition-colors duration-300"
                                    >
                                        {service.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-6">
                        <h3 className="text-white text-lg font-bold mb-4 relative pb-2">
                            Liên hệ
                            <span className="absolute bottom-0 left-0 w-12 h-[3px] bg-primary-100"></span>
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <FaMapMarkerAlt className="mt-1 mr-3 text-primary-100" />
                                <span className="text-sm">
                                    123 Đường ABC, TP. Đà Nẵng
                                </span>
                            </li>
                            <li className="flex items-center">
                                <FaPhoneAlt className="mr-3 text-primary-100" />
                                <a
                                    href="tel:+84912345678"
                                    className="text-sm hover:text-gray-700 hover:font-extrabold transition-colors duration-300"
                                >
                                    +84 383 376 601
                                </a>
                            </li>
                            <li className="flex items-center">
                                <FaEnvelope className="mr-3 text-primary-100" />
                                <a
                                    href="mailto:ngokhoangnam4268@gmail.com"
                                    className="text-sm hover:text-gray-700 hover:font-extrabold transition-colors duration-300"
                                >
                                    ngokhoangnam4268@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center">
                                <FaClock className="mr-3 text-primary-100" />
                                <span className="text-sm">
                                    Thứ 2 - Thứ 7: 8:00 - 22:00
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t-[3px] border-red-darker pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm mb-4 md:mb-0">
                            © {currentYear} Ecommerce Shop. Tất cả các quyền
                            được bảo lưu.
                        </p>
                        <div className="flex space-x-6 items-center">
                            <img
                                src={cod}
                                alt="Cash On Delivery"
                                className="h-8 object-contain bg-white p-1 rounded-md"
                            />
                            <img
                                src={momo}
                                alt="Momo"
                                className="h-8 object-contain bg-white p-1 rounded-md"
                            />
                            <img
                                src={stripe}
                                alt="Stripe Payment"
                                className="h-8 object-contain bg-white p-1 rounded-md"
                            />
                            <img
                                src={vnpay}
                                alt="VNPAY"
                                className="h-8 object-contain bg-white p-1 rounded-md"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
