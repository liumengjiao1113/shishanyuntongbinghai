// utils/rsa.js
import JSEncrypt from './jsencrypt';

// 加密函数
export function encrypt(txt, publicKey) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  return encryptor.encrypt(txt);
}

// 解密函数（如果需要）
export function decrypt(txt, privateKey) {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(privateKey);
  return encryptor.decrypt(txt);
}