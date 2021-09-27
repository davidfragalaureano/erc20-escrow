
const wallet = require('ethereumjs-wallet').default;
 
const [,,rawPrivKey] = process.argv;

let addressData = wallet.fromPrivateKey(Buffer.from(rawPrivKey, 'hex'));
console.log(`Publlic key = ${addressData.getPublicKeyString()}`);
console.log(`Private key = ${addressData.getPrivateKeyString()}`);
console.log(`Address = ${addressData.getAddressString()}`);

