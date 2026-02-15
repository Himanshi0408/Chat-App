// const User = require("../models/User");

// /* ------------------ GET MY PROFILE ------------------ */
// exports.getMyProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("-password");

//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// /* ------------------ UPDATE PROFILE ------------------ */
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, profilePic } = req.body;

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Update fields if provided
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (profilePic) user.profilePic = profilePic;

//     const updatedUser = await user.save();

//     res.status(200).json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//       profilePic: updatedUser.profilePic
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// /* ------------------ GET ALL USERS (EXCEPT ME) ------------------ */
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find({
//       _id: { $ne: req.user._id }
//     }).select("-password");

//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };
const User = require("../models/User");

const getMyProfile = async (req, res) => {
  res.status(200).json({
    statusCode: 200,
    message: "Profile fetched successfully",
    data: req.user
  });
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.profilePic = req.body.profilePic || user.profilePic;

    const updatedUser = await user.save();

    res.status(200).json({
      statusCode: 200,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: "User not found",
      data: null
    });
  }
};

const getAllUsers = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id }
  }).select("-password");

  res.status(200).json({
    statusCode: 200,
    message: "Users fetched successfully",
    data: users
  });
};

/* Get all online users */
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true }).select("-password");

    res.status(200).json({
      statusCode: 200,
      message: "Online users fetched successfully",
      data: onlineUsers
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  getAllUsers,
  getOnlineUsers
};
