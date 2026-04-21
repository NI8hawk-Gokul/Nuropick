const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send OTP for email verification
 * @param {string} email - Recipient email
 * @param {string} otp - The 6-digit OTP code
 * @param {string} username - User's name for personalization
 */
const sendOTPEmail = async (email, otp, username) => {
    try {
        const isPlaceholder = !process.env.EMAIL_USER || 
                             process.env.EMAIL_USER.includes('your_gmail') || 
                             !process.env.EMAIL_PASS || 
                             process.env.EMAIL_PASS.length < 8;

        if (isPlaceholder) {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 [DEVELOPMENT MODE] EMAIL DELIVERY FALLBACK');
            console.log(`📧 Destination: ${email}`);
            console.log(`🔒 OTP Code: ${otp}`);
            console.log(`👤 User: ${username}`);
            console.log('='.repeat(60) + '\n');
            return true;
        }

        const mailOptions = {
            from: `"NeuroPick" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔒 Your Verification Code - NeuroPick',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2D3436; font-size: 28px; margin: 0;">NeuroPick</h1>
                        <p style="color: #636E72; font-size: 14px;">AI-Powered Review Analysis</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%); padding: 40px; border-radius: 10px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 20px; opacity: 0.9;">Hello ${username},</h2>
                        <p style="margin: 10px 0 30px 0; font-size: 16px;">Here is your verification code:</p>
                        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; font-size: 42px; font-weight: 800; letter-spacing: 8px; border: 2px dashed rgba(255,255,255,0.4);">
                            ${otp}
                        </div>
                    </div>
                    <div style="margin-top: 30px; color: #636E72; line-height: 1.6; text-align: center;">
                        <p>This code will expire in <strong>10 minutes</strong> for your security.</p>
                        <p style="font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #DFE6E9; margin: 40px 0;">
                    <div style="text-align: center; font-size: 12px; color: #B2BEC3;">
                        <p>&copy; 2024 NeuroPick AI. Discover the best, supported by data.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error.message);
        return false;
    }
};

/**
 * Send a celebratory Welcome Email
 */
const sendWelcomeEmail = async (email, username) => {
    try {
        const mailOptions = {
            from: `"NeuroPick" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🚀 Welcome to NeuroPick - Let\'s Analyze!',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 15px; text-align: center; border: 1px solid #e1e1e1;">
                        <div style="font-size: 50px; margin-bottom: 20px;">🎒</div>
                        <h1 style="color: #2D3436; margin: 0;">Welcome, ${username}!</h1>
                        <p style="color: #636E72; font-size: 18px; margin-top: 10px;">You're now part of the smartest review community.</p>
                        
                        <div style="margin: 40px 0; border-left: 4px solid #6C5CE7; padding-left: 20px; text-align: left;">
                            <h3 style="color: #2D3436; margin: 0;">What's Next?</h3>
                            <ul style="color: #636E72; line-height: 2; padding-left: 20px;">
                                <li><strong>Paste a URL:</strong> Analyze any product link instantly.</li>
                                <li><strong>Get Insights:</strong> See sentiment, key phrases, and fake detections.</li>
                                <li><strong>Save Reports:</strong> Track products you're interested in.</li>
                            </ul>
                        </div>

                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
                           style="display: inline-block; background-color: #6C5CE7; color: white; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);">
                           Start Your First Analysis
                        </a>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ Error sending Welcome email:', error.message);
        return false;
    }
};

/**
 * Send Analysis Report Completion
 */
const sendAnalysisReport = async (email, username, productData) => {
    try {
        const mailOptions = {
            from: `"NeuroPick" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `📊 Analysis Ready: ${productData.name}`,
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #2D3436;">
                    <h2 style="color: #6C5CE7;">Your AI Analysis is Complete!</h2>
                    <p>Hello ${username}, we've finished crunching the numbers for <strong>${productData.name}</strong>.</p>
                    
                    <div style="background: #ffffff; border: 1px solid #e1e1e1; padding: 25px; border-radius: 12px; margin: 25px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span>Overall Sentiment:</span>
                            <span style="font-weight: bold; color: ${productData.sentiment > 70 ? '#00B894' : '#FF7675'};">
                                ${productData.sentiment}% Positive
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span>Review Credibility:</span>
                            <span style="font-weight: bold;">${productData.credibility}</span>
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                            <p style="font-size: 14px; font-style: italic; color: #636E72;">"${productData.summary}"</p>
                        </div>
                    </div>

                    <a href="${process.env.CLIENT_URL}/products/${productData.id}" 
                       style="display: block; text-align: center; background: #2D3436; color: white; padding: 12px; text-decoration: none; border-radius: 8px;">
                       View Full Analysis
                    </a>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ Error sending Analysis Report:', error.message);
        return false;
    }
};

/**
 * Send Password Reset link
 */
const sendPasswordReset = async (email, username, resetToken) => {
    try {
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: `"NeuroPick Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔑 Password Reset Request - NeuroPick',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff; border-radius: 12px; border: 1px solid #e1e1e1;">
                    <h2 style="color: #2D3436; text-align: center;">Password Reset Request</h2>
                    <p>Hello ${username},</p>
                    <p>We received a request to reset your password for your NeuroPick account. Click the button below to set a new password:</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #FF7675; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                           Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #636E72; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please secure your account.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #B2BEC3; text-align: center;">
                        <p>Trouble with the button? Copy this link: <br> ${resetUrl}</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ Error sending Password Reset email:', error.message);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendAnalysisReport,
    sendPasswordReset
};
