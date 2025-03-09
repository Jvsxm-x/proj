const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  dateInscription: { type: Date, default: Date.now },
  roles: { type: [String], default: ["utilisateur"] },
  vrifier :{type :[Boolean],default:["false"]}
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("motDePasse")) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});


module.exports = mongoose.model("User", UserSchema);
