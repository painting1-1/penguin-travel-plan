/* Independent local records. No cloud endpoint is configured. */
(() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const key = (tripId, collection) => `penguin-travel:v3:${encodeURIComponent(tripId)}:${collection}`;
  function read(tripId, collection, fallback) {
    const raw=localStorage.getItem(key(tripId,collection));
    const value=raw===null?clone(fallback):JSON.parse(raw);
    if(!value||typeof value!=='object')throw Error('保存数据格式错误，请保留数据并修复');
    return value;
  }
  async function write(tripId, collection, data, expectedRevision) {
    const save=()=>{
      const current=read(tripId,collection,{}),revision=current._revision||0;
      if(expectedRevision!==undefined&&revision!==expectedRevision)throw Error('另一页面已修改此旅行，请刷新后重试');
      const next={...clone(data),_revision:revision+1};
      localStorage.setItem(key(tripId,collection),JSON.stringify(next));
      return next;
    };
    // Web Locks makes the check-and-write atomic between same-origin tabs where supported.
    return navigator.locks?.request ? navigator.locks.request(key(tripId,collection),save) : save();
  }
  function validateLedger(data) {
    if(!data||!Array.isArray(data.travelers)||!Array.isArray(data.bills)||!data.settings)throw Error('账本数据格式错误');
    const ids=data.travelers.map(p=>p.id);if(new Set(ids).size!==ids.length||ids.some(id=>!id))throw Error('同行人编号缺失或重复');
    for(const b of data.bills){
      if(!ids.includes(b.payerId)||!b.participantIds?.length||new Set(b.participantIds).size!==b.participantIds.length||b.participantIds.some(id=>!ids.includes(id)))throw Error('账单关联人员有误，请保留数据并修复');
      if(!Number.isSafeInteger(b.originalAmountCents)||b.originalAmountCents<=0||!Number.isSafeInteger(b.baseAmountCents)||b.baseAmountCents<=0)throw Error('账单金额格式错误');
      if(b.splitMode==='custom'&&b.participantIds.reduce((sum,id)=>sum+Number(b.sharesCents?.[id]??NaN),0)!==b.baseAmountCents)throw Error('自定义分摊合计错误');
    }
  }
  function ledgerAdapter(tripId,seed) {
    let revision=0;
    return {mode:'local',async load(){const data=read(tripId,'ledger',seed);validateLedger(data);revision=data._revision||0;return data;},async save(data){validateLedger(data);const saved=await write(tripId,'ledger',data,revision);revision=saved._revision;return saved;}};
  }
  window.PenguinStorage={read,write,ledgerAdapter,key};
})();
