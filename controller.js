const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const { sendEmail } = require('../utils/sendEmail');

exports.register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const user = new User({ firstName, lastName, email, password });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const activationUrl = `http://localhost:3000/activate/${token}`;
        await sendEmail(email, 'Activate your account', activationUrl);

        res.status(201).json({ message: 'User registered. Activation email sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};

exports.activateAccount = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = true;
        await user.save();

        res.json({ message: 'Account activated' });
    } catch (error) {
        res.status(500).json({ message: 'Activation failed', error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password))
            return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isActive)
            return res.status(403).json({ message: 'Account not activated' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const token = nanoid(32);
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password/${token}`;
        await sendEmail(email, 'Reset your password', resetUrl);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Forgot password failed', error });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = password;
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Reset password failed', error });
    }
};
