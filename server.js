const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNHANDLED REJECTION! shutting down..')
  console.log(err.name, err.message)
  process.exit(1)
})

dotenv.config({ path: './config.env' });

const app = require('./app');


mongoose.connect(process.env.DATABASE_LOCAL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(() => console.log("Database connected"))

// console.log(process.env);
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server started on ${PORT}....`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! shutting down..')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})