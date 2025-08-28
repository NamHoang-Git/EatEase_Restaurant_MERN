const forgotPasswordTemplate = ({ name, otp }) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h2 style="color: #2c3e50; margin-bottom: 20px;">Đặt lại mật khẩu của bạn</h2>

                <p>Xin chào <strong>${name}</strong>,</p>

                <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP dưới đây để tiếp tục quá trình đặt lại mật khẩu của bạn:</p>

                <div style="background: #fff3cd; color: #856404; font-size: 24px; font-weight: bold;
                            text-align: center; padding: 15px; margin: 20px 0; border-radius: 4px;
                            border: 1px solid #ffeeba; letter-spacing: 5px;">
                    ${otp}
                </div>

                <p style="color: #6c757d; font-size: 14px; margin-bottom: 20px;">
                    ⏳ Mã OTP này có hiệu lực trong vòng 30 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
                </p>

                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ nếu bạn nghi ngờ có hoạt động đáng ngờ.</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
                    <p>Trân trọng,<br/>Đội ngũ EcomSpace</p>
                    <p>📧 support@ecomspace.vn<br/>
                    🌐 www.ecomspace.vn</p>
                </div>
            </div>
        </div>
    `
}

export default forgotPasswordTemplate