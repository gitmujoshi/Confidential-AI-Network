const { ethers } = require('ethers');

function generateMnemonic() {
  try {
    // Generate a random mnemonic (12 words)
    const mnemonic = ethers.Wallet.createRandom().mnemonic;
    
    console.log('🔐 Secure 12-Word Recovery Phrase Generated');
    console.log('==========================================');
    console.log('');
    console.log('IMPORTANT: Write this down and keep it safe!');
    console.log('Never share this phrase with anyone.');
    console.log('');
    console.log('📝 Your Recovery Phrase:');
    console.log('------------------------');
    console.log(mnemonic.phrase);
    console.log('');
    console.log('🔢 Word List (numbered for easy verification):');
    console.log('---------------------------------------------');
    
    const words = mnemonic.phrase.split(' ');
    words.forEach((word, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${word}`);
    });
    
    console.log('');
    console.log('⚠️  SECURITY WARNINGS:');
    console.log('=====================');
    console.log('• Write this phrase on paper (not digital)');
    console.log('• Store it in a secure, fireproof location');
    console.log('• Never share it with anyone');
    console.log('• Never enter it on suspicious websites');
    console.log('• This phrase can recover your entire wallet');
    console.log('');
    console.log('📱 How to use in MetaMask:');
    console.log('==========================');
    console.log('1. Open MetaMask');
    console.log('2. Click "Import Account"');
    console.log('3. Select "Import using account seed phrase"');
    console.log('4. Enter the 12 words above');
    console.log('5. Set a strong password');
    console.log('6. Complete the import');
    console.log('');
    console.log('✅ Your wallet is now ready to use!');
    
    return mnemonic;
  } catch (error) {
    console.error('Error generating mnemonic:', error);
    return null;
  }
}

// Generate and display the mnemonic
const mnemonic = generateMnemonic();

if (mnemonic) {
  console.log('');
  console.log('🔍 Additional Information:');
  console.log('==========================');
  console.log(`Entropy: ${mnemonic.entropy}`);
  console.log(`Path: ${mnemonic.path}`);
  console.log(`Locale: ${mnemonic.locale}`);
} 