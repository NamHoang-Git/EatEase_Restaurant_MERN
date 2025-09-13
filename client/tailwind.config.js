/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "highlight-300": "#9e2ca8",
        "highlight-200": "#952268",
        "highlight-100": "#c06c84",
        "primary-200": "#f7a10b", // Vàng Gold Chính
        "primary-100": "#fdf6e3", // Vàng Gold Nhạt
        "secondary-200": "#d0011b", // Đỏ Đồng Chính
        "secondary-100": "#C66B6B", // Đỏ Đồng Nhạt
        "base-100": "#f8f5f0",
        "red-lighter": "#FFEBEE",
        "red-light": "#FFCDD2",
        "red-normal": "#EF4444",
        "red-dark": "#DC2626",
        "red-darker": "#B91C1C",
        price: {
          DEFAULT: '#E60023', // đỏ giá
          light: '#FF4D6D',
          dark: '#B3001A',
        },
        success: {
          DEFAULT: '#16A34A', // xanh thành công
          light: '#4ADE80',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#F59E0B', // vàng cảnh báo
          light: '#FCD34D',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626', // đỏ lỗi
          light: '#F87171',
          dark: '#991B1B',
        },
      },
      fontSize: {
        // Tiêu đề trang, banner
        'title-page': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        // Tiêu đề mục nhỏ
        'title-section': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        // Tên sản phẩm
        'product-name': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        // Giá chính
        'price-main': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        // Giá gốc
        'price-old': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        // Mô tả, metadata
        'meta': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        // Body text
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        // Footer
        'footer': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}