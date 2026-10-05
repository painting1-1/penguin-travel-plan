/* Penguin travel template. Travel facts live only in trip-data.json. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => prefix+'-'+crypto.randomUUID();
  function safeUrl(value) {try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
  function xhsUrl(value) {try{const u=new URL(value);return u.protocol==='https:'&&/^(?:[a-z0-9-]+\.)*(?:xiaohongshu\.com|xhslink\.(?:com|cn))$/.test(u.hostname)?u.href:'';}catch{return '';}}
  function parseShare(value) {
    const source=String(value||'').trim();let url='';
    for(const raw of source.match(/https:\/\/[^\s<>"\]]+/g)||[]){url=xhsUrl(raw.replace(/[）)】，。；,;]+$/g,''));if(url)break;}
    const title=(source.match(/【([\s\S]*?)】/)||[])[1]||'';
    return {url,title:title.split(/\s+-\s+/)[0].slice(0,160)};
  }
  let trip,places,state,mapState=null,activeDay=0,guideContext=null,wishContext=null,pendingPhoto='',photoBusy=false;
  const maps = query => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
  function hasIntro(p) {
    if(!p?.intro || p.showIntro===false)return false;
    if(['airport','station','hotel','logistics'].includes(p.kind))return false;
    // Older data has no kind: ordinary transport/lodging names remain navigation-only.
    if(!p.kind && /机场|機場|车站|車站|地铁站|地鐵站|酒店|旅舍|旅馆|住宿|airport|station|hotel|hostel/i.test(p.name))return false;
    return true;
  }
  function placeLink(id, intro=false, eventId='') {
    const p=places.get(id);if(!p)return '';
    return `<a class="place-link" target="_blank" rel="noopener" href="${maps(p.query||p.name)}">${esc(p.name)}</a>${intro&&hasIntro(p)?`<button type="button" class="place-info" aria-label="查看${esc(p.name)}介绍" data-intro="${esc(eventId)}" aria-expanded="false" aria-controls="intro-${esc(eventId)}">ⓘ</button>`:''}`;
  }
  async function persist(next) {
    try {state=await PenguinStorage.write(trip.id,'page',next,state._revision||0);$('#storage-status').textContent='已保存在当前浏览器 · 每趟旅行独立存储';return true;}
    catch (error) {$('#storage-status').textContent=error.message+'；'+'保存失败，请检查浏览器存储空间或权限；旧数据和输入均保留。';return false;}
  }
  function dateLabel(date) {return date.slice(5).replace('-','/');}
  function zoned(value,zone,options={}) {return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,...options}).format(new Date(value));}
  function clock(value,zone) {return zoned(value,zone,{hour:'2-digit',minute:'2-digit',hour12:false});}
  function zoneLabel(zone,value,label='') {
    const names={'Asia/Shanghai':'中国','Asia/Hong_Kong':'香港','Asia/Bangkok':'泰国','Asia/Tokyo':'日本','Asia/Singapore':'新加坡','Europe/Zurich':'瑞士','Europe/Rome':'意大利'};
    const offset=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(new Date(value)).find(p=>p.type==='timeZoneName').value.replace('GMT','UTC');
    return `${label&&!label.includes('/')&&!['目的地时间','当地时间'].includes(label)?label.replace(/时间$/,''):names[zone]||'当地'} ${offset==='UTC'?'UTC+0':offset}`;
  }
  function timeBlock(text,zone,value,label=''){return `${esc(text)}<small class="time-zone">${esc(zoneLabel(zone,value,label))}</small>`;}
  function eventTime(e,d){
    const zone=e.timezone||d.timezone||trip.timezone,value=e.departure||d.date+'T'+e.start+':00Z';
    if(e.departure&&e.arrival)return timeBlock('起飞 '+clock(e.departure,e.departureZone||zone),e.departureZone||zone,e.departure,e.departureRegion)+'<br>'+timeBlock('抵达 '+clock(e.arrival,e.arrivalZone||zone),e.arrivalZone||zone,e.arrival,e.arrivalRegion);
    return timeBlock(e.start,zone,value,e.timezoneLabel||d.timezoneLabel)+(e.end&&['flight','train','bus','boat','transport'].includes(e.kind)?'<br>'+timeBlock('抵达 '+e.end,e.arrivalZone||zone,d.date+'T'+e.end+':00Z',e.arrivalRegion):'');
  }
  function localDate(zone) {const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const find=t=>parts.find(x=>x.type===t).value;return `${find('year')}-${find('month')}-${find('day')}`;}
  function duration(minutes) {return `${Math.floor(minutes/60)?Math.floor(minutes/60)+'小时':''}${minutes%60?minutes%60+'分':''}`||'0分';}
  function dayCount(){return Math.round((Date.parse(trip.endDate)-Date.parse(trip.startDate))/86400000)+1;}
  function tick(now=Date.now()) {
    const next=[...trip.importantEvents].filter(e=>Number.isFinite(Date.parse(e.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).find(e=>Date.parse(e.at)>now);
    const zones=[{zone:trip.homeTimezone||'Asia/Shanghai',label:trip.homeTimezoneLabel||'中国'},{zone:trip.timezone,label:trip.timezoneLabel}].filter((z,i,a)=>a.findIndex(x=>x.zone===z.zone)===i);
    $('#local-clock').innerHTML=zones.map(z=>`<span class="focus-clock">${timeBlock(clock(now,z.zone),z.zone,now,z.label)}</span>`).join('');
    $('#next-title').textContent=next?next.title:trip.importantEvents.length?'重要事项已结束，继续享受旅程。':'暂无重要事项';
    $('#next-detail').textContent=next?next.description||'':'';
    if(!next){$('#countdown').replaceChildren();return;}
    let n=Math.max(0,Math.floor((Date.parse(next.at)-now)/1000));
    $('#countdown').innerHTML=[['天',Math.floor(n/86400)],['时',Math.floor(n%86400/3600)],['分',Math.floor(n%3600/60)],['秒',n%60]].map(([label,value])=>`<div class="clock-unit"><strong>${label==='天'?value:String(value).padStart(2,'0')}</strong><span>${label}</span></div>`).join('');
  }
  function renderOverview() {
    const overview=trip.overview,cities=overview.cities,legs=overview.legs;
    const w=overview.canvas?.width||960,h=overview.canvas?.height||720;
    const backdrop=safeUrl(overview.mapImage),allPlaced=cities.every(c=>Array.isArray(c.position)&&c.position.length===2);
    const allGeo=cities.every(c=>Array.isArray(c.coordinates)&&c.coordinates.length===2);
    const lats=cities.map(c=>c.coordinates?.[0]),lons=cities.map(c=>c.coordinates?.[1]);
    const span=(values)=>Math.max(...values)-Math.min(...values)||1;
    const pos=new Map(cities.map((c,i)=>{let point;
      if(allPlaced)point=[c.position[0]*w,c.position[1]*h];
      else if(allGeo)point=[w*(.18+.64*(c.coordinates[1]-Math.min(...lons))/span(lons)),h*(.18+.64*(Math.max(...lats)-c.coordinates[0])/span(lats))];
      else point=[w*(.22+.56*(i%2)),h*(.22+.56*i/Math.max(1,cities.length-1))];
      return [c.id,point];
    }));
    const modes={flight:'✈',bus:'🚌',train:'🚆',boat:'⛵',car:'🚗'};
    const lines=legs.map((leg,i)=>{const a=pos.get(leg.from),b=pos.get(leg.to);if(!a||!b)return '';
      const color=i%2?'#7148A1':'#E87340',dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
      const bend=Math.min(100,length*.24),cx=(a[0]+b[0])/2-dy/length*bend,cy=(a[1]+b[1])/2+dx/length*bend;
      const mx=(a[0]+2*cx+b[0])/4,my=(a[1]+2*cy+b[1])/4,angle=Math.atan2(dy,dx)*180/Math.PI;
      return `<g class="overview-leg"><title>${esc(cities.find(c=>c.id===leg.from)?.name+' → '+cities.find(c=>c.id===leg.to)?.name+' · '+(leg.status||''))}</title><path d="M${a} Q${cx} ${cy},${b}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="2 13" marker-end="url(#overview-arrow-${i%2})"/>${leg.mode==='flight'?`<use href="#overview-plane" x="${mx-20}" y="${my-20}" width="40" height="40" color="${color}" transform="rotate(${angle} ${mx} ${my})"/>`:`<text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="middle" font-size="34">${esc(modes[leg.mode]||'→')}</text>`}</g>`;
    }).join('');
    const text=cities.map(c=>c.name).join(' → ');
    const note=overview.mapNote||(backdrop&&allPlaced?'手绘路线示意，不按精确比例绘制。':'路线示意 · 目的地手绘底图与点位待完善。');
    $('#overview-map').innerHTML=`<svg class="overview-handdrawn" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}"><defs>${[0,1].map((v)=>`<marker id="overview-arrow-${v}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L7 4L0 8" fill="none" stroke="${v?'#7148A1':'#E87340'}" stroke-width="2"/></marker>`).join('')}<symbol id="overview-plane" viewBox="0 0 64 64"><path d="M56 27 37 25 28 5c-2-4-6-4-7 0l2 21-14 2-5-6-3 1 2 10-2 10 3 1 5-6 14 2-2 21c1 4 5 4 7 0l9-20 19-2c6-1 7-10 0-12Z" fill="currentColor"/></symbol></defs><rect width="100%" height="100%" rx="18" fill="#F7F3E8"/>${backdrop&&allPlaced?`<image class="overview-terrain" href="${esc(backdrop)}" width="${w}" height="${h}" preserveAspectRatio="none"/>`:''}${lines}${cities.map((c,i)=>{const [x,y]=pos.get(c.id);const anchor=c.labelAnchor||'middle',offset=c.labelOffset||[0,48];return `<g class="overview-city"><circle cx="${x}" cy="${y}" r="19" fill="#092653" stroke="#FFFDF4" stroke-width="3"/><text x="${x}" y="${y+7}" text-anchor="middle" font-size="23" font-weight="700" fill="white">${i+1}</text><text class="overview-city-label" x="${x+offset[0]}" y="${y+offset[1]}" text-anchor="${anchor}" font-size="34" font-weight="700">${esc(c.name)}</text><text class="overview-city-label overview-stage" x="${x+offset[0]}" y="${y+offset[1]+29}" text-anchor="${anchor}" font-size="23">${esc(c.dayLabel||'')}</text></g>`;}).join('')}</svg><p class="tiny overview-map-note">${esc(note)}</p><ol class="overview-route-text">${legs.map(l=>`<li>${esc(modes[l.mode]||'→')} ${esc(cities.find(c=>c.id===l.from)?.name)} → ${esc(cities.find(c=>c.id===l.to)?.name)}${l.status?' · '+esc(l.status):''}</li>`).join('')}</ol>`;
    const terrain=$('.overview-terrain');if(terrain)terrain.addEventListener('error',()=>{terrain.remove();$('.overview-map-note').textContent='手绘底图未加载，路线和城市信息仍可查看。';});
  }
  // Prefer balanced rows within a readable card width; never change card order.
  let cardGridObserver;
  function balanceCardGrids(){
    for(const grid of document.querySelectorAll('.pending-grid,#packing-groups')){
      const pending=grid.classList.contains('pending-grid');
      const cards=[...grid.querySelectorAll(pending?':scope > .pending-item':':scope > details')];
      const n=cards.length;if(!n){grid.style.setProperty('--card-columns',1);continue;}
      const texts=cards.flatMap(c=>[...c.querySelectorAll(pending?'h4,p':'.pack-text,summary')].map(e=>e.textContent.trim().length));
      const longest=Math.max(0,...texts);
      const minWidth=pending?(longest>140?380:300):(longest>45?300:220);
      const max=innerWidth<=700?1:Math.min(4,n,Math.max(1,Math.floor((grid.clientWidth+12)/(minWidth+12))));
      let columns=1,best=Infinity;
      for(let c=1;c<=max;c++){
        const rows=Math.ceil(n/c),last=n%c||c;
        const score=rows*2+(rows*c-n)*.5+(rows>1&&last===1&&c>1?.5:0)-c*.05;
        if(score<best){best=score;columns=c;}
      }
      grid.style.setProperty('--card-columns',columns);
    }
  }
  function observeCardGrids(){
    if(!cardGridObserver&&typeof ResizeObserver!=='undefined')cardGridObserver=new ResizeObserver(balanceCardGrids);
    document.querySelectorAll('.pending-grid,#packing-groups').forEach(grid=>cardGridObserver?.observe(grid));
    balanceCardGrids();
  }
  function renderBookings() {
    const b=trip.bookings;
    $('#booking-board').innerHTML=`<h3 class="booking-group-title">✈️ 航班</h3>${b.flights.length?b.flights.map(f=>`<article class="card booking-card"><div class="booking-card-head"><h3>${esc(f.title)}</h3></div><div class="booking-card-body">${f.segments.map((s,i)=>`${i?`<p class="flight-connection">中转 · ${duration(Math.round((Date.parse(s.departure)-Date.parse(f.segments[i-1].arrival))/60000))}</p>`:''}<div class="flight-segment"><div class="flight-top"><span>${esc(s.number)}</span><span class="booking-badge">${esc(s.status||'待确认')}</span></div><div class="flight-route"><div class="flight-stop"><strong>${clock(s.departure,s.departureZone)}</strong><span>${esc(s.from)}<br>${zoned(s.departure,s.departureZone,{month:'2-digit',day:'2-digit'})}<small class="time-zone">${esc(zoneLabel(s.departureZone,s.departure,s.departureRegion))}</small></span></div><div class="flight-direction"><span>✈</span><small>${duration(Math.round((Date.parse(s.arrival)-Date.parse(s.departure))/60000))}</small></div><div class="flight-stop"><strong>${clock(s.arrival,s.arrivalZone)}</strong><span>${esc(s.to)}<br>${zoned(s.arrival,s.arrivalZone,{month:'2-digit',day:'2-digit'})}<small class="time-zone">${esc(zoneLabel(s.arrivalZone,s.arrival,s.arrivalRegion))}</small></span></div></div></div>`).join('')}<p class="flight-foot">各段显示起降地当地日期与时间。</p></div></article>`).join(''):'<p class="card tiny">已订航班待补充</p>'}
    <h3 class="booking-group-title">🏨 住宿</h3>${b.hotels.length?b.hotels.map(h=>`<article class="card booking-card"><div class="booking-card-head"><h3>${h.placeId?placeLink(h.placeId):esc(h.name)}</h3></div><div class="booking-card-body">${h.rooms.map(r=>`<div class="hotel-room"><strong>${esc(r.type)}</strong> <span class="booking-badge">${esc(r.status||'待确认')}</span><p class="tiny">入住 ${esc(r.checkIn)} → 退房 ${esc(r.checkOut)}</p><small class="time-zone">${esc(zoneLabel(h.timezone||trip.timezone,r.checkIn+'T12:00:00Z',h.timezoneLabel))}</small><p class="tiny">${esc(r.cancellation||'取消政策待确认')}</p></div>`).join('')}<p class="tiny">${esc(h.address||'地址待补充')}${h.phone?` · <a href="tel:${esc(h.phone.replace(/[^+\d]/g,''))}">${esc(h.phone)}</a>`:''}</p></div></article>`).join(''):'<p class="card tiny">已订住宿待补充</p>'}
    <h3 class="booking-group-title">🎫 待购票／待预约</h3><div class="pending-grid">${b.pending.length?b.pending.map(p=>`<article class="card pending-item"><div class="pending-item-head"><h4>${esc(p.title)}</h4><span class="booking-badge">${esc(p.status||'待确认')}</span></div><p class="pending-timing">⏰ ${esc(p.timing||'办理时间待确认')}</p>${p.placeId?`<p class="tiny">${placeLink(p.placeId)}</p>`:''}${p.note?`<p class="tiny pending-note">${esc(p.note)}</p>`:''}</article>`).join(''):'<p class="tiny pending-empty">暂无待购票或待预约事项</p>'}</div>`;
    observeCardGrids();
  }
  function routeUrl(ids) {
    const points=ids.map(id=>places.get(id)).filter(Boolean).map(p=>p.query||p.name);
    if(points.length<2)return maps(points[0]||trip.subtitle);
    return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(points[0])+'&destination='+encodeURIComponent(points.at(-1))+(points.length>2?'&waypoints='+encodeURIComponent(points.slice(1,-1).join('|')):'');
  }
  // Google Maps URLs support up to 3 intermediate stops on mobile browsers.
  // https://developers.google.com/maps/documentation/urls/get-started
  function routeSegments(ids){const waypoints=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)?3:9;const size=waypoints+2;if(ids.length<=size)return [ids];const chunks=[];for(let i=0;i<ids.length-1;i+=size-1)chunks.push(ids.slice(i,i+size));return chunks;}
  function navigationIds(d){return d.navigationPlaceIds||d.routePlaceIds;}
  function routeLinks(ids){
    const chunks=routeSegments(ids);
    const label=id=>places.get(id)?.navigationLabel||places.get(id)?.name||'地点';
    return chunks.map((part,i)=>`<a class="day-nav-link" href="${esc(routeUrl(part))}" target="_blank" rel="noopener">↗ ${chunks.length===1?'多点导航':`导航${i+1} · ${esc(label(part[0]))} → ${esc(label(part.at(-1)))}`}</a>`).join('');
  }
  function navigationNote(ids){return routeSegments(ids).length>1?'<p class="tiny navigation-note">地图平台限制途经点数量，请依次打开各段导航。</p>':'';}
  function disposeMap(){if(mapState){mapState.map.remove();document.removeEventListener('keydown',mapState.escape);mapState=null;}document.body.classList.remove('map-expanded-body');}
  function renderDay(i) {
    disposeMap();activeDay=i;const d=trip.days[i];
    $('#day-panel').innerHTML=`<article class="card day day-current" style="--day:${esc(d.color||'#7148A1')}"><div class="day-current-head"><span class="date-box"><strong>${d.date.slice(-2)}</strong>${d.date.slice(5,7)}</span><div><span class="tiny">DAY ${i+1} · ${zoned(d.date+'T12:00:00Z','UTC',{weekday:'short'})} · ${esc(d.city)}</span><h3>${esc(d.title)}</h3><small class="muted">夜宿：${esc(d.stay||'待补充')}</small><span class="day-zone">${esc(zoneLabel(d.timezone||trip.timezone,d.date+'T12:00:00Z',d.timezoneLabel))}</span></div></div><div class="day-content"><div class="day-tools"><div class="day-map-toolbar"><button type="button" id="map-toggle" class="day-map-toggle" aria-controls="daily-map-content" aria-expanded="false">🗺️ 当日地图</button>${routeLinks(navigationIds(d))}</div>${navigationNote(navigationIds(d))}<div class="daily-map-panel" id="daily-map-content" hidden><div class="journey-map-stage"><div id="journey-map" class="journey-map-canvas" role="region" aria-label="当日全部地点地图"></div><div class="journey-map-controls"><button type="button" data-map="overview">全览</button><button type="button" data-map="expand" aria-expanded="false">放大</button></div></div><p class="tiny">虚线为游览顺序示意 <span id="map-status" role="status"></span></p><div class="journey-map-stops">${[...new Set(d.routePlaceIds)].map((id,n)=>`<button type="button" data-stop="${esc(id)}"><b>${n+1}</b> ${esc(places.get(id)?.name)}${places.get(id)?.approximate?' · 区域示意':''}</button>`).join('')}</div>${d.mapNote?`<p class="tiny">${esc(d.mapNote)}</p>`:''}</div></div><div class="timeline">${d.events.map(e=>{const p=places.get(e.placeId);return `<div class="entry" data-event="${esc(e.id)}"><time>${eventTime(e,d)}</time><div><div class="entry-heading"><h3>${esc(e.title)}${p?` · ${placeLink(e.placeId,true,e.id)}`:''}${e.status?` <span class="task-badge">${esc(e.status)}</span>`:''}</h3><div class="entry-actions"><button type="button" class="guide-add" data-guide-add="${esc(e.id)}" aria-label="为${esc(e.title)}添加小红书攻略" title="小红书攻略">🍠</button><button type="button" class="reference-button" data-reference="${esc(e.placeId?'place:'+e.placeId:'event:'+e.id)}" data-reference-name="${esc(p?.name||e.title)}" aria-label="${esc(p?.name||e.title)}出片指南" title="出片指南">📸</button></div></div>${hasIntro(p)?`<p id="intro-${esc(e.id)}" class="place-intro" hidden>${esc(p.intro)}</p>`:''}${e.note?`<p>${esc(e.note)}</p>`:''}<div class="guide-links" data-guide-slot="${esc(e.id)}"></div></div></div>`;}).join('')}</div></div></article>`;
    document.querySelectorAll('.day-tab').forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;});renderGuides();
    $('#map-toggle').onclick=e=>{const open=$('#daily-map-content').hidden;$('#daily-map-content').hidden=!open;e.currentTarget.setAttribute('aria-expanded',String(open));if(open)openMap(d);};
  }
  function renderDays(){
    $('#day-list').innerHTML=`<div class="day-tabs" role="tablist" aria-label="选择行程日期">${trip.days.map((d,i)=>`<button type="button" class="day-tab" role="tab" id="day-tab-${i}" aria-controls="day-panel" aria-selected="false" tabindex="-1" data-day="${i}" style="--day:${esc(d.color||'#7148A1')}"><span>D${i+1}</span><strong>${dateLabel(d.date)}</strong><small>${esc(d.label||d.city)}</small></button>`).join('')}</div><div id="day-panel" role="tabpanel" tabindex="0"></div>`;
    const found=trip.days.findIndex(d=>d.date===localDate(d.timezone||trip.timezone));renderDay(found<0?0:found);
    const select=i=>{renderDay(i);$('#day-panel').setAttribute('aria-labelledby','day-tab-'+i);const b=$(`#day-tab-${i}`);b.scrollIntoView({block:'nearest',inline:'center'});};
    document.querySelectorAll('[data-day]').forEach(b=>{b.onclick=()=>select(Number(b.dataset.day));b.onkeydown=e=>{const n=e.key==='ArrowRight'?Math.min(activeDay+1,trip.days.length-1):e.key==='ArrowLeft'?Math.max(0,activeDay-1):e.key==='Home'?0:e.key==='End'?trip.days.length-1:null;if(n!==null){e.preventDefault();select(n);$(`#day-tab-${n}`).focus({preventScroll:true});}};});
  }
  function openMap(d) {
    if(mapState){mapState.map.invalidateSize();return;}
    const all=[...new Set(d.routePlaceIds)].map((id,n)=>({...places.get(id),ordinal:n+1}));const points=all.filter(p=>Array.isArray(p.coordinates));
    if(!points.length){$('#map-status').textContent='准确坐标待补充，可使用地点名称导航。';document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>{const p=places.get(b.dataset.stop);window.open(maps(p.query||p.name),'_blank','noopener');});return;}
    const map=L.map('journey-map',{scrollWheelZoom:false,maxZoom:19});
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
    tiles.on('tileerror',()=>$('#map-status')&&($('#map-status').textContent='底图加载失败，地点与顺序仍可查看。'));
    const bounds=L.latLngBounds(points.map(p=>p.coordinates));const fit=()=>{map.invalidateSize();map.fitBounds(bounds,{padding:[34,34],maxZoom:16,animate:false});};
    const route=d.routePlaceIds.map(id=>places.get(id)).filter(p=>p?.coordinates);
    L.polyline(route.map(p=>p.coordinates),{color:'#7148A1',weight:3,dashArray:'7 6'}).addTo(map);
    const markers=new Map();points.forEach((p,n)=>{const popup=document.createElement('div');popup.innerHTML=`<strong>${p.ordinal} · ${esc(p.name)}</strong><p>${p.approximate?'区域示意，准确点位待替换':''}</p><a href="${maps(p.query||p.name)}" target="_blank" rel="noopener">打开地图 ↗</a>`;const marker=L.marker(p.coordinates,{icon:L.divIcon({className:'template-map-marker',html:`<b>${p.ordinal}</b>`,iconSize:[28,28],iconAnchor:[14,14]})}).addTo(map).bindPopup(popup);markers.set(p.id,marker);});
    function expand(open){$('#daily-map-content').classList.toggle('template-map-expanded',open);document.body.classList.toggle('map-expanded-body',open);const b=$('[data-map="expand"]');b.textContent=open?'恢复':'放大';b.setAttribute('aria-expanded',String(open));requestAnimationFrame(fit);}
    const escape=e=>{if(e.key==='Escape')expand(false);};document.addEventListener('keydown',escape);mapState={map,markers,escape,fit};
    $('[data-map="overview"]').onclick=fit;$('[data-map="expand"]').onclick=()=>expand(!$('#daily-map-content').classList.contains('template-map-expanded'));document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>{const p=places.get(b.dataset.stop),marker=markers.get(p.id);if(marker){map.setView(p.coordinates,16);marker.openPopup();}else window.open(maps(p.query||p.name),'_blank','noopener');});requestAnimationFrame(fit);
  }
  function guideRows(id){return Object.values(state.guides).filter(g=>g.eventId===id&&!g.removed&&xhsUrl(g.url));}
  function renderGuides(){document.querySelectorAll('[data-guide-slot]').forEach(slot=>{slot.innerHTML=guideRows(slot.dataset.guideSlot).map(g=>`<span class="guide-note"><a href="${esc(xhsUrl(g.url))}" target="_blank" rel="noopener">🍠 ${esc(g.title||'小红书攻略')} ↗</a><button class="guide-add" type="button" data-guide-edit="${esc(g.id)}" aria-label="修改攻略">⋯</button></span>`).join('');});}
  function openGuide(eventId,id='') {const record=state.guides[id];guideContext={eventId,id};$('#guide-share').value=record?.url||'';$('#guide-text').value=record?.title||'';$('#guide-title').textContent=id?'修改小红书攻略':'添加小红书攻略';$('#guide-error').textContent='';$('#guide-remove').hidden=!id;$('#guide-dialog').showModal();}
  let packingEdit=null,packingBusy=false;
  function packingRows(){
    const categories=new Set(trip.packing.map(p=>p.category)),rows=new Map(trip.packing.map(p=>[p.id,{...p}]));
    for(const [id,row] of Object.entries(state.packingItems||{})){if(!row||!categories.has(row.category))continue;rows.set(id,{...rows.get(id),...row,id});}
    return [...rows.values()].filter(p=>!p.removed);
  }
  function renderPacking(){
    if(packingEdit)return;
    const openGroups=new Map([...document.querySelectorAll('[data-pack-category]')].map(el=>[el.dataset.packCategory,el.open]));
    const groups=new Map([...new Set(trip.packing.map(p=>p.category))].map(category=>[category,[]]));const all=packingRows();all.forEach(p=>groups.get(p.category).push(p));
    const count=rows=>rows.filter(p=>state.packing[p.id]).length;
    $('#packing-progress').textContent=`已收好 ${count(all)} / ${all.length} 组`;
    $('#packing-groups').innerHTML=[...groups].map(([category,rows])=>`<details class="list-group" data-pack-category="${esc(category)}" ${openGroups.get(category)===false?'':'open'}><summary>${esc(category)} <span>${count(rows)} / ${rows.length}</span></summary><ul class="checklist">${rows.map(p=>`<li data-pack-row="${esc(p.id)}" class="${state.packing[p.id]?'completed':''}"><input type="checkbox" data-pack="${esc(p.id)}" aria-label="收好：${esc(p.text)}" ${state.packing[p.id]?'checked':''}><span class="pack-text" role="button" tabindex="0" aria-label="修改：${esc(p.text)}">${esc(p.text)}</span></li>`).join('')}</ul><button type="button" class="pack-add" data-pack-add="${esc(category)}" aria-label="添加${esc(category)}物品">+</button></details>`).join('');
    $('#packing-groups').querySelectorAll('input,button').forEach(el=>el.disabled=packingBusy);
    observeCardGrids();
  }
  function editPacking(li,isNew=false){
    if(packingEdit||packingBusy)return;
    const span=li.querySelector('.pack-text'),old=span?.textContent||'',input=document.createElement('textarea');input.className='pack-editor';input.rows=1;input.maxLength=500;input.value=old;input.placeholder='输入物品名称';input.setAttribute('aria-label',isNew?'输入新物品':'修改物品');input.setAttribute('enterkeyhint','done');
    packingEdit={li,input,old,isNew,category:li.closest('[data-pack-category]').dataset.packCategory};
    if(span)span.replaceWith(input);else li.append(input);li.classList.add('pack-editing');
    $('#packing-groups').querySelectorAll('input,button').forEach(el=>el.disabled=true);
    const resize=()=>{input.style.height='auto';input.style.height=input.scrollHeight+'px'};input.oninput=resize;
    input.onkeydown=e=>{if(e.isComposing)return;if(e.key==='Escape'){e.preventDefault();packingEdit=null;renderPacking();}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();savePackingEdit();}};
    input.onblur=savePackingEdit;input.focus();resize();input.setSelectionRange(input.value.length,input.value.length);
  }
  async function savePackingEdit(){
    const edit=packingEdit;if(!edit||packingBusy)return;const text=edit.input.value.trim();
    if((edit.isNew&&!text)||(!edit.isNew&&text===edit.old)){packingEdit=null;renderPacking();return;}
    packingBusy=true;
    if(!text&&!confirm('删除这项行李？')){packingBusy=false;packingEdit=null;renderPacking();return;}
    edit.input.disabled=true;const next=clone(state),id=edit.li.dataset.packRow;next.packingItems||={};
    next.packingItems[id]={id,category:edit.category,text:text||edit.old,removed:!text};if(!text)delete next.packing[id];
    if(await persist(next)){packingEdit=null;packingBusy=false;renderPacking();}
    else{packingBusy=false;edit.input.disabled=false;edit.input.focus();}
  }
  function renderShopping(){const rows=state.shopping;$('#shopping-count').textContent=`共 ${rows.length} 件 · 当前浏览器保存`;$('#shopping-list').innerHTML=rows.length?rows.map(p=>`<li><button type="button" class="wish-image" data-wish="${esc(p.id)}" aria-label="预览${esc(p.name)}图片">${p.photo&&/^data:image\/(?:png|jpeg|webp);base64,/.test(p.photo)?`<img src="${esc(p.photo)}" alt="">`:'＋ 图'}</button><div class="wish-text">${esc(p.name)}</div><button type="button" class="wish-delete-row" data-delete-wish="${esc(p.id)}">删除</button></li>`).join(''):'<li class="shopping-empty">还没有商品，想到想买的东西就加在这里。</li>';}
  async function photoData(file) {if(!file||!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('请选择20 MB以内的图片。');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const ratio=Math.min(1,640/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*ratio);canvas.height=Math.round(img.naturalHeight*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.7);}finally{URL.revokeObjectURL(url);}}
  function openWish(id){wishContext=id;const row=state.shopping.find(p=>p.id===id);if(!row)return;$('#wish-dialog-title').textContent=row.name;$('#wish-dialog-image').hidden=!row.photo;$('#wish-dialog-empty').hidden=!!row.photo;$('#wish-dialog-image').src=row.photo||'';$('#wish-dialog-change').textContent=row.photo?'换照片':'上传照片';$('#wish-dialog-remove').hidden=!row.photo;$('#wish-error').textContent='';if(!$('#wish-photo-dialog').open)$('#wish-photo-dialog').showModal();}
  function renderTodos(){const tasks=[...trip.todos].sort((a,b)=>a.deadline&&b.deadline?Date.parse(a.deadline)-Date.parse(b.deadline):a.deadline?-1:b.deadline?1:0);$('#todo-list').innerHTML=tasks.length?tasks.map(t=>`<li class="task"><time>${esc(t.timingLabel||'时间待确认')}</time><div><strong>${esc(t.title)}</strong><p>${esc(t.description||'')}</p>${t.deadline?`<button type="button" class="calendar-link" data-calendar="${esc(t.id)}">加入日历</button>`:''}</div></li>`).join(''):'<li class="tiny">暂无出发前提醒，AI 会随行程更新。</li>';}
  function downloadCalendar(id){const t=trip.todos.find(t=>t.id===id);if(!t?.deadline)return;const start=new Date(Date.parse(t.deadline)-(t.calendarLeadHours??24)*3600000),f=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const q=s=>String(s||'').replace(/[\\,;]/g,c=>'\\'+c).replace(/\n/g,'\\n');const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Penguin Travel//ZH','BEGIN:VEVENT','UID:'+q(trip.id+'-'+t.id)+'@penguin.local','DTSTAMP:'+f(new Date()),'DTSTART:'+f(start),'DTEND:'+f(new Date(+start+1800000)),'SUMMARY:'+q(t.title),'DESCRIPTION:'+q(t.description)+'\\n截止：'+q(t.deadline),'BEGIN:VALARM','TRIGGER:-PT0M','ACTION:DISPLAY','DESCRIPTION:'+q(t.title),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='旅行提醒.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  let referenceKey='',referenceIndex=0,referenceBusy=false;
  function referenceRows(){return Object.values(state.photoGuides||{}).filter(r=>r.placeKey===referenceKey&&!r.removed&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(r.photo||'')).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))||a.id.localeCompare(b.id));}
  function renderReferences(){const rows=referenceRows();referenceIndex=Math.min(referenceIndex,Math.max(0,rows.length-1));const row=rows[referenceIndex];$('#reference-image').hidden=!row;$('#reference-image').src=row?.photo||'';$('#reference-empty').hidden=!!row;$('#reference-count').textContent=row?`${referenceIndex+1} / ${rows.length}`:'0 张';$('#reference-prev').disabled=referenceBusy||referenceIndex===0;$('#reference-next').disabled=referenceBusy||referenceIndex>=rows.length-1;$('#reference-remove').hidden=!row;for(const id of ['reference-add','reference-remove','reference-close'])$('#'+id).disabled=referenceBusy;}
  async function referenceImage(file){if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('请选择20 MB以内的图片');const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();let edge=Math.min(1400,Math.max(img.naturalWidth,img.naturalHeight));for(let i=0;i<10;i++){const scale=edge/Math.max(img.naturalWidth,img.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);const value=c.toDataURL('image/jpeg',.82);if(value.length<=220000)return value;edge*=.84;}throw Error('图片压缩失败，请换一张');}finally{URL.revokeObjectURL(url);}}
  function bindReferences(){
    document.body.insertAdjacentHTML('beforeend',`<dialog id="reference-dialog" class="reference-dialog" aria-labelledby="reference-title"><div class="reference-head"><strong id="reference-title">出片指南</strong><button type="button" id="reference-close" aria-label="关闭">×</button></div><div class="reference-stage" id="reference-stage"><img id="reference-image" alt="拍照打卡参考图" hidden><p id="reference-empty">还没有参考图，添加你喜欢的姿势或构图吧。</p></div><div class="reference-controls"><button type="button" id="reference-prev" aria-label="上一张">‹</button><span id="reference-count"></span><button type="button" id="reference-next" aria-label="下一张">›</button></div><div class="reference-controls"><button type="button" id="reference-add">添加参考图</button><button type="button" id="reference-remove">删除此图</button><input type="file" id="reference-files" accept="image/*" multiple hidden></div><p class="tiny" id="reference-status" role="status"></p></dialog>`);
    $('#day-list').addEventListener('click',e=>{const b=e.target.closest('[data-reference]');if(!b)return;referenceKey=b.dataset.reference;referenceIndex=0;$('#reference-title').textContent=b.dataset.referenceName+' · 出片指南';$('#reference-status').textContent='';renderReferences();$('#reference-dialog').showModal();});
    $('#reference-close').onclick=()=>$('#reference-dialog').close();$('#reference-dialog').addEventListener('cancel',e=>{if(referenceBusy)e.preventDefault();});
    const move=step=>{if(referenceBusy)return;referenceIndex=Math.max(0,Math.min(referenceRows().length-1,referenceIndex+step));renderReferences();};
    $('#reference-prev').onclick=()=>move(-1);$('#reference-next').onclick=()=>move(1);$('#reference-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);});
    let swipe;$('#reference-stage').addEventListener('touchstart',e=>{swipe=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});$('#reference-stage').addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe[0],dy=e.changedTouches[0].clientY-swipe[1];swipe=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1);},{passive:true});
    $('#reference-add').onclick=()=>$('#reference-files').click();
    $('#reference-files').onchange=async e=>{const files=[...e.target.files];if(referenceBusy||!files.length)return;referenceBusy=true;renderReferences();let saved=0;try{for(const file of files){$('#reference-status').textContent=`正在保存 ${saved+1} / ${files.length}…`;const photo=await referenceImage(file),next=clone(state),id=uid('reference');next.photoGuides||={};next.photoGuides[id]={id,placeKey:referenceKey,photo,createdAt:new Date().toISOString(),removed:false};if(!await persist(next))throw Error('保存失败，请检查存储空间或网络后重试');saved++;}e.target.value='';$('#reference-status').textContent=`已保存 ${saved} 张参考图。`;}catch(error){$('#reference-status').textContent=`${saved?'已保存 '+saved+' 张；':''}${error.message}。原图仍保留，请重新选择未保存的图片重试。`;}finally{referenceBusy=false;renderReferences();}};
    $('#reference-remove').onclick=async()=>{const row=referenceRows()[referenceIndex];if(referenceBusy||!row||!confirm('删除这张参考图？'))return;referenceBusy=true;renderReferences();const next=clone(state);next.photoGuides[row.id]={...row,removed:true,photo:'',updatedAt:new Date().toISOString()};if(await persist(next))$('#reference-status').textContent='已删除。';else $('#reference-status').textContent='删除失败，原图仍保留，请重试。';referenceBusy=false;renderReferences();};
  }

  function bind() {
    document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.close)document.getElementById(b.dataset.close).close();if(b.dataset.intro){const p=document.getElementById('intro-'+b.dataset.intro);p.hidden=!p.hidden;b.setAttribute('aria-expanded',String(!p.hidden));}if(b.dataset.guideAdd)openGuide(b.dataset.guideAdd);if(b.dataset.guideEdit){const g=state.guides[b.dataset.guideEdit];openGuide(g.eventId,g.id);}if(b.dataset.wish)openWish(b.dataset.wish);if(b.dataset.deleteWish){const next=clone(state);next.shopping=next.shopping.filter(p=>p.id!==b.dataset.deleteWish);if(await persist(next))renderShopping();}if(b.dataset.calendar)downloadCalendar(b.dataset.calendar);});
    $('#packing-groups').onchange=async e=>{if(!e.target.dataset.pack||packingBusy||packingEdit)return;packingBusy=true;$('#packing-groups').querySelectorAll('input,button').forEach(el=>el.disabled=true);const next=clone(state);next.packing[e.target.dataset.pack]=e.target.checked;await persist(next);packingBusy=false;renderPacking();};
    $('#packing-groups').onclick=e=>{const add=e.target.closest('[data-pack-add]');if(add){if(packingEdit||packingBusy)return;const group=add.closest('details');group.open=true;const li=document.createElement('li');li.dataset.packRow=uid('pack');group.querySelector('ul').append(li);editPacking(li,true);return;}const text=e.target.closest('.pack-text');if(text)editPacking(text.closest('li'));};
    $('#packing-groups').onkeydown=e=>{if(e.target.matches('.pack-text')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();editPacking(e.target.closest('li'));}};
    $('#guide-share').oninput=()=>{const p=parseShare($('#guide-share').value);if(p.title&&!$('#guide-text').value)$('#guide-text').value=p.title;};
    $('#guide-form').onsubmit=async e=>{e.preventDefault();const parsed=parseShare($('#guide-share').value);if(!parsed.url){$('#guide-error').textContent='请粘贴有效的小红书链接或分享口令。';return;}const next=clone(state),id=guideContext.id||uid('guide');next.guides[id]={id,eventId:guideContext.eventId,url:parsed.url,title:$('#guide-text').value.trim()||parsed.title||'小红书攻略'};if(await persist(next)){renderGuides();$('#guide-dialog').close();}else $('#guide-error').textContent='保存失败，输入已保留。';};
    $('#guide-remove').onclick=async()=>{const next=clone(state);next.guides[guideContext.id]={...next.guides[guideContext.id],removed:true};if(await persist(next)){renderGuides();$('#guide-dialog').close();}};
    $('#shopping-photo').onchange=async e=>{photoBusy=true;$('#shopping-form button').disabled=true;try{pendingPhoto=await photoData(e.target.files[0]);$('#shopping-photo-hint').textContent='已选图片';$('#shopping-photo-hint').classList.add('has-photo');}catch(error){$('#shopping-status').textContent=error.message;}finally{photoBusy=false;$('#shopping-form button').disabled=false;}};
    $('#shopping-form').onsubmit=async e=>{e.preventDefault();if(photoBusy)return;const name=$('#shopping-name').value.trim();if(!name)return;const next=clone(state);next.shopping.push({id:uid('wish'),name,photo:pendingPhoto});if(await persist(next)){renderShopping();e.target.reset();pendingPhoto='';$('#shopping-photo-hint').textContent='';$('#shopping-status').textContent='';$('#shopping-photo-hint').classList.remove('has-photo');}else $('#shopping-status').textContent='添加失败，请检查存储后重试。';};
    $('#wish-dialog-file').onchange=async e=>{try{const targetId=wishContext,photo=await photoData(e.target.files[0]),next=clone(state);const row=next.shopping.find(p=>p.id===targetId);if(!row)return;row.photo=photo;if(await persist(next)){renderShopping();openWish(wishContext);}else $('#wish-error').textContent='图片保存失败。';}catch(error){$('#wish-error').textContent=error.message;}e.target.value='';};
    $('#wish-dialog-remove').onclick=async()=>{const next=clone(state);next.shopping.find(p=>p.id===wishContext).photo='';if(await persist(next)){renderShopping();openWish(wishContext);}};
  }
  async function init(){
    const response=await fetch('trip-data.json',{cache:'no-store'});if(!response.ok)throw Error('旅行资料读取失败');trip=await response.json();if(!trip.id||!trip.days?.length||!trip.places)throw Error('请先运行资料验证，补齐旅行ID和每日行程。');places=new Map(trip.places.map(p=>[p.id,p]));
    const seed={packing:{},packingItems:{},shopping:trip.shopping||[],guides:{},photoGuides:{}};for(const d of trip.days)for(const e of d.events)for(const g of e.guides||[])seed.guides[g.id]={...g,eventId:e.id};state=PenguinStorage.read(trip.id,'page',seed);state.packingItems||={};for(const [id,g] of Object.entries(seed.guides))if(!(id in state.guides))state.guides[id]=g;
    document.title=trip.title;$('#brand').firstChild.textContent=trip.title;const dates=`${trip.startDate}—${trip.endDate} · ${dayCount()} DAYS`;$('#header-dates').textContent=dates;$('#cover-title').textContent=trip.title;$('#cover-destination').textContent=trip.subtitle;$('#cover-dates').textContent=dates;$('#overview-dates').textContent=`${dayCount()} 天`;$('#cover-photo').src=safeUrl(trip.coverImage)||'assets/cover.svg';$('#demo-note').hidden=!trip.demo;
    renderOverview();renderBookings();renderDays();renderPacking();renderShopping();renderTodos();bind();bindReferences();window.addEventListener('resize',balanceCardGrids);tick();setInterval(tick,1000);
    await TravelLedger.init({root:'#ledger-root',tripId:trip.id,configUrl:false,adapter:PenguinStorage.ledgerAdapter(trip.id,trip.ledger)});
    window.PenguinTravel={getTrip:()=>clone(trip),getPageState:()=>clone(state),tick,parseShare,routeUrl,routeSegments};
  }
  init().catch(error=>{$('#next-title').textContent='页面资料或存储暂时无法读取';$('#next-detail').textContent=error.message+'。请保留原数据，检查资料文件和浏览器存储后重新打开。';$('#storage-status').textContent='载入失败，未覆盖已有数据';console.error(error);});
})();
