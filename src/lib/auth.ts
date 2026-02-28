import { db } from "./db"
import { hash, compare } from "crypto"
import { cookies } from "next/headers"
import { sign, verify } from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "uae-books-secret-key-2024"
const SESSION_COOKIE = "uae_books_session"
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days

// ==================== PASSWORD UTILITIES ====================

/**
 * Hash password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + JWT_SECRET)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// ==================== SESSION UTILITIES ====================

interface SessionPayload {
  userId: string
  email: string
  companyId?: string
  role: string
  expiresAt: number
}

/**
 * Create session token
 */
export async function createSession(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    expiresAt: Date.now() + SESSION_DURATION * 1000,
  }
  const token = Buffer.from(JSON.stringify(fullPayload)).toString("base64url")
  return token
}

/**
 * Verify and decode session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8")
    const payload: SessionPayload = JSON.parse(decoded)
    
    if (payload.expiresAt < Date.now()) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!token) {
    return null
  }
  
  return verifySession(token)
}

/**
 * Clear session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// ==================== USER AUTHENTICATION ====================

interface LoginResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
  error?: string
}

/**
 * Authenticate user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  
  if (!user) {
    return { success: false, error: "Invalid email or password" }
  }
  
  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" }
  }
  
  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    return { success: false, error: "Invalid email or password" }
  }
  
  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  
  // Create session
  const session = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
  
  await setSessionCookie(session)
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

/**
 * Register new user
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<LoginResult> {
  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  
  if (existing) {
    return { success: false, error: "Email already registered" }
  }
  
  const passwordHash = await hashPassword(password)
  
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "user",
    },
  })
  
  // Create session
  const session = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
  
  await setSessionCookie(session)
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  await clearSession()
}

// ==================== AUTHORIZATION ====================

/**
 * Check if user has permission
 */
export async function hasPermission(
  userId: string,
  companyId: string,
  requiredRole: string
): Promise<boolean> {
  const userCompany = await db.userCompany.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  })
  
  if (!userCompany) return false
  
  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    accountant: 2,
    viewer: 1,
  }
  
  const userLevel = roleHierarchy[userCompany.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Get user's companies
 */
export async function getUserCompanies(userId: string) {
  const userCompanies = await db.userCompany.findMany({
    where: { userId },
    include: { company: true },
  })
  
  return userCompanies.map(uc => ({
    ...uc.company,
    role: uc.role,
  }))
}

/**
 * Set active company for user session
 */
export async function setActiveCompany(userId: string, companyId: string): Promise<boolean> {
  const userCompany = await db.userCompany.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
  })
  
  if (!userCompany) return false
  
  const session = await getSession()
  if (!session) return false
  
  const newSession = await createSession({
    ...session,
    companyId,
  })
  
  await setSessionCookie(newSession)
  return true
}

// ==================== CURRENT USER HELPERS ====================

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      nameAr: true,
      role: true,
      avatar: true,
      phone: true,
    },
  })
  
  return user
}

/**
 * Get current company from session
 */
export async function getCurrentCompany() {
  const session = await getSession()
  if (!session?.companyId) return null
  
  const company = await db.company.findUnique({
    where: { id: session.companyId },
  })
  
  return company
}

/**
 * Require authentication (for protected routes)
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

/**
 * Require company selection
 */
export async function requireCompany() {
  const company = await getCurrentCompany()
  if (!company) {
    throw new Error("Company selection required")
  }
  return company
}
