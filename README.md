// server.js (Node.js + Express.js)
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/digital_wallet', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
});
const User = mongoose.model('User', userSchema);

// Transaction Schema and Model
const transactionSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Routes
// Register a new user
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'User registration failed' });
    }
});

// Login a user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.status(200).json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Add funds to wallet
app.post('/add-funds', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const user = await User.findById(userId);
        if (user) {
            user.balance += amount;
            await user.save();
            res.status(200).json({ message: 'Funds added successfully', balance: user.balance });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add funds' });
    }
});

// Transfer funds
app.post('/transfer', async (req, res) => {
    const { senderId, receiverEmail, amount } = req.body;
    try {
        const sender = await User.findById(senderId);
        const receiver = await User.findOne({ email: receiverEmail });

        if (!sender || !receiver) {
            return res.status(404).json({ error: 'Sender or receiver not found' });
        }

        if (sender.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        sender.balance -= amount;
        receiver.balance += amount;
        await sender.save();
        await receiver.save();

        const transaction = new Transaction({
            sender: sender._id,
            receiver: receiver._id,
            amount,
        });
        await transaction.save();

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        res.status(500).json({ error: 'Transfer failed' });
    }
});

// Fetch transactions
app.get('/transactions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const transactions = await Transaction.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).populate('sender receiver', 'name email');
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
