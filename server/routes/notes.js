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

// Staff = admin OR superadmin (both see all notes)
// the note sits on a dealer this salesman owns
const onMyDealer = async (req, dealerId) => {
  if(!dealerId || !mongoose.isValidObjectId(String(dealerId))) return false;
  const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
  return !!(await Dealer.exists({ _id: dealerId, salesman: req.user.id }));
};
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin' || req.user?.role === 'employee';

router.get('/', protect, async (req,res) => {
  try {
    if(isStaff(req)) return res.json(await Note.find({}).sort({createdAt:-1}));
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
    const n=await Note.findById(req.params.id,'userId dealerId').lean();
    if(!n) return res.status(404).json({error:'Not found'});
    const author = isStaff(req) || n.userId===req.user.id;
    // a salesman may tick off a note the office left on HIS dealer, but not rewrite it
    if(!author && !(await onMyDealer(req, n.dealerId))) return res.status(403).json({error:'You can edit only your own notes'});
    // only the note's own content changes; its dealer and author stay put
    const patch={};
    for(const k of (author ? ['type','text','dueDate','completed'] : ['completed'])) if(req.body[k]!==undefined) patch[k]=req.body[k];
    const updated=await Note.findByIdAndUpdate(req.params.id,{$set:patch},{new:true});
    res.json(updated);
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, async (req,res) => {
  try {
    const n=await Note.findById(req.params.id,'userId dealerId').lean();
    if(!n) return res.json({ok:true});
    if(!isStaff(req) && n.userId!==req.user.id && !(await onMyDealer(req, n.dealerId))) return res.status(403).json({error:'You can delete only your own notes'});
    await Note.findByIdAndDelete(req.params.id); res.json({ok:true});
  }
  catch(e){res.status(500).json({error:e.message});}
});

export default router;
