const TelegramBot = require('node-telegram-bot-api');
const token = '8247487028:AAF2mCi3oY78mPiUwET8TkmQnkOOiMezZv8';
const bot = new TelegramBot(token, { polling: true });

// Mahsulotlar
const products = [
    { id: 1, name: "Galaxy Z-Fold", price: 999, category: "📱 Elektronika" },
    { id: 2, name: "AirBook Pro M3", price: 1499, category: "💻 Noutbuklar" },
    { id: 3, name: "Watch Ultra 2", price: 499, category: "⌚ Aqlli soatlar" },
    { id: 4, name: "SoundBuds Pro", price: 129, category: "🎧 Audio" },
    { id: 5, name: "RGB Ultimate Mouse", price: 79, category: "🎮 Gaming" },
    { id: 6, name: "Alpha Mirrorless Z7", price: 1999, category: "📸 Kameralar" }
];

// Har bir foydalanuvchining savati
let userCarts = {};

// Start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `🛍️ ASILBEK STORE ga xush kelibsiz!\n\n📦 Mahsulotlarni ko'rish uchun /products\n🛒 Savatni ko'rish uchun /cart\n📞 Buyurtma berish uchun /order`);
});

// Mahsulotlar
bot.onText(/\/products/, (msg) => {
    const chatId = msg.chat.id;
    let text = "📦 MAHSULOTLAR:\n\n";
    products.forEach(p => {
        text += `${p.id}. ${p.name} - $${p.price}\n`;
    });
    text += "\nMahsulot sotib olish uchun: /buy [id]";
    bot.sendMessage(chatId, text);
});

// Mahsulot sotib olish
bot.onText(/\/buy (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const productId = parseInt(match[1]);
    const product = products.find(p => p.id === productId);
    
    if(!product) {
        bot.sendMessage(chatId, "❌ Bunday mahsulot topilmadi!");
        return;
    }
    
    if(!userCarts[chatId]) userCarts[chatId] = [];
    
    const existing = userCarts[chatId].find(item => item.id === productId);
    if(existing) {
        existing.quantity++;
    } else {
        userCarts[chatId].push({ ...product, quantity: 1 });
    }
    
    bot.sendMessage(chatId, `✅ ${product.name} savatga qo'shildi!\n🛒 /cart - Savatni ko'rish`);
});

// Savatni ko'rish
bot.onText(/\/cart/, (msg) => {
    const chatId = msg.chat.id;
    const cart = userCarts[chatId] || [];
    
    if(cart.length === 0) {
        bot.sendMessage(chatId, "🛒 Savatingiz bo'sh!\n📦 /products - Mahsulotlar");
        return;
    }
    
    let text = "🛒 SAVATINGIZ:\n\n";
    let total = 0;
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        text += `${item.name} x ${item.quantity} = $${subtotal}\n`;
    });
    text += `\n💰 Jami: $${total}`;
    bot.sendMessage(chatId, text);
});

// Buyurtma berish
bot.onText(/\/order/, (msg) => {
    const chatId = msg.chat.id;
    const cart = userCarts[chatId] || [];
    
    if(cart.length === 0) {
        bot.sendMessage(chatId, "❌ Savatingiz bo'sh! /products");
        return;
    }
    
    bot.sendMessage(chatId, "📞 Buyurtma berish uchun quyidagi ma'lumotlarni yuboring:\n\nIsmingiz, Telefon raqamingiz, Manzilingiz\n\nMasalan:\nAsilbek, +998901234567, Toshkent sh. Chilonzor 12-uy");
    
    // Holatni saqlash
    userCarts[chatId] = { ...cart, waitingForOrder: true };
});

// Matnlarni qabul qilish (buyurtma ma'lumotlari)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if(!text) return;
    if(text.startsWith('/')) return;
    
    const cart = userCarts[chatId];
    if(cart && cart.waitingForOrder) {
        // Buyurtma ma'lumotlarini qabul qilish
        const [name, phone, address] = text.split(',');
        
        if(!name || !phone || !address) {
            bot.sendMessage(chatId, "❌ Noto'g'ri format! Iltimos quyidagi formatda yozing:\n\nIsm, Telefon, Manzil");
            return;
        }
        
        let itemsList = "";
        let total = 0;
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            itemsList += `${item.name} x ${item.quantity} = $${subtotal}\n`;
        });
        
        const orderText = `🆕 YANGI BUYURTMA!\n\n👤 Mijoz: ${name.trim()}\n📞 Tel: ${phone.trim()}\n📍 Manzil: ${address.trim()}\n\n📦 Mahsulotlar:\n${itemsList}\n💰 Jami: $${total}`;
        
        // Sizga xabar yuborish
        await bot.sendMessage("ASILBEKMC", orderText); // Sizning @username
        await bot.sendMessage(chatId, "✅ Buyurtmangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.\n\nRahmat! 🛍️");
        
        // Savatni tozalash
        delete userCarts[chatId];
    }
});

// Help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `📖 Buyruqlar:\n/start - Boshlash\n/products - Mahsulotlar\n/buy [id] - Sotib olish\n/cart - Savat\n/order - Buyurtma\n/help - Yordam`);
});

console.log('Bot ishga tushdi...');
