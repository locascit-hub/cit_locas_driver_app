import { jwtVerify } from "jose";

export default async function decryptJWT(token) {
  try {
    const secret = new TextEncoder().encode(process.env.REACT_APP_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error("Invalid token");
  }
}
