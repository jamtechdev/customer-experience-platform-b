import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { injectable } from 'inversify';
import User from '../models/User';
import PasswordReset from '../models/PasswordReset';
import { EmailService } from './EmailService';
import { JWT_SECRET, JWT_EXPIRES_IN, UserRole } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    name?: string;
    department?: string;
    permissions?: string[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

@injectable()
export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || UserRole.VIEWER,
    });

    const accessToken = this.generateToken(user.id);
    const refreshToken = this.generateToken(user.id); // In production, use separate refresh token logic
    const expiresIn = 86400; // 24 hours in seconds

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        department: 'Yeni Kullanıcı',
        permissions: this.getDefaultPermissions(user.role),
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = this.generateToken(user.id);
    const refreshToken = this.generateToken(user.id); // In production, use separate refresh token logic
    const expiresIn = 86400; // 24 hours in seconds

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        department: 'Dijital Bankacılık',
        permissions: this.getDefaultPermissions(user.role),
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private getDefaultPermissions(role: UserRole): string[] {
    // Map roles to permissions based on available UserRole enum values
    if (role === UserRole.ADMIN) {
      return ['feedback.read', 'feedback.write', 'reports.read', 'reports.write', 'admin.access', 'users.manage'];
    }
    if (role === UserRole.ANALYST) {
      return ['feedback.read', 'feedback.write', 'reports.read'];
    }
    // Default for VIEWER and other roles
    return ['feedback.read', 'reports.read'];
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await User.findOne({ where: { email: data.email } });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      // Still return success to prevent email enumeration
      return { message: 'If the email exists, a password reset code has been sent.' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate any existing OTPs for this email
    await PasswordReset.update(
      { used: true },
      { where: { email: data.email, used: false } }
    );

    // Create new password reset record
    await PasswordReset.create({
      email: data.email,
      otp,
      expiresAt,
      used: false,
    });

    // Send email with OTP
    try {
      await this.emailService.sendPasswordResetOTP(
        data.email,
        otp,
        user.firstName
      );
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }

    return { message: 'If the email exists, a password reset code has been sent.' };
  }

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    // Find valid, unused OTP
    const passwordReset = await PasswordReset.findOne({
      where: {
        email: data.email,
        otp: data.otp,
        used: false,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!passwordReset) {
      throw new AppError('Invalid or expired OTP code', 400);
    }

    // Check if OTP has expired
    if (new Date() > passwordReset.expiresAt) {
      throw new AppError('OTP code has expired. Please request a new one.', 400);
    }

    // Find user
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate new password
    if (data.newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update user password
    await user.update({ password: hashedPassword });

    // Mark OTP as used
    await passwordReset.update({ used: true });

    return { message: 'Password has been reset successfully' };
  }

  private generateToken(userId: number): string {
    if (!JWT_SECRET) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }
    const secret = String(JWT_SECRET);
    const expiresIn = String(JWT_EXPIRES_IN);
    return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
  }
}
