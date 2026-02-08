import { SignJWT, jwtVerify } from 'jose'

const KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secret_key_change_me',
)
export const COOKIE_NAME = 'session_token'

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(KEY)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, KEY, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}
