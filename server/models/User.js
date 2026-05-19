import mongoose from 'mongoose';
const S = new mongoose.Schema({
  id:              { type:String, required:true, unique:true },
  name:            { type:String, required:true },
  pass:            { type:String, required:true },
  role:            { type:String, enum:['admin','salesman'], default:'salesman' },
  color:           { type:String, default:'#818cf8' },
  ini:             { type:String, default:'??' },
  url:             { type:String, default:null },
  url2:            { type:String, default:null },
  url_outstanding: { type:String, default:null },
}, { timestamps:true });
export default mongoose.models.User || mongoose.model('User', S);
