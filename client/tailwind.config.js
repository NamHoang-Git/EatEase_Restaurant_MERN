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
      }
    },
  },
  plugins: [],
}