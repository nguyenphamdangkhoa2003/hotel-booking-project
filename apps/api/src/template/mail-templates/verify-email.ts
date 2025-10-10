export function verifyEmailTemplate(fullName: string, verifyUrl: string) {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1)">
      <div style="background:#4f46e5; padding:20px; text-align:center; color:white;">
        <h1>Booking App</h1>
      </div>
      <div style="padding:30px;">
        <p>Xin chào <b>${fullName}</b>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản 🎉</p>
        <p>Vui lòng xác thực email bằng cách bấm nút bên dưới:</p>
        <div style="text-align:center; margin:30px 0;">
          <a href="${verifyUrl}" 
             style="background:#4f46e5; color:white; padding:12px 24px; 
                    text-decoration:none; border-radius:6px; font-weight:bold;">
            Xác thực Email
          </a>
        </div>
        <p>Nếu nút không hoạt động, hãy copy link sau và dán vào trình duyệt:</p>
        <p style="word-break:break-all; color:#555;">${verifyUrl}</p>
        <p style="color:#999; font-size:12px;">Liên kết sẽ hết hạn sau 24 giờ.</p>
      </div>
    </div>
  </div>
  `;
}
