import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { injectable } from 'inversify';
import User from '../models/User';
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

@injectable()
export class AuthService {
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

  private generateToken(userId: number): string {
    if (!JWT_SECRET) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }
    const secret = String(JWT_SECRET);
    const expiresIn = String(JWT_EXPIRES_IN);
    return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
  }
}
