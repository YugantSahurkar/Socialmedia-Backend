import { User } from "../models/userSchema.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// Register Function
export const Register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Basic validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists.",
        success: false,
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User created successfully.",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error.",
      success: false,
    });
  }
};

// Login Function
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    // Compare the provided password with the stored hashed password
    const passwordsMatch = await bcryptjs.compare(password, user.password);
    if (!passwordsMatch) {
      return res.status(401).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    // Prepare token payload
    const tokenData = {
      userId: user._id,
    };

    // Sign the JWT token
    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: "1d",
    });

    // Set token in cookie and respond
    return res
      .status(200)
      .cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, secure: true, sameSite: "none" })
      .json({
        message: `Welcome back, ${user.name}`,
        user,
        success: true,
      });
  } catch (error) {
    console.error("Login error: ", error);
    return res.status(500).json({
      message: "Server error.",
      success: false,
    });
  }
};

export const logout = (req, res) => {
  return res
    .cookie("token", "", { expires: new Date(0), httpOnly: true, secure: true, sameSite: "none" })
    .json({
      message: "User logged out successfully.",
      success: true,
    });
};

export const bookmark = async (req, res) => {
  try {
    const loggedInUserId = req.body.id;
    const tweetId = req.params.id;
    const user = await User.findById(loggedInUserId);
    if (user.bookmarks.includes(tweetId)) {
     
      await User.findByIdAndUpdate(loggedInUserId, {
        $pull: { bookmarks: tweetId },
      });
      return res.status(200).json({
        message: "Remove From Bookmarks.",
      });
    } else {
    
      await User.findByIdAndUpdate(loggedInUserId, {
        $push: { bookmarks: tweetId },
      });
      return res.status(200).json({
        message: "Saved to Bookmarks.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getMyProfile = async (req, res) => {
  try {
      const id = req.params.id;
      const user = await User.findById(id).select("-password");
      return res.status(200).json({
          user,
      })
  } catch (error) {
      console.log(error);
  }
};
export const getOtherUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const otherUsers = await User.find({ _id: { $ne: id } }).select(
      "-password"
    );
    if (!otherUsers) {
      return res.status(401).json({
        message: "Currently do not have any users.",
      });
    }
    return res.status(200).json({
      otherUsers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const follow = async (req, res) => {
  try {
    const loggedInUserId = req.body.id;
    const userId = req.params.id;
    const loggedInUser = await User.findById(loggedInUserId); // yugant
    const user = await User.findById(userId); // darshan

    if (!user.followers.includes(loggedInUserId)) {
      await user.updateOne({ $push: { followers: loggedInUserId } });
      await loggedInUser.updateOne({ $push: { following: userId } }); // Fixed typo here
    } else {
      return res.status(400).json({
        message: `User already followed ${user.name}`,
      });
    }

    return res.status(200).json({
      message: `${loggedInUser.name} just followed ${user.name}`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while trying to follow the user",
      error: error.message,
    });
  }
};
export const unfollow = async (req, res) => {
  try {
    const loggedInUserId = req.body.id;
    const userId = req.params.id;
    const loggedInUser = await User.findById(loggedInUserId); // yugant
    const user = await User.findById(userId); // darshan

    if (loggedInUser.followers.includes(userId)) {
      await user.updateOne({ $pull: { followers: loggedInUserId } });
      await loggedInUser.updateOne({ $pull: { following: userId } }); // Fixed typo here
    } else {
      return res.status(400).json({
        message: `User has not followed`,
      });
    }

    return res.status(200).json({
      message: `${loggedInUser.name} unfollow to ${user.name}`,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
