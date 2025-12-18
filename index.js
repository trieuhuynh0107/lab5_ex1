const express = require('express');
const app = express();
const port = 3000;
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');
const multer = require('multer');
const axios = require('axios');
const path = require('path');

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 1. KẾT NỐI DB
const sequelize = require('./db'); // Đảm bảo file db.js của bạn đã đúng

// 2. IMPORT MODELS
const User = require('./models/user')(sequelize, DataTypes);
const Product = require('./models/product')(sequelize, DataTypes);
const Cart = require('./models/cart')(sequelize, DataTypes);

// 3. THIẾT LẬP QUAN HỆ (ASSOCIATIONS)
User.hasMany(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(Cart, { foreignKey: 'prodId' });
Cart.belongsTo(Product, { foreignKey: 'prodId' });

// Đồng bộ Database (Dùng force: true 1 lần nếu muốn reset bảng, sau đó đổi về alter: true)
sequelize.sync({ alter: true }).then(() => console.log('Database synced!'));

// --- HÀM HỖ TRỢ FORMAT JSON (Theo yêu cầu ảnh) ---
const sendRes = (res, action, status, keyName, data) => {
    res.json({
        action: action,
        status: status,
        [keyName]: data
    });
};

// ==========================================
// BÀI 1: CRUD (ORM & SQL)
// ==========================================

// --- A. USER (ORM) ---
// View All
app.get('/api/orm/users', async (req, res) => {
    const users = await User.findAll();
    sendRes(res, 'View All Users', 'Success', 'Users', users);
});
// Add
app.post('/api/orm/users', async (req, res) => {
    const newUser = await User.create(req.body);
    sendRes(res, 'Add User', 'Success', 'User', newUser);
});
// Update
app.put('/api/orm/users/:id', async (req, res) => {
    await User.update(req.body, { where: { id: req.params.id } });
    const updated = await User.findByPk(req.params.id);
    sendRes(res, 'Update User', 'Success', 'User', updated);
});
// Delete
app.delete('/api/orm/users/:id', async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if(user) {
        await user.destroy();
        sendRes(res, 'Delete User', 'Success', 'User', user);
    } else {
        res.status(404).json({ status: 'User not found' });
    }
});

// --- B. PRODUCT (ORM) ---
app.get('/api/orm/products', async (req, res) => {
    const products = await Product.findAll();
    sendRes(res, 'View All Products', 'Success', 'Products', products);
});
app.post('/api/orm/products', async (req, res) => {
    const newProd = await Product.create(req.body);
    sendRes(res, 'Add Product', 'Success', 'Product', newProd);
});

// --- C. SHOPPING CART (ORM) ---
// Thêm vào giỏ (Cần body: { userId: 1, prodId: 2, quantity: 5 })
app.post('/api/orm/cart', async (req, res) => {
    try {
        const item = await Cart.create(req.body);
        sendRes(res, 'Add to Cart', 'Success', 'ShoppingCart', item);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Xem giỏ hàng (kèm thông tin User và Product)
app.get('/api/orm/cart', async (req, res) => {
    const items = await Cart.findAll({ include: [User, Product] });
    sendRes(res, 'View Cart', 'Success', 'ShoppingCart', items);
});

// --- D. STANDARD QUERY (SQL THUẦN) ---
// Ví dụ với User (Product và Cart làm tương tự đổi câu SQL)
app.get('/api/sql/users', async (req, res) => {
    const [results] = await sequelize.query("SELECT * FROM Users");
    sendRes(res, 'View Users (SQL)', 'Success', 'Users', results);
});

app.post('/api/sql/users', async (req, res) => {
    const { fullName, address } = req.body;
    await sequelize.query(
        "INSERT INTO Users (fullName, address, registrationDate, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW(), NOW())",
        { replacements: [fullName, address] }
    );
    // Lấy user vừa tạo để trả về
    const [newUser] = await sequelize.query("SELECT * FROM Users ORDER BY id DESC LIMIT 1");
    sendRes(res, 'Add User (SQL)', 'Success', 'User', newUser[0]);
});


// ==========================================
// BÀI 2: GỬI EMAIL
// ==========================================
app.post('/send-email', async (req, res) => {
    const { email, content } = req.body;
    // Cấu hình mail (Dùng mailtrap để test hoặc Gmail App Password)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: 'EMAIL_CUA_BAN@gmail.com', pass: 'MAT_KHAU_UNG_DUNG' }
    });

    try {
        await transporter.sendMail({
            from: 'Node Server', to: email, subject: 'Lab 5 Test', text: content || 'Hello!'
        });
        sendRes(res, 'Send Email', 'Success', 'EmailInfo', { to: email });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ==========================================
// BÀI 3: UPLOAD ẢNH
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    
    // Format JSON trả về đúng yêu cầu
    res.json({
        action: "Upload Image",
        status: "Success",
        "ImageInfo": { url: imageUrl, filename: req.file.filename }
    });
});


// ==========================================
// BÀI 4: FETCH EXTERNAL API & SAVE
// ==========================================
app.get('/fetch-users', async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ web ngoài
        const response = await axios.get('https://jsonplaceholder.typicode.com/users');
        
        // 2. Map dữ liệu vào class User của mình
        const userList = response.data.map(u => ({
            fullName: u.name,
            address: u.address.street + ', ' + u.address.city,
            registrationDate: new Date()
        }));

        // 3. Lưu vào DB
        const savedUsers = await User.bulkCreate(userList);
        
        sendRes(res, 'Fetch & Save', 'Success', 'Users', savedUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});