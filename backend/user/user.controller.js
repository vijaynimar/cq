import { User } from "../model/user.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
const passwordHash = async (password) => {
  // Implement your password hashing logic here (e.g., using argon2)
  // For demonstration purposes, this is a placeholder and should not be used in production
  return await argon2.hash(password);
}

export const createUser = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log the request body for debugging
    const { firstName, email, password, phone, image, role } = req.body;
    if(!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required' });
    }
    const hashedPassword = await passwordHash(password);
    //check if user already exists email or by phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }
    const newUser = new User({
      firstName,
      email,
      password: hashedPassword,
      phone,
      image,
      role
    });
    const savedUser = await newUser.save();
    const safeUser = savedUser.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const LoginUser = async (req, res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isPasswordValid = await argon2.verify(user.password, password);
        if(!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, email: user.email, role: user.role } });    
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}