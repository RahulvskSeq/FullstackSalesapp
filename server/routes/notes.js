import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const noteSchema = new mongoose.Schema({
  dealerId:  { type:String, required:true },
  userId:    { type:String, default:'' },
  type:      { type:String, default:'note' },
  text:      { type:String, default:'' },
  dueDate:   { type:String, default:null },
  completed: { type:Boolean, default:false },
}, { timestamps:true });

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);

router.get('/', protect, async (req,res) => {
  try {
    if(req.user.role==='admin') return res.json(await Note.find({}).sort({createdAt:-1}));
    const Dealer = mongoose.models.Dealer;
    if(!Dealer) return res.json([]);
    const myDealers = await Dealer.find({salesman:req.user.id},'_id').lean();
    const myIds = myDealers.map(d=>d._id.toString());
    res.json(await Note.find({dealerId:{$in:myIds}}).sort({createdAt:-1}));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post('/', protect, async (req,res) => {
  try {
    const {dealerId,type,text,dueDate,completed}=req.body;
    if(!dealerId||!text) return res.status(400).json({error:'dealerId and text required'});
    const note=await Note.create({dealerId,userId:req.user.id,type:type||'note',text,dueDate:dueDate||null,completed:completed||false});
    res.json(note);
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', protect, async (req,res) => {
  try {
    const updated=await Note.findByIdAndUpdate(req.params.id,req.body,{new:true});
    res.json(updated);
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, async (req,res) => {
  try { await Note.findByIdAndDelete(req.params.id); res.json({ok:true}); }
  catch(e){res.status(500).json({error:e.message});}
});

export default router;
