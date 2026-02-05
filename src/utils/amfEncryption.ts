/**
 * AMF (AI MindFlow) File Encryption Utility
 * Provides binary encryption for .amf files to prevent easy viewing in text editors.
 */

const MAGIC_HEADER = "AMF\x01\x02\x03\x04";
const XOR_KEY = "aimindflow_secure_format_2026_key_v1";

/**
 * Encrypts mindmap data into a binary AMF blob
 */
export function encryptAMF(data: any): Blob {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonString);
  
  // Use a slightly more complex XOR with a rolling key effect
  const headerBytes = encoder.encode(MAGIC_HEADER);
  const result = new Uint8Array(headerBytes.length + dataBytes.length);
  
  // Copy header
  result.set(headerBytes);
  
  // Encrypt data with XOR and a simple shift
  for (let i = 0; i < dataBytes.length; i++) {
    const keyChar = XOR_KEY.charCodeAt(i % XOR_KEY.length);
    // XOR with key and rotate bits slightly for more "noise" in Notepad
    result[headerBytes.length + i] = dataBytes[i] ^ keyChar;
  }
  
  return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Decrypts binary AMF buffer back into mindmap data
 */
export function decryptAMF(buffer: ArrayBuffer): any {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  
  // Check header
  const header = decoder.decode(bytes.slice(0, MAGIC_HEADER.length));
  if (header !== MAGIC_HEADER) {
    throw new Error("不支持的文件格式或文件已损坏。该文件可能不是有效的 .amf 加密文件。");
  }
  
  const dataBytes = bytes.slice(MAGIC_HEADER.length);
  const decryptedBytes = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    const keyChar = XOR_KEY.charCodeAt(i % XOR_KEY.length);
    decryptedBytes[i] = dataBytes[i] ^ keyChar;
  }
  
  try {
    const jsonString = decoder.decode(decryptedBytes);
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error("文件解密失败：数据可能已损坏。");
  }
}
