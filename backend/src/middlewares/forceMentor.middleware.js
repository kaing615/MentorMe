import User from '../models/user.model.js';

// Middleware: Gán req.user là mentor đầu tiên trong database
const forceMentor = async (req, res, next) => {
  try {
    const mentor = await User.findOne({ role: { $in: ['mentor'] } });
    if (!mentor) {
      return res.status(500).json({ message: 'No mentor found in database.' });
    }
    req.user = mentor;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error finding mentor', error: err.message });
  }
};

export default forceMentor;
