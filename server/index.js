import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import userRouter from "./route/user.route.js";
import uploadRouter from "./route/upload.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import orderRouter from './route/order.route.js';
import voucherRouter from './route/voucher.route.js';
import menuCategoryRouter from "./route/menuCategory.route.js";

const app = express();

app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_URL,
    }),
);

// Middleware để lưu raw body cho webhook
app.use((req, res, next) => {
    if (req.originalUrl === '/api/order/webhook' || req.originalUrl === '/api/stripe/webhook') {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            req.rawBody = data;
            try {
                req.body = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing webhook JSON:', error);
                req.body = {};
            }
            next();
        });
    } else {
        express.json()(req, res, next);
    }
});

app.use(cookieParser());
app.use(morgan('dev'));
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    }),
);

const PORT = 8080 || process.env.PORT;

app.get("/", (req, res) => {
    res.json({
        message: "Server is running " + PORT,
    });
});

app.use('/api/user', userRouter);
app.use('/api/menu-category', menuCategoryRouter);
app.use('/api/file', uploadRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/stripe', orderRouter);
app.use('/api/voucher', voucherRouter);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running", PORT);
    });
});