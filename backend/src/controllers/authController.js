const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token 
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


//REGISTER CONTROLLER 
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    //  Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //  Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      statusCode: 201,
      message: "User registered successfully",
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Server Error",
      data: null
    });
  }
};


// LOGIN CONTROLLER 
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    //  Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
   
 res.status(200).json({
      statusCode: 200,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accessToken: generateToken(user._id)
      }
    });

  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Server Error",
      data: null
    });
  }
};