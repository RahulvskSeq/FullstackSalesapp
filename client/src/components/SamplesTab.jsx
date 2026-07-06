import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { RefreshCw, Package } from 'lucide-react';
import { notify } from './Toast';

const today = () => new Date().toISOString().slice(0,10);

export default function SamplesTab({ dealer, currentUser }) {
  const [samples,  setSamples]  = useState([]);
  const [given,    setGiven]    = useState({}); // { sampleId: givenRecord }
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState({}); // { sampleId: true } while saving
  const [notes,    setNotes]    = useState({});  // { sampleId: noteText }

  const dealerZone = (dealer.zone||'').toLowerCase().trim();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSamples, givenList] = await Promise.all([
        api.getSamples(),
        api.getSamplesGiven(`dealerName=${encodeURIComponent(dealer.name)}`),
      ]);
      setSamples(allSamples || []);
      // Build a map: sampleId -> givenRecord
      const map = {};
      (givenList || []).forEach(g => { map[g.sampleId] = g; });
      setGiven(map);
    } catch(e) { console.warn('Samples load failed:', e.message); }
    setLoading(false);
  };

  // Toggle — if given unmark it, if not given mark it
  const toggle = async (sample) => {
    setToggling(t => ({ ...t, [sample._id]: true }));
    try {
      if(given[sample._id]) {
        // Already given — unmark (delete)
        await api.unmarkSample(given[sample._id]._id);
        setGiven(g => { const n = { ...g }; delete n[sample._id]; return n; });
      } else {
        // Not given — mark as given
        const record = await api.markSampleGiven({
          dealerName: dealer.name,
          dealerId:   dealer.id || '',
          sampleId:   sample._id,
          sampleName: sample.name,
          zone:       sample.zone,
          salesman:   dealer.salesman,
          givenDate:  today(),
          notes:      notes[sample._id] || '',
        });
        setGiven(g => ({ ...g, [sample._id]: record }));
      }
    } catch(e) { notify.error(e.message); }
    setToggling(t => { const n = { ...t }; delete n[sample._id]; return n; });
  };

  // Filter samples to what applies to this dealer. The upload sheet uses
  // free-form zone tags ("All Zones", "ZONE 2 & 5", "NEW DEALERS ONLY"),
  // so an exact single-zone match is wrong. Rules:
  //   • Sample zone blank / "General" / "All Zones"  → applies to every dealer.
  //   • Sample zone contains the dealer's zone number (case-insensitive) → applies.
  //   • Everything already given to this dealer → always shown (regardless of zone).
  const zoneMatches = (sampleZone) => {
    if (!dealerZone) return true;
    const z = String(sampleZone || '').toLowerCase().trim();
    if (!z || z === 'general' || z === 'all zones') return true;
    // Extract digits from the dealer's zone ("ZONE 3" → "3") and check
    // whether the sample's zone tag mentions that number.
    const dealerZoneNum = (dealerZone.match(/\d+/) || [''])[0];
    if (dealerZoneNum && z.includes(dealerZoneNum)) return true;
    return z === dealerZone;
  };
  const zoneSamples = samples.filter(s => zoneMatches(s.zone) || given[s._id]);

  const givenCount   = zoneSamples.filter(s => given[s._id]).length;
  const totalCount   = zoneSamples.length;
  const pendingCount = totalCount - givenCount;
  const pct          = totalCount > 0 ? Math.round((givenCount / totalCount) * 100) : 0;

  if(loading) return (
    <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
      <RefreshCw size={20} style={{animation:'spin .8s linear infinite',marginBottom:8}}/>
      <div style={{fontSize:12}}>Loading samples...</div>
    </div>
  );

  if(samples.length === 0) return (
    <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
      <Package size={32} style={{marginBottom:10,opacity:.3}}/>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>No samples in master yet</div>
      <div style={{fontSize:11}}>Admin Panel → 📦 Sample Master → Upload or Add samples</div>
    </div>
  );

  if(zoneSamples.length === 0) return (
    <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
      <Package size={32} style={{marginBottom:10,opacity:.3}}/>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>No samples for zone "{dealer.zone}"</div>
      <div style={{fontSize:11}}>Add samples for this zone in Admin Panel → 📦 Sample Master</div>
    </div>
  );

  return (
    <div>
      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
        {[
          {l:'Total',   v:totalCount,   c:'var(--acc)'},
          {l:'Given',   v:givenCount,   c:'#34d399'},
          {l:'Pending', v:pendingCount, c:'#f87171'},
        ].map(k=>(
          <div key={k.l} className="stat-card">
            <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:4}}>{k.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--t3)',marginBottom:4}}>
          <span>Zone: <strong style={{color:'var(--acc)'}}>{dealer.zone||'—'}</strong></span>
          <span style={{fontWeight:700,color:pct===100?'#34d399':pct>50?'#fbbf24':'#f87171'}}>{pct}% given</span>
        </div>
        <div style={{height:6,background:'var(--b2)',borderRadius:3,overflow:'hidden'}}>
          <div style={{
            height:'100%', width:`${pct}%`,
            background:pct===100?'#34d399':pct>50?'#fbbf24':'#f87171',
            borderRadius:3, transition:'width .4s ease',
          }}/>
        </div>
      </div>

      {/* Sample list — GIVEN on top (samples this dealer already has),
          then Pending below. Names shown clean (no strikethrough) so they
          stay readable. */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {/* Given (shown first) */}
        {givenCount > 0 && (
          <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:2,marginTop:4}}>
            ✅ Given ({givenCount})
          </div>
        )}
        {zoneSamples.filter(s => given[s._id]).map(s => {
          const g = given[s._id];
          return (
            <div key={s._id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:8,
              background:'rgba(52,211,153,0.06)',
              border:'1px solid rgba(52,211,153,0.25)',
              transition:'all .2s',
            }}>
              {/* Checked checkbox — click to uncheck */}
              <button
                onClick={() => toggle(s)}
                disabled={toggling[s._id]}
                style={{
                  width:22, height:22, borderRadius:5,
                  border:'2px solid #34d399',
                  background:'#34d399',
                  cursor:'pointer', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .15s',
                }}>
                {toggling[s._id]
                  ? <RefreshCw size={12} style={{animation:'spin .7s linear infinite',color:'#fff'}}/>
                  : <span style={{color:'#fff',fontSize:13,lineHeight:1}}>✓</span>}
              </button>

              <div style={{flex:1,minWidth:0}}>
                {/* Clean, readable name — no strikethrough. */}
                <div style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{s.name}</div>
                <div style={{display:'flex',gap:6,alignItems:'center',marginTop:2}}>
                  {s.category && <span style={{fontSize:10,color:'var(--t3)'}}>{s.category}</span>}
                  {/* Zone tag from the upload sheet ("All Zones",
                      "ZONE 2 & 5", "NEW DEALERS ONLY", etc.) */}
                  {g.zone && g.zone !== 'General' && (
                    <span style={{
                      fontSize:9, padding:'1px 6px', borderRadius:3,
                      background:'rgba(129,140,248,0.15)', color:'#a5b4fc',
                      fontWeight:600, textTransform:'uppercase', letterSpacing:'.03em',
                    }}>{g.zone}</span>
                  )}
                </div>
              </div>

              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:11,color:'#34d399',fontWeight:600}}>✓ Given</div>
                <div style={{fontSize:9,color:'var(--t3)'}}>{g.givenDate}</div>
                {g.notes && <div style={{fontSize:9,color:'var(--t3)',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.notes}</div>}
              </div>
            </div>
          );
        })}

        {/* Pending (shown below Given) */}
        {pendingCount > 0 && (
          <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:2,marginTop:8}}>
            ⬜ Pending ({pendingCount})
          </div>
        )}
        {zoneSamples.filter(s => !given[s._id]).map(s => (
          <div key={s._id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 12px', borderRadius:8,
            background:'rgba(248,113,113,0.04)',
            border:'1px solid rgba(248,113,113,0.15)',
            transition:'all .2s',
          }}>
            {/* Checkbox toggle */}
            <button
              onClick={() => toggle(s)}
              disabled={toggling[s._id]}
              style={{
                width:22, height:22, borderRadius:5,
                border:'2px solid var(--b2)',
                background:'transparent',
                cursor:'pointer', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .15s',
              }}>
              {toggling[s._id]
                ? <RefreshCw size={12} style={{animation:'spin .7s linear infinite',color:'var(--acc)'}}/>
                : null}
            </button>

            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--t1)'}}>{s.name}</div>
              {s.category && <div style={{fontSize:10,color:'var(--t3)'}}>{s.category}</div>}
            </div>

            {/* Note input */}
            <input
              className="inp"
              value={notes[s._id]||''}
              onChange={e => setNotes(n => ({...n, [s._id]: e.target.value}))}
              placeholder="Note..."
              style={{width:110, fontSize:11}}
              onKeyDown={e => e.key==='Enter' && toggle(s)}
            />

            <span style={{
              fontSize:10, padding:'2px 8px', borderRadius:4, flexShrink:0,
              background:'rgba(248,113,113,0.12)', color:'#f87171',
            }}>Pending</span>
          </div>
        ))}
      </div>
    </div>
  );
}