import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config()

connectDB()

// 2nd method or best approach




















// first method

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("error", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`Appp is listining on PORT ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("error", error);
//     throw error;
//   }
// })();
