import { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/[a-zA-Z]/, "パスワードには英字を含めてください")
    .regex(/[0-9]/, "パスワードには数字を含めてください"),
  name: z.string().min(1, "お名前を入力してください"),
  confirmPassword: z.string().optional(),
  turnstileToken: z.string().min(1, "認証に失敗しました"),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
  turnstileToken: z.string().min(1, "認証に失敗しました"),
});

async function verifyTurnstile(token: string, remoteIP?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not set, skipping verification");
    return true;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: remoteIP,
      }),
    });

    const data = await response.json() as { success: boolean };
    return data.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

const BCRYPT_ROUNDS = 12;

export function registerEmailAuthRoutes(app: Express): void {
  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "入力内容に問題があります",
          errors: validation.error.flatten().fieldErrors 
        });
      }

      const { email, password, name, turnstileToken } = validation.data;

      // Verify Turnstile token
      const remoteIP = req.headers["cf-connecting-ip"] as string || 
                       req.headers["x-forwarded-for"] as string || 
                       req.socket.remoteAddress;
      const isTurnstileValid = await verifyTurnstile(turnstileToken, remoteIP);
      if (!isTurnstileValid) {
        return res.status(400).json({ message: "認証に失敗しました。もう一度お試しください" });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ message: "登録に失敗しました。もう一度お試しください" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: passwordHash,
          firstName: name,
        })
        .returning();

      // Set up session
      const sessionUser = {
        provider: "local",
        userId: newUser.id,
        email: newUser.email,
        claims: {
          sub: newUser.id,
          email: newUser.email,
        },
      };

      (req as any).login(sessionUser, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "セッションの作成に失敗しました" });
        }
        
        res.status(201).json({
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "登録に失敗しました" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "入力内容に問題があります",
          errors: validation.error.flatten().fieldErrors 
        });
      }

      const { email, password, turnstileToken } = validation.data;

      // Verify Turnstile token
      const remoteIP = req.headers["cf-connecting-ip"] as string || 
                       req.headers["x-forwarded-for"] as string || 
                       req.socket.remoteAddress;
      const isTurnstileValid = await verifyTurnstile(turnstileToken, remoteIP);
      if (!isTurnstileValid) {
        return res.status(400).json({ message: "認証に失敗しました。もう一度お試しください" });
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.password) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }

      // Set up session
      const sessionUser = {
        provider: "local",
        userId: user.id,
        email: user.email,
        claims: {
          sub: user.id,
          email: user.email,
        },
      };

      (req as any).login(sessionUser, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "ログインに失敗しました" });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  // Email auth logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    const user = (req as any).user;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "ログアウトに失敗しました" });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie("connect.sid");
        res.json({ message: "ログアウトしました" });
      });
    });
  });
}
