const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sendOTPEmail, sendPasswordReset } = require('../services/emailService');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.get('id'),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate a 6-digit numeric OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, and password'
            });
        }

        const { Op } = require('sequelize');
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt); // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName
        });

        // ── Auto-generate & send email verification OTP ──────────
        try {
            const otp = generateOTP();
            const otpSalt = await bcrypt.genSalt(10);
            const hashedOTP = await bcrypt.hash(otp, otpSalt);
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            await user.update({ otpCode: hashedOTP, otpExpiry });
            await sendOTPEmail(user.email, otp, user.username);
            console.log(`📧 Verification OTP sent to ${user.email}`);
        } catch (emailError) {
            // Email failure must not block registration
            console.warn('⚠️ Could not send verification email:', emailError.message);
        }

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                role: user.role,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'otpCode', 'otpExpiry'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, bio, avatar, emailNotifications, phone, location } = req.body;

        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
        if (phone !== undefined) updateData.phone = phone;
        if (location !== undefined) updateData.location = location;

        await User.update(updateData, {
            where: { id: req.user.id }
        });

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'otpCode', 'otpExpiry'] }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP email for email verification
// @access  Private
router.post('/send-otp', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        // Hash the OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        // Set OTP expiry to 10 minutes from now
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        // Save hashed OTP and expiry to user
        await user.update({
            otpCode: hashedOTP,
            otpExpiry: expiry
        });

        // Send OTP email
        await sendOTPEmail(user.email, otp, user.username);

        res.json({
            success: true,
            message: `Verification code sent to ${user.email}`
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error sending verification email'
        });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and mark email as verified
// @access  Private
router.post('/verify-otp', authMiddleware, async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: 'Please provide the OTP code' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, message: 'Email is already verified' });
        }

        if (!user.otpCode || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new code.'
            });
        }

        // Check if OTP has expired
        if (new Date() > new Date(user.otpExpiry)) {
            await user.update({ otpCode: null, otpExpiry: null });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new code.'
            });
        }

        // Compare submitted OTP with hashed stored OTP
        const isMatch = await bcrypt.compare(otp.toString(), user.otpCode);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP code. Please try again.'
            });
        }

        // Mark email as verified, clear OTP fields
        await user.update({
            emailVerified: true,
            otpCode: null,
            otpExpiry: null
        });

        // Issue a fresh token with updated info
        const newToken = generateToken(user);

        res.json({
            success: true,
            message: '🎉 Email verified successfully!',
            token: newToken,
            emailVerified: true
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all password fields'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password: hashedPassword });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset token
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Don't reveal if user exists for security, but return success
            return res.json({
                success: true,
                message: 'If an account exists with that email, a reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash and set resetPasswordToken
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expiry (1 hour from now)
        const expireDate = new Date(Date.now() + 60 * 60 * 1000);

        await user.update({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: expireDate
        });

        // Send email
        const emailSent = await sendPasswordReset(user.email, user.username, resetToken);

        if (!emailSent) {
            await user.update({
                resetPasswordToken: null,
                resetPasswordExpire: null
            });
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

        res.json({
            success: true,
            message: 'If an account exists with that email, a reset link has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide and confirm new password' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Hash token to compare with database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpire: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset fields
        await user.update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpire: null
        });

        res.json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
});

// ─── Admin Routes ────────────────────────────────────────────────
const { adminMiddleware } = require('../middleware/auth');

// @route   GET /api/auth/admin/users
// @desc    Get all users with verification status
// @access  Admin only
router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { UserReward } = require('../models');
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'firstName', 'lastName',
                         'emailVerified', 'role', 'reviewCount', 'points', 'created_at'],
            order: [
                ['created_at', 'DESC']
            ]
        });

        const totalRewards = await UserReward.count();

        const stats = {
            total: users.length,
            verified: users.filter(u => u.emailVerified).length,
            pending: users.filter(u => !u.emailVerified).length,
            totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0),
            claimedRewards: totalRewards
        };

        res.json({
            success: true,
            users,
            stats
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
    }
});

// @route   PUT /api/auth/admin/verify/:id
// @desc    Admin approves / verifies a user account
// @access  Admin only
router.put('/admin/verify/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { verified } = req.body; // true = approve, false = revoke

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.update({
            emailVerified: verified !== false,  // default to true
            otpCode: null,
            otpExpiry: null
        });

        res.json({
            success: true,
            message: verified === false
                ? `Account verification revoked for ${user.username}`
                : `✅ ${user.username}'s account has been verified`,
            user: {
                id: user.id,
                username: user.username,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
    }
});

// @route   PUT /api/auth/admin/verify-all
// @desc    Admin approves ALL pending users at once
// @access  Admin only
router.put('/admin/verify-all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [count] = await User.update(
            { emailVerified: true, otpCode: null, otpExpiry: null },
            { where: { emailVerified: false } }
        );

        res.json({
            success: true,
            message: `✅ ${count} user account(s) verified`,
            count
        });
    } catch (error) {
        console.error('Admin verify-all error:', error);
        res.status(500).json({ success: false, message: 'Error verifying all users', error: error.message });
    }
});

// @route   DELETE /api/auth/admin/user/:id
// @desc    Admin deletes a user account
// @access  Admin only
router.delete('/admin/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent self-deletion
        if (user.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
        }

        await user.destroy();
        res.json({ success: true, message: `Account for ${user.username} has been deleted permanently` });
    } catch (error) {
        console.error('Admin delete error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
    }
});

// @route   PUT /api/auth/admin/user/:id/points
// @desc    Admin manually adjusts user points
// @access  Admin only
router.put('/admin/user/:id/points', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { points } = req.body;

        if (points === undefined || isNaN(points)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid point value' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.update({ points: parseInt(points) });
        res.json({ 
            success: true, 
            message: `Updated points for ${user.username} to ${points}`,
            points: user.points
        });
    } catch (error) {
        console.error('Admin points error:', error);
        res.status(500).json({ success: false, message: 'Error updating points', error: error.message });
    }
});

module.exports = router;
