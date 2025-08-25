export const pricewithDiscount = (price, dis = 0) => {
    const discount = Number(dis) || 0; // Đảm bảo discount là số, mặc định 0
    if (discount <= 0) return Number(price) || 0; // Không giảm giá nếu discount <= 0
    const discountAmount = Math.ceil((Number(price) * discount) / 100);
    const actualPrice = Number(price) - discountAmount;
    return actualPrice;
};