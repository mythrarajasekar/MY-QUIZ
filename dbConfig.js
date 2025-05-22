const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://myth:1922@kahoot-db.pcdohni.mongodb.net/?retryWrites=true&w=majority&appName=kahoot-db");

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("Mongo Db Connection Successful");
});

connection.on("error", (err) => {
  console.log("Mongo Db Connection Failed");
});

module.exports = connection;
