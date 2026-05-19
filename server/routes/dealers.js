import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

const monthEntrySchema = new mongoose.Schema({
  achieved:    { type:Number, default:0 },
  target:      { type:Number, default:0 },
  status:      { type:String, default:'' },
  zone:        { type:String, default:'' },
  category:    { type:String, default:'' },
  categoryType:{ type:String, default:'' },
  city:        { type:String, default:'' },
  state:       { type:String, default:'' },
}, { _id:false });

const dealerSchema = new mongoose.Schema({
  name:         { type:String, required:true },
  salesman:     { type:String, required:true },
  city:         { type:String, default:'' },
  state:        { type:String, default:'' },
  zone:         { type:String, default:'' },
  status:       { type:String, default:'ACTIVE' },
  category:     { type:String, default:'' },
  categoryType: { type:String, default:'' },
  target:       { type:Number, default:0 },
  creditDays:   { type:Number, default:0 },
  creditLimit:  { type:Number, default:0 },
  avg6m:        { type:Number, default:0 },
  monthlyData:  { type:Map, of:monthEntrySchema, default:{} },
  source:       { type:String, default:'sheet' },
}, { timestamps:true });

dealerSchema.index({ name:1, salesman:1 }, { unique:true });
const Dealer = mongoose.models.Dealer || mongoose.model('Dealer', dealerSchema);

const mapToObj = (m) => {
  if(!m) return {};
  if(typeof m.forEach==='function'){ const o={}; m.forEach((v,k)=>{ o[k]=v?.toObject?v.toObject():v; }); return o; }
  return typeof m==='object'?{...m}:{};
};

const fmt = (d, MO=[]) => {
  const md = mapToObj(d.monthlyData);
  const months = MO.map(m=>Number(md[m]?.achieved)||0);
  const monthTargets={}, monthStatus={}, monthZone={};
  MO.forEach((m,i)=>{
    if(md[m]?.target>0)   monthTargets[i]=Number(md[m].target);
    if(md[m]?.status)     monthStatus[i]=md[m].status;
    if(md[m]?.zone)       monthZone[i]=md[m].zone;
  });
  const monthsWithData=MO.map((m,i)=>(md[m]?.achieved>0||md[m]?.target>0)?i:-1).filter(i=>i>=0);
  return {
    id:d._id?.toString(), name:d.name, salesman:d.salesman,
    city:d.city||'', state:d.state||'', zone:d.zone||'', status:d.status||'ACTIVE',
    category:d.category||'', categoryType:d.categoryType||'', target:d.target||0,
    avg6m:d.avg6m||0, creditDays:d.creditDays||0, creditLimit:d.creditLimit||0,
    months, monthTargets, monthStatus, monthZone,
    monthsWithData, monthlyData:md,
    achieved:[...months].reverse().find(v=>v>0)||0,
    categoryBreakdown:{}, source:d.source||'db',
  };
};

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role==='admin'?{}:{salesman:req.user.id};
    const MO = req.query.mo?req.query.mo.split(','):[];
    const dealers = await Dealer.find(filter).lean();
    res.json(dealers.map(d=>fmt(d,MO)));
  } catch(e){ console.error('[DEALERS GET]',e.message); res.status(500).json({error:e.message}); }
});

router.post('/upload', protect, upload.single('file'), async (req,res) => {
  try {
    const {month, salesman:uploadSm} = req.body;
    const smId = req.user.role==='admin'?(uploadSm||req.user.id):req.user.id;
    if(!month) return res.status(400).json({error:'month required'});
    if(!req.file) return res.status(400).json({error:'No file'});
    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    if(!rows.length) return res.status(400).json({error:'No data'});
    const results={added:0,updated:0,skipped:0,errors:[]};
    for(const row of rows){
      const keys=Object.keys(row);
      const find=(...t)=>{for(const x of t){const k=keys.find(k=>k.toLowerCase().replace(/[\s_-]/g,'').includes(x.toLowerCase().replace(/[\s_-]/g,'')));if(k&&String(row[k]).trim())return String(row[k]).trim();}return'';};
      const findNum=(...t)=>{const v=find(...t);return v?Math.round(parseFloat(v.replace(/[^\d.-]/g,''))||0):0;};
      const name=find('dealername','dealer name','name','party','firm');
      if(!name||name.length<2||/^[\d\s,]+$/.test(name)){results.skipped++;continue;}
      const monthData={achieved:findNum('achieved','ach','qty','sales'),target:findNum('target','tgt'),status:find('status')||'ACTIVE',zone:find('zone'),category:find('categorytype','category'),categoryType:find('subcategory','subcat'),city:find('city'),state:find('state')};
      try{
        const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        const ex=await Dealer.findOne({name:rx,salesman:smId});
        const gu={source:'upload',...(monthData.city?{city:monthData.city}:{}),...(monthData.state?{state:monthData.state}:{}),...(monthData.zone?{zone:monthData.zone}:{}),...(monthData.target?{target:monthData.target}:{})};
        if(ex){await Dealer.findByIdAndUpdate(ex._id,{$set:{[`monthlyData.${month}`]:monthData,...gu}});results.updated++;}
        else{await Dealer.create({name,salesman:smId,...monthData,monthlyData:{[month]:monthData},source:'upload'});results.added++;}
      }catch(e){results.errors.push(`${name}: ${e.message}`);}
    }
    res.json({...results,month,salesman:smId,total:rows.length});
  }catch(e){res.status(500).json({error:e.message});}
});

router.post('/sync-db', protect, adminOnly, async (req,res) => {
  try {
    const {dealers,MO}=req.body;
    if(!dealers?.length) return res.status(400).json({error:'No dealers'});
    let saved=0,errors=0;
    for(const d of dealers){
      try{
        const monthlyData={};
        (MO||[]).forEach((m,i)=>{
          const ach=d.months?.[i]||0;
          const tgt=d.monthTargets?.[i]??d.monthTargets?.[String(i)]??0;
          if(ach||tgt) monthlyData[m]={achieved:ach,target:tgt,status:d.status||'ACTIVE',zone:d.zone||'',category:d.category||'',categoryType:d.categoryType||'',city:d.city||'',state:d.state||''};
        });
        const rx=new RegExp(`^${d.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        await Dealer.findOneAndUpdate({name:rx,salesman:d.salesman},{$set:{name:d.name,salesman:d.salesman,city:d.city||'',state:d.state||'',zone:d.zone||'',status:d.status||'ACTIVE',category:d.category||'',categoryType:d.categoryType||'',target:d.target||0,avg6m:d.avg6m||0,creditDays:d.creditDays||0,creditLimit:d.creditLimit||0,monthlyData,source:'sheet'}},{upsert:true});
        saved++;
      }catch(e){errors++;}
    }
    res.json({saved,errors});
  }catch(e){res.status(500).json({error:e.message});}
});

router.get('/:id', protect, async (req,res) => {
  try {
    const d=await Dealer.findById(req.params.id).lean();
    if(!d) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&d.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
    res.json(fmt(d,req.query.mo?.split(',')||[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post('/', protect, async (req,res) => {
  try {
    const data={...req.body};
    if(req.user.role!=='admin') data.salesman=req.user.id;
    const d=await Dealer.create(data);
    res.json(fmt(d.toObject(),[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', protect, async (req,res) => {
  try {
    const ex=await Dealer.findById(req.params.id);
    if(!ex) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&ex.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
    const setObj={};
    for(const [k,v] of Object.entries(req.body)){
      if(k.startsWith('monthlyData.')&&v&&typeof v==='object'){Object.entries(v).forEach(([f,fv])=>{setObj[`${k}.${f}`]=fv;});}else{setObj[k]=v;}
    }
    const d=await Dealer.findByIdAndUpdate(req.params.id,{$set:setObj},{new:true,runValidators:false}).lean();
    res.json(fmt(d,[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  try { await Dealer.findByIdAndDelete(req.params.id); res.json({ok:true}); }
  catch(e){res.status(500).json({error:e.message});}
});

export default router;
