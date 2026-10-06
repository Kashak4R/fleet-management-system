import jwt from "jsonwebtoken";
import User from "../models/User.js";

function createToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function userResponse(user) {
  return {
    token: createToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      driver: user.driver || null,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    },
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() })
      .select("+password")
      .populate("driver", "name email phone licenseNumber licenseExpiry status");

    if (!user || !(await user.comparePassword(password || ""))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated. Contact an administrator." });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json(userResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const count = await User.countDocuments();

    if (count > 0 && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Only an administrator can create additional users" });
    }

    const user = await User.create({ name, email, password, role: role || "manager" });
    res.status(201).json(userResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .select("name email role driver isActive lastLogin")
      .populate("driver", "name email phone licenseNumber licenseExpiry status");
    res.json(user);
  } catch (error) {
    next(error);
  }
}
