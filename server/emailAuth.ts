import { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { users, passwordResetTokens } from "@shared/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { sendPasswordResetEmail } from "./email";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/[a-zA-Z]/, "パスワードには英字を含めてください")
    .regex(/[0-9]/, "パスワードには数字を含めてください"),
  name: z.string().min(1, "お名前を入力してください"),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

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

      const { email, password, name } = validation.data;

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

      const { email, password } = validation.data;

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

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "メールアドレスを入力してください" });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim().toLowerCase()));

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "リセットリンクを送信しました" });
      }

      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Build reset link
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'http://localhost:5000';
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      const emailSent = await sendPasswordResetEmail(email, resetLink);
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }

      res.json({ message: "リセットリンクを送信しました" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });

  // Verify reset token endpoint
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.json({ valid: false });
      }

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.usedAt)
          )
        );

      res.json({ valid: !!resetToken });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.json({ valid: false });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "無効なリンクです" });
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ message: "パスワードを入力してください" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "パスワードは8文字以上で入力してください" });
      }

      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ message: "パスワードには英字と数字を含めてください" });
      }

      // Find valid token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.usedAt)
          )
        );

      if (!resetToken) {
        return res.status(400).json({ message: "リンクが無効か有効期限が切れています" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Update user password
      await db
        .update(users)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ message: "パスワードを変更しました" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "エラーが発生しました" });
    }
  });
}
