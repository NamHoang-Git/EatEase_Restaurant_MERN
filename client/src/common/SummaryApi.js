export const baseURL = import.meta.env.VITE_API_URL

const SummaryApi = {
    register: {
        url: '/api/user/register',
        method: 'post'
    },
    login: {
        url: '/api/user/login',
        method: 'post'
    },
    user_points: {
        url: '/api/user/user-points',
        method: 'get'
    },
    forgot_password: {
        url: '/api/user/forgot-password',
        method: 'put'
    },
    forgot_password_otp_verification: {
        url: '/api/user/verify-forgot-password-otp',
        method: 'put'
    },
    reset_password: {
        url: '/api/user/reset-password',
        method: 'put'
    },
    refresh_token: {
        url: '/api/user/refresh-token',
        method: 'post'
    },
    user_details: {
        url: '/api/user/user-details',
        method: 'get'
    },
    logout: {
        url: '/api/user/logout',
        method: 'get'
    },
    upload_avatar: {
        url: '/api/user/upload-avatar',
        method: 'put'
    },
    update_user: {
        url: '/api/user/update-user',
        method: 'put'
    },
    verify_password: {
        url: '/api/user/verify-password',
        method: 'post'
    },
    get_available_vouchers: {
        url: '/api/voucher/available',
        method: 'post'
    },
    apply_voucher: {
        url: '/api/voucher/apply',
        method: 'post'
    },
    change_password: {
        url: '/api/user/change-password',
        method: 'put'
    },
    get_initial_products: {
        url: '/api/product/initial-products',
        method: 'post'
    },

    // Category
    add_category: {
        url: '/api/category/add-category',
        method: 'post'
    },
    upload_image: {
        url: '/api/file/upload',
        method: 'post'
    },
    get_category: {
        url: '/api/category/get-category',
        method: 'get'
    },
    update_category: {
        url: '/api/category/update-category',
        method: 'put'
    },
    delete_category: {
        url: '/api/category/delete-category',
        method: 'delete'
    },

    // Product
    add_product: {
        url: '/api/product/add-product',
        method: 'post'
    },
    get_product: {
        url: '/api/product/get-product',
        method: 'post'
    },
    get_product_by_category_home: {
        url: '/api/product/get-product-by-category-home',
        method: 'post'
    },
    get_product_by_category_list: {
        url: '/api/product/get-product-by-category-list',
        method: 'post'
    },
    get_product_details: {
        url: '/api/product/get-product-details',
        method: 'post'
    },
    update_product_details: {
        url: '/api/product/update-product-details',
        method: 'put'
    },
    delete_product: {
        url: '/api/product/delete-product',
        method: 'delete'
    },
    search_product: {
        url: '/api/product/search-product',
        method: 'post'
    },

    // Cart
    add_to_cart: {
        url: '/api/cart/add-to-cart-item',
        method: 'post'
    },
    get_cart_item: {
        url: '/api/cart/get-cart-item',
        method: 'get'
    },
    update_cart_item_qty: {
        url: '/api/cart/update-cart-item',
        method: 'put'
    },
    delete_cart_item: {
        url: '/api/cart/delete-cart-item',
        method: 'delete'
    },
    clear_cart: {
        url: '/api/cart/clear-cart',
        method: 'delete'
    },

    // Address
    add_address: {
        url: '/api/address/add-address',
        method: 'post'
    },
    get_address: {
        url: '/api/address/get-address',
        method: 'get'
    },
    update_address: {
        url: '/api/address/update-address',
        method: 'put'
    },
    delete_address: {
        url: '/api/address/delete-address',
        method: 'delete'
    },
    restore_address: {
        url: '/api/address/restore-address',
        method: 'post'
    },

    // Order
    cash_on_delivery_order: {
        url: '/api/order/cash-on-delivery',
        method: 'post'
    },
    payment_url: {
        url: '/api/order/checkout',
        method: 'post'
    },
    get_order_items: {
        url: '/api/order/order-list',
        method: 'get'
    },
    all_orders: {
        url: '/api/order/all-orders',
        method: 'get'
    },

    // Voucher
    add_voucher: {
        url: '/api/voucher/add-voucher',
        method: 'post'
    },
    get_all_voucher: {
        url: '/api/voucher/get-all-voucher',
        method: 'get'
    },
    update_voucher: {
        url: '/api/voucher/update-voucher',
        method: 'put'
    },
    delete_voucher: {
        url: '/api/voucher/delete-voucher',
        method: 'delete'
    },
    bulk_delete_vouchers: {
        url: '/api/voucher/bulk-delete-vouchers',
        method: 'delete'
    },
    bulk_update_vouchers_status: {
        url: '/api/voucher/bulk-update-vouchers-status',
        method: 'put'
    }
}

export default SummaryApi