const { Sequelize } = require('sequelize');

// Cấu hình kết nối
// 'lab5ex1' : Tên database (dựa theo log của bạn)
// 'root'    : Tên đăng nhập MySQL (thường là root)
// ''        : Mật khẩu (XAMPP thường để trống, nếu bạn có pass thì điền vào)
const sequelize = new Sequelize('lab5ex1', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false, // Đặt false để gọn terminal, đặt true nếu muốn xem câu lệnh SQL chạy ngầm
    timezone: '+07:00' // Chỉnh múi giờ Việt Nam cho đúng created/updatedAt
});

// Hàm kiểm tra kết nối (Optional - giúp debug lỗi nhanh)
sequelize.authenticate()
    .then(() => {
        console.log('Kết nối MySQL thành công!');
    })
    .catch(err => {
        console.error('Không thể kết nối đến MySQL:', err);
    });

module.exports = sequelize;