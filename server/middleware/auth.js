import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    // For this project, we might just be passing the userId in headers for now
    // If a token exists, verify it, otherwise check for a direct userId header
    const token = req.headers.authorization?.split(" ")[1];
    const directUserId = req.headers['userid'];

    if (token) {
      const decodedData = jwt.decode(token);
      req.userId = decodedData?.id || decodedData?.sub;
    } else if (directUserId) {
      req.userId = directUserId;
    }

    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

export default auth;
