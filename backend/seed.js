// Seed script: fills the DB with dummy users, products and orders.
// Run with:  npm run seed
//
// Safe to run multiple times:
//  - users are matched by email, products by name (updated, not duplicated)
//  - only orders created by this script (paymentId starting with "seed_") are replaced
//  - your own existing data is never deleted

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // same as index.js (needed for Atlas SRV lookup)

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// ---------- Dummy data ----------

// All seed users share this password (for login testing)
const SEED_PASSWORD = 'password123';

const users = [
    { name: 'Admin User',   email: 'admin@shopnest.com', role: 'admin', verified: true },
    { name: 'Rahul Sharma', email: 'rahul@shopnest.com', role: 'user',  verified: true },
    { name: 'Priya Verma',  email: 'priya@shopnest.com', role: 'user',  verified: true },
    { name: 'Aman Gupta',   email: 'aman@shopnest.com',  role: 'user',  verified: false },
];

// Real product photos from Unsplash (free to use), cropped to 600x600 squares
const UNSPLASH_IDS = {
    headphones: '1505740420928-5e560c06d30e',
    smartwatch: '1546868871-7041f2a55e12',
    speaker:    '1608043152269-423dbba4e7e1',
    keyboard:   '1618384887929-16ec33fab9ef',
    tshirt:     '1521572163474-6864f9cf17ab',
    jacket:     '1543076447-215ad9ba6923',
    shoes:      '1542291026-7eec264c27ff',
    wallet:     '1627123424574-724758594e93',
    bottle:     '1602143407151-7111542de6e8',
    cookware:   '1590794056226-79ef3a8147e1',
    book:       '1543002588-bfa74002ed7e',
    yogamat:    '1600881333168-2ef49b341f30',
    backpack:   '1553062407-98eeb64c6a62',
    sunglasses: '1572635196237-14b3f281503f',
    earbuds:    '1590658268037-6bf12165a8df',
    mouse:      '1527864550417-7fd91fc51a46',
    handbag:    '1584917865442-de89df76afd3',
    hoodie:     '1556821840-3a63f95609a7',
    jeans:      '1542272604-787c3835535d',
    lamp:       '1507473885765-e6ed057f782c',
    mug:        '1514228742587-6b1558fcca3d',
    candle:     '1602874801007-bd458bb1b8b6',
    plant:      '1485955900006-10f4d324d411',
    dumbbells:  '1586401100295-7a8096fd231a',
    football:   '1614632537190-23e4146777db',
    notebook:   '1531346878377-a5be20888e57',
};
const img = (slug) =>
    `https://images.unsplash.com/photo-${UNSPLASH_IDS[slug]}?w=600&h=600&fit=crop&q=80`;

const products = [
    { name: 'Wireless Headphones',  description: 'Bluetooth over-ear headphones with active noise cancellation and 30h battery.', price: 2999,  category: 'Electronics', stock: 50,  imagesUrl: img('headphones'), ratings: 4.5, numReviews: 128 },
    { name: 'Smart Watch',          description: 'Fitness smartwatch with heart-rate, SpO2 and sleep tracking.',                    price: 4499,  category: 'Electronics', stock: 35,  imagesUrl: img('smartwatch'), ratings: 4.2, numReviews: 86 },
    { name: 'Bluetooth Speaker',    description: 'Portable waterproof speaker with deep bass, 12h playtime.',                       price: 1799,  category: 'Electronics', stock: 60,  imagesUrl: img('speaker'),    ratings: 4.3, numReviews: 64 },
    { name: 'Mechanical Keyboard',  description: 'RGB backlit mechanical keyboard with blue switches.',                             price: 3299,  category: 'Electronics', stock: 25,  imagesUrl: img('keyboard'),   ratings: 4.6, numReviews: 52 },
    { name: "Men's Cotton T-Shirt", description: '100% cotton round-neck t-shirt, regular fit.',                                    price: 499,   category: 'Fashion',     stock: 200, imagesUrl: img('tshirt'),     ratings: 4.0, numReviews: 310 },
    { name: "Women's Denim Jacket", description: 'Classic blue denim jacket with button closure.',                                  price: 1899,  category: 'Fashion',     stock: 40,  imagesUrl: img('jacket'),     ratings: 4.4, numReviews: 75 },
    { name: 'Running Shoes',        description: 'Lightweight running shoes with cushioned sole.',                                  price: 2499,  category: 'Footwear',    stock: 80,  imagesUrl: img('shoes'),      ratings: 4.3, numReviews: 142 },
    { name: 'Leather Wallet',       description: 'Genuine leather bi-fold wallet with RFID protection.',                            price: 699,   category: 'Accessories', stock: 120, imagesUrl: img('wallet'),     ratings: 4.1, numReviews: 58 },
    { name: 'Steel Water Bottle',   description: 'Insulated stainless steel bottle, keeps water cold for 24h. 1 litre.',            price: 599,   category: 'Home',        stock: 150, imagesUrl: img('bottle'),     ratings: 4.5, numReviews: 203 },
    { name: 'Non-Stick Cookware Set', description: '3-piece non-stick cookware set: frying pan, kadai and saucepan.',               price: 2199,  category: 'Home',        stock: 30,  imagesUrl: img('cookware'),   ratings: 4.2, numReviews: 44 },
    { name: 'Atomic Habits (Book)', description: 'Bestselling book by James Clear on building good habits.',                       price: 399,   category: 'Books',       stock: 100, imagesUrl: img('book'),       ratings: 4.8, numReviews: 512 },
    { name: 'Yoga Mat',             description: 'Anti-slip 6mm yoga mat with carrying strap.',                                     price: 899,   category: 'Sports',      stock: 70,  imagesUrl: img('yogamat'),    ratings: 4.4, numReviews: 97 },
    { name: 'Laptop Backpack',          description: 'Water-resistant backpack with padded 15.6" laptop sleeve and USB charging port.', price: 1499, category: 'Accessories', stock: 45,  imagesUrl: img('backpack'),   ratings: 4.5, numReviews: 167 },
    { name: 'Classic Sunglasses',       description: 'UV400 polarized sunglasses with a lightweight black frame.',                       price: 999,  category: 'Accessories', stock: 90,  imagesUrl: img('sunglasses'), ratings: 4.2, numReviews: 88 },
    { name: 'True Wireless Earbuds',    description: 'Bluetooth 5.3 earbuds with charging case, touch controls and 24h total battery.',  price: 1999, category: 'Electronics', stock: 65,  imagesUrl: img('earbuds'),    ratings: 4.3, numReviews: 241 },
    { name: 'Wireless Mouse',           description: 'Silent-click 2.4GHz wireless mouse with ergonomic grip and 12-month battery.',     price: 599,  category: 'Electronics', stock: 110, imagesUrl: img('mouse'),      ratings: 4.4, numReviews: 196 },
    { name: "Women's Leather Handbag",  description: 'Structured faux-leather handbag with top handle and detachable shoulder strap.',   price: 2799, category: 'Fashion',     stock: 20,  imagesUrl: img('handbag'),    ratings: 4.6, numReviews: 61 },
    { name: 'Unisex Pullover Hoodie',   description: 'Soft fleece-lined cotton hoodie with kangaroo pocket. Regular fit.',               price: 1299, category: 'Fashion',     stock: 75,  imagesUrl: img('hoodie'),     ratings: 4.5, numReviews: 134 },
    { name: "Men's Slim Fit Jeans",     description: 'Stretchable denim jeans in a slim fit with a mid-rise waist.',                    price: 1599, category: 'Fashion',     stock: 60,  imagesUrl: img('jeans'),      ratings: 4.1, numReviews: 109 },
    { name: 'Adjustable Desk Lamp',     description: 'Metal desk lamp with adjustable arm and head, E27 bulb holder.',                   price: 1199, category: 'Home',        stock: 35,  imagesUrl: img('lamp'),       ratings: 4.3, numReviews: 47 },
    { name: 'Ceramic Coffee Mug',       description: 'Matte white ceramic mug, 350 ml. Microwave and dishwasher safe.',                  price: 299,  category: 'Home',        stock: 180, imagesUrl: img('mug'),        ratings: 4.6, numReviews: 278 },
    { name: 'Scented Soy Candle',       description: 'Hand-poured soy wax candle in a glass jar. Vanilla & sandalwood, 40h burn time.',   price: 449,  category: 'Home',        stock: 85,  imagesUrl: img('candle'),     ratings: 4.7, numReviews: 152 },
    { name: 'Succulent in Ceramic Pot', description: 'Live low-maintenance succulent in a 4" ceramic pot. Perfect for desks.',           price: 349,  category: 'Home',        stock: 50,  imagesUrl: img('plant'),      ratings: 4.4, numReviews: 73 },
    { name: 'Neoprene Dumbbells (Pair)', description: 'Pair of 2 kg neoprene-coated dumbbells with anti-slip grip.',                     price: 799,  category: 'Sports',      stock: 55,  imagesUrl: img('dumbbells'),  ratings: 4.5, numReviews: 118 },
    { name: 'Football (Size 5)',        description: 'Machine-stitched size 5 football for training and matches on grass or turf.',     price: 699,  category: 'Sports',      stock: 40,  imagesUrl: img('football'),   ratings: 4.2, numReviews: 66 },
    { name: 'Spiral Notebook (A5)',     description: '200-page A5 spiral notebook with thick ruled pages and a sturdy cover.',          price: 199,  category: 'Stationery',  stock: 250, imagesUrl: img('notebook'),   ratings: 4.3, numReviews: 94 },
];

const addresses = {
    'rahul@shopnest.com': { fullName: 'Rahul Sharma', street: '12 MG Road',        city: 'Delhi',     postalCode: '110001', country: 'India' },
    'priya@shopnest.com': { fullName: 'Priya Verma',  street: '45 Park Street',    city: 'Kolkata',   postalCode: '700016', country: 'India' },
    'aman@shopnest.com':  { fullName: 'Aman Gupta',   street: '8 Brigade Road',    city: 'Bengaluru', postalCode: '560001', country: 'India' },
};

// Orders reference users by email and products by name; IDs are filled in at runtime
const orders = [
    { email: 'rahul@shopnest.com', status: 'delivered', items: [{ name: 'Wireless Headphones', qty: 1 }, { name: 'Leather Wallet', qty: 1 }] },
    { email: 'rahul@shopnest.com', status: 'pending',   items: [{ name: 'Atomic Habits (Book)', qty: 2 }] },
    { email: 'priya@shopnest.com', status: 'shipped',   items: [{ name: "Women's Denim Jacket", qty: 1 }, { name: 'Yoga Mat', qty: 1 }] },
    { email: 'priya@shopnest.com', status: 'paid',      items: [{ name: 'Smart Watch', qty: 1 }] },
    { email: 'aman@shopnest.com',  status: 'cancelled', items: [{ name: 'Running Shoes', qty: 1 }, { name: 'Steel Water Bottle', qty: 3 }] },
];

// ---------- Seeding logic ----------

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // 1. Users (password is hashed, same as registerUser does)
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    const userByEmail = {};
    for (const u of users) {
        const doc = await User.findOneAndUpdate(
            { email: u.email },
            { ...u, password: hashedPassword },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );
        userByEmail[u.email] = doc;
    }
    console.log(`Users seeded:    ${users.length}`);

    // 2. Products
    const productByName = {};
    for (const p of products) {
        const doc = await Product.findOneAndUpdate(
            { name: p.name },
            p,
            { upsert: true, returnDocument: 'after', runValidators: true }
        );
        productByName[p.name] = doc;
    }
    console.log(`Products seeded: ${products.length}`);

    // 3. Orders: remove previous seed orders, then recreate them
    await Order.deleteMany({ paymentId: /^seed_/ });
    const orderDocs = orders.map((o, i) => {
        const items = o.items.map(({ name, qty }) => ({
            productId: productByName[name]._id,
            qty,
            price: productByName[name].price,
        }));
        const totalAmount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        return {
            user: userByEmail[o.email]._id,
            items,
            totalAmount,
            address: addresses[o.email],
            paymentId: `seed_pay_${i + 1}`,
            status: o.status,
        };
    });
    await Order.insertMany(orderDocs);
    console.log(`Orders seeded:   ${orderDocs.length}`);

    console.log('\nLogin with any of these (password: ' + SEED_PASSWORD + '):');
    users.forEach((u) => console.log(`  ${u.role.padEnd(5)}  ${u.email}`));
};

// Only run when executed directly (npm run seed), not when another script imports the data
if (require.main === module) {
    seed()
        .then(() => mongoose.disconnect())
        .then(() => process.exit(0))
        .catch(async (err) => {
            console.error('Seeding failed:', err.message);
            await mongoose.disconnect();
            process.exit(1);
        });
}

module.exports = { products };
