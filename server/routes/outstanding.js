import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

const outSchema = new mongoose.Schema({
  dealerName:         { type:String, required:true, unique:true },
  monthlyOutstanding: { type:Map, of:Number, default:{} },
}, { timestamps:true });

const Outstanding = mongoose.models.Outstanding || mongoose.model('Outstanding', outSchema);

const toPlain = (doc) => {
  const mo = {};
  try {
    const raw = doc.monthlyOutstanding;
    if(raw instanceof Map) raw.forEach((v,k)=>{ mo[k]=Number(v)||0; });
    else if(raw&&typeof raw==='object') Object.keys(raw).forEach(k=>{ mo[k]=Number(raw[k])||0; });
  } catch(e){}
  return { _id:doc._id?.toString(), dealerName:doc.dealerName||'', monthlyOutstanding:mo };
};

router.get('/', protect, async (req, res) => {
  try {
    const all = await Outstanding.find({});
    if(req.user.role==='admin') return res.json(all.map(toPlain));
    const Dealer = mongoose.models.Dealer;
    if(!Dealer) return res.json([]);
    const myDealers = await Dealer.find({salesman:req.user.id},'name').lean();
    const myNames = new Set(myDealers.map(d=>d.name.toLowerCase().trim()));
    res.json(all.filter(o=>myNames.has(o.dealerName?.toLowerCase().trim())).map(toPlain));
  } catch(e){ console.error('[OUTSTANDING]',e.message); res.status(500).json({error:e.message}); }
});

router.post('/upload', protect, adminOnly, upload.single('file'), async (req,res) => {
  try {
    if(!req.file) return res.status(400).json({error:'file required'});
    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    if(!rows.length) return res.status(400).json({error:'No data'});
    const headers=Object.keys(rows[0]);
    const nameCol=headers.find(h=>/dealer|name|party/i.test(h))||headers[0];
    const monthCols=headers.filter(h=>h!==nameCol&&String(h).trim());
    const results={added:0,updated:0,errors:[]};
    for(const row of rows){
      const dealerName=String(row[nameCol]||'').trim();
      if(!dealerName||dealerName.length<2) continue;
      if(/^[\d\s,₹]+$/.test(dealerName)) continue;
      if(['total','totals','dealer name','name'].includes(dealerName.toLowerCase())) continue;
      const mo={};
      monthCols.forEach(m=>{ const v=row[m]; if(m.trim()) mo[m.trim()]=v?Math.round(parseFloat(String(v).replace(/[^\d.-]/g,''))||0):0; });
      try{
        const rx=new RegExp(`^${dealerName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        const ex=await Outstanding.findOne({dealerName:rx});
        if(ex){
          const merged={};
          if(ex.monthlyOutstanding instanceof Map) ex.monthlyOutstanding.forEach((v,k)=>{merged[k]=Number(v)||0;});
          else if(ex.monthlyOutstanding) Object.assign(merged,ex.monthlyOutstanding);
          Object.assign(merged,mo);
          await Outstanding.findByIdAndUpdate(ex._id,{monthlyOutstanding:merged});
          results.updated++;
        }else{
          await Outstanding.create({dealerName,monthlyOutstanding:mo});
          results.added++;
        }
      }catch(e){results.errors.push(`${dealerName}: ${e.message}`);}
    }
    res.json(results);
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:name', protect, adminOnly, async (req,res) => {
  try {
    const {month,amount}=req.body;
    if(!month) return res.status(400).json({error:'month required'});
    const name=decodeURIComponent(req.params.name);
    const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
    const rec=await Outstanding.findOneAndUpdate({dealerName:rx},{$set:{[`monthlyOutstanding.${month}`]:Number(amount)||0}},{new:true,upsert:true});
    res.json(toPlain(rec));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  await Outstanding.findByIdAndDelete(req.params.id);
  res.json({ok:true});
});

export default router;
