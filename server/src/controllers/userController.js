import Driver from "../models/Driver.js";
import User from "../models/User.js";

const publicFields = "name email role driver isActive lastLogin createdAt updatedAt";

function normalizeDriver(role, driver) {
  return role === "driver" ? driver || null : null;
}

async function validateDriverLink(role, driver, excludedUserId = null) {
  if (role !== "driver") return null;
  if (!driver) {
    const error = new Error("A driver profile must be selected for a driver account");
    error.status = 400;
    throw error;
  }

  const profile = await Driver.findById(driver);
  if (!profile) {
    const error = new Error("Selected driver profile was not found");
    error.status = 404;
    throw error;
  }

  const linkedUser = await User.findOne({
    driver,
    ...(excludedUserId ? { _id: { $ne: excludedUserId } } : {}),
  });
  if (linkedUser) {
    const error = new Error("This driver profile is already linked to another account");
    error.status = 409;
    throw error;
  }

  return profile._id;
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select(publicFields)
      .populate("driver", "name email phone licenseNumber status")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role = "manager", driver, isActive = true } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const driverId = await validateDriverLink(role, driver);
    const user = await User.create({
      name,
      email,
      password,
      role,
      driver: normalizeDriver(role, driverId),
      isActive,
    });

    const created = await User.findById(user._id)
      .select(publicFields)
      .populate("driver", "name email phone licenseNumber status");
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const nextRole = req.body.role || user.role;
    const nextDriver = req.body.driver !== undefined ? req.body.driver : user.driver;
    const driverId = await validateDriverLink(nextRole, nextDriver, user._id);

    if (String(user._id) === String(req.user._id)) {
      if (req.body.isActive === false) {
        return res.status(400).json({ message: "You cannot deactivate your own account" });
      }
      if (nextRole !== "admin") {
        return res.status(400).json({ message: "You cannot remove your own administrator role" });
      }
    }

    ["name", "email"].forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    user.role = nextRole;
    user.driver = normalizeDriver(nextRole, driverId);
    if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
    if (req.body.password) user.password = req.body.password;
    await user.save();

    const updated = await User.findById(user._id)
      .select(publicFields)
      .populate("driver", "name email phone licenseNumber status");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
}
