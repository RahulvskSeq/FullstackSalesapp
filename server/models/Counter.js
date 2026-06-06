import mongoose from 'mongoose';

// Simple atomic counter used to generate user-visible IDs (ticket numbers).
const S = new mongoose.Schema({
  key:   { type:String, required:true, unique:true },
  value: { type:Number, default:0 },
});

S.statics.next = async function(key, padTo=4){
  const doc = await this.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert:true, new:true, setDefaultsOnInsert:true },
  );
  return doc.value;
};

export default mongoose.models.Counter || mongoose.model('Counter', S);
