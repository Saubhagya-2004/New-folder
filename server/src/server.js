const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");

dotenv.config({ override: true });

const PORT = process.env.APP_PORT || process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
