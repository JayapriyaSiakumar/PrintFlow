import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, storeName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email address, and password are required.',
      });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // MANDATE: Public registration must NEVER allow someone to register as "admin".
    // Default role must always be "user".
    const assignedRole = 'user';

    // If MongoDB is connected:
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: emailTrimmed });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: emailTrimmed,
        password, // Pre-save hook hashes with bcrypt
        role: assignedRole,
        storeName: storeName?.trim() || `${name.trim()}'s Collection`,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(emailTrimmed)}`,
      });

      const userResponse = {
        id: newUser.id || newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        storeName: newUser.storeName,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt.toISOString(),
      };

      const token = generateToken(userResponse);

      return res.status(201).json({
        success: true,
        token,
        user: userResponse,
        message: 'Account created successfully.',
      });
    }

    // Fallback store
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === emailTrimmed);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: emailTrimmed,
      role: 'user' as const,
      storeName: storeName?.trim() || `${name.trim()}'s Collection`,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(emailTrimmed)}`,
      createdAt: new Date().toISOString(),
    };

    memoryStore.users.push({ ...newUser, passwordHash });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      user: newUser,
      message: 'Account created successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Registration failed.' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // If MongoDB connected:
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: emailTrimmed }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
      }

      const userResponse = {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
      };

      const token = generateToken(userResponse);

      return res.json({
        success: true,
        token,
        user: userResponse,
        message: 'Logged in successfully.',
      });
    }

    // Fallback store
    const userRecord = memoryStore.users.find((u) => u.email.toLowerCase() === emailTrimmed);
    if (!userRecord || !bcrypt.compareSync(password, userRecord.passwordHash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      storeName: userRecord.storeName,
      avatar: userRecord.avatar,
      createdAt: userRecord.createdAt,
    };

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user,
      message: 'Logged in successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Login failed.' });
  }
};

/**
 * @desc    Logout user / clear session
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    if (mongoose.connection.readyState === 1 && req.user.id) {
      const user = await User.findById(req.user.id).select('-password');
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user.id || user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            storeName: user.storeName,
            avatar: user.avatar,
            createdAt: user.createdAt?.toISOString(),
          },
        });
      }
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    const { name, storeName, avatar } = req.body;

    if (mongoose.connection.readyState === 1 && req.user.id) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      if (name) user.name = name.trim();
      if (storeName !== undefined) user.storeName = storeName.trim();
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      const userResponse = {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        avatar: user.avatar,
        createdAt: user.createdAt?.toISOString(),
      };

      const token = generateToken(userResponse);

      return res.json({
        success: true,
        token,
        user: userResponse,
        message: 'Profile updated successfully.',
      });
    }

    const idx = memoryStore.users.findIndex((u) => u.id === req.user?.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (name) memoryStore.users[idx].name = name.trim();
    if (storeName !== undefined) memoryStore.users[idx].storeName = storeName.trim();
    if (avatar !== undefined) memoryStore.users[idx].avatar = avatar;

    const updatedUser = {
      id: memoryStore.users[idx].id,
      name: memoryStore.users[idx].name,
      email: memoryStore.users[idx].email,
      role: memoryStore.users[idx].role,
      storeName: memoryStore.users[idx].storeName,
      avatar: memoryStore.users[idx].avatar,
      createdAt: memoryStore.users[idx].createdAt,
    };

    const token = generateToken(updatedUser);

    res.json({
      success: true,
      token,
      user: updatedUser,
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Request password reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide your registered email.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: emailTrimmed });
      if (!user) {
        return res.status(404).json({ success: false, error: 'No account found with this email address.' });
      }

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(expiresAt);
      await user.save();

      return res.json({
        success: true,
        message: 'Password reset link and security token generated.',
        resetToken,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }

    const userRecord = memoryStore.users.find((u) => u.email.toLowerCase() === emailTrimmed);
    if (!userRecord) {
      return res.status(404).json({ success: false, error: 'No account found with this email address.' });
    }

    memoryStore.resetTokens.set(resetToken, { email: emailTrimmed, expiresAt });

    res.json({
      success: true,
      message: 'Password reset link and security token generated.',
      resetToken,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      }).select('+password');

      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset token.' });
      }

      user.password = newPassword; // Will be hashed by pre-save hook
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.json({
        success: true,
        message: 'Your password has been successfully reset! You can now log in.',
      });
    }

    const record = memoryStore.resetTokens.get(token);
    if (!record) {
      return res.status(400).json({ success: false, error: 'Invalid or already used password reset token.' });
    }

    if (Date.now() > record.expiresAt) {
      memoryStore.resetTokens.delete(token);
      return res.status(400).json({ success: false, error: 'Password reset token has expired.' });
    }

    const userIndex = memoryStore.users.findIndex((u) => u.email.toLowerCase() === record.email.toLowerCase());
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    memoryStore.users[userIndex].passwordHash = bcrypt.hashSync(newPassword, salt);
    memoryStore.resetTokens.delete(token);

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
