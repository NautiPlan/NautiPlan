import CryptoJS from "crypto-js";

interface SignHeaders {
  "X-AI-GATEWAY-APP-ID": string;
  "X-AI-GATEWAY-TIMESTAMP": string;
  "X-AI-GATEWAY-NONCE": string;
  "X-AI-GATEWAY-SIGNED-HEADERS": string;
  "X-AI-GATEWAY-SIGNATURE": string;
}

interface QueryParams {
  [key: string]: string | number | boolean;
}

/**
 * 生成随机字符串
 * @param length 字符串长度，默认为8
 * @returns 随机字符串
 */
function genNonce(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成规范化查询字符串
 * @param params 查询参数对象
 * @returns 规范化的查询字符串
 */
function genCanonicalQueryString(params?: QueryParams): string {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const sortedKeys = Object.keys(params).sort();
  const encodedPairs: string[] = [];

  sortedKeys.forEach((key) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(String(params[key]));
    encodedPairs.push(`${encodedKey}=${encodedValue}`);
  });

  return encodedPairs.join("&");
}

/**
 * 生成签名
 * @param appSecret 应用密钥
 * @param signingString 待签名字符串
 * @returns Base64编码的签名
 */
function genSignature(appSecret: string, signingString: string): string {
  const hash = CryptoJS.HmacSHA256(signingString, appSecret);
  return CryptoJS.enc.Base64.stringify(hash);
}

/**
 * 生成签名请求头
 * @param appId 应用ID
 * @param appKey 应用密钥
 * @param method HTTP方法
 * @param uri 请求URI
 * @param query 查询参数
 * @returns 包含签名信息的请求头对象
 */
export function genSignHeaders(appId: string, appKey: string, method: string, uri: string, query?: QueryParams): SignHeaders {
  const normalizedMethod = method.toUpperCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = genNonce();
  const canonicalQueryString = genCanonicalQueryString(query);

  const signedHeadersString = `x-ai-gateway-app-id:${appId}\nx-ai-gateway-timestamp:${timestamp}\nx-ai-gateway-nonce:${nonce}`;

  const signingString = [normalizedMethod, uri, canonicalQueryString, appId, timestamp, signedHeadersString].join("\n");

  const signature = genSignature(appKey, signingString);

  return {
    "X-AI-GATEWAY-APP-ID": appId,
    "X-AI-GATEWAY-TIMESTAMP": timestamp,
    "X-AI-GATEWAY-NONCE": nonce,
    "X-AI-GATEWAY-SIGNED-HEADERS": "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
    "X-AI-GATEWAY-SIGNATURE": signature,
  };
}

export default genSignHeaders;
