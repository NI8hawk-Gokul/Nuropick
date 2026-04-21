const { sendOTPEmail } = require('../services/emailService');

async function main() {
    const email = 'gokul68799@gmail.com';
    const otp = '200706';
    const username = 'Admin';
    
    console.log(`\n🚀 Manually triggering OTP send sequence...`);
    console.log(`📧 Target: ${email}`);
    console.log(`🔒 Code: ${otp}\n`);
    
    const success = await sendOTPEmail(email, otp, username);
    
    if (success) {
        console.log('\n✅ Manual trigger complete.');
    } else {
        console.log('\n❌ Manual trigger failed.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});


