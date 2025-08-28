import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.headers?.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Yêu cầu xác thực"
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: err.name === "TokenExpiredError" ? "Token hết hạn" : "Token không hợp lệ"
        });
    }
};

export default auth;
