#!/usr/bin/env python3
"""Validate the reusable template's trip-data.json without changing it."""
import argparse,json,math,re,sys
from datetime import date,datetime
from pathlib import Path
from zoneinfo import ZoneInfo

def validate(data):
    errors=[];ids=set()
    def check(ok,message):
        if not ok:errors.append(message)
    def record(row,label):
        item=row.get('id');check(isinstance(item,str) and bool(re.fullmatch(r'[A-Za-z0-9_-]+',item)),label+': use a stable ASCII id')
        check(item not in ids,label+': duplicate id '+str(item));ids.add(item)
    def zone(value,label):
        try:ZoneInfo(value)
        except Exception:errors.append(label+': invalid IANA timezone')
    def timestamp(value,label):
        try:
            parsed=datetime.fromisoformat(value.replace('Z','+00:00'));check(parsed.tzinfo is not None,label+': explicit timezone required');return parsed
        except Exception:errors.append(label+': invalid timestamp');return None
    check(data.get('schemaVersion')==3,'schemaVersion must be 3');record(data,'trip');check(bool(data.get('title')),'title required');zone(data.get('timezone'),'trip')
    try:
        start=date.fromisoformat(data['startDate']);end=date.fromisoformat(data['endDate']);check(end>=start,'endDate before startDate')
    except Exception:errors.append('startDate/endDate must be ISO dates');start=end=None
    places={}
    for p in data.get('places',[]):
        record(p,'place');places[p.get('id')]=p;check(bool(p.get('name')),'place name required')
        if 'showIntro' in p:check(isinstance(p['showIntro'],bool),'showIntro must be boolean')
        if 'kind' in p:check(p['kind'] in ['sight','district','experience','restaurant','cafe','shop','airport','station','hotel','logistics'],'invalid place kind')
        if 'navigationLabel' in p:check(isinstance(p['navigationLabel'],str) and bool(p['navigationLabel'].strip()),'navigationLabel must be nonempty text')
        coords=p.get('coordinates')
        if coords is not None:check(isinstance(coords,list) and len(coords)==2 and all(isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x) for x in coords) and -90<=coords[0]<=90 and -180<=coords[1]<=180,'invalid coordinates for '+str(p.get('id')))
    def place(value,label):check(value in places,label+': unknown place '+str(value))
    check(bool(data.get('days')),'at least one day required');previous='';events=set()
    for d in data.get('days',[]):
        record(d,'day');zone(d.get('timezone',data.get('timezone')),'day');value=d.get('date','')
        try:
            parsed=date.fromisoformat(value);check(start is None or start<=parsed<=end,'day outside trip range')
        except Exception:errors.append('invalid day date')
        check(value>previous,'days must be ordered, unique');previous=value
        for pid in d.get('routePlaceIds',[]):place(pid,'route')
        if 'navigationPlaceIds' in d:
            check(isinstance(d['navigationPlaceIds'],list) and bool(d['navigationPlaceIds']),'navigationPlaceIds must be a nonempty list')
            for pid in d['navigationPlaceIds']:place(pid,'navigation');check(pid in d.get('routePlaceIds',[]),'navigation place must be in daily map route')
        prior=-1
        for e in d.get('events',[]):
            record(e,'event');events.add(e.get('id'));check(bool(e.get('title')),'event title required')
            if e.get('placeId'):place(e['placeId'],'event')
            try:
                h,m=map(int,e['start'].split(':'));minute=h*60+m;check(0<=h<24 and 0<=m<60,'invalid event start');check(minute>=prior,'event times must be ordered');prior=minute
                if e.get('end'):check(bool(re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',e['end'])),'invalid event end')
            except Exception:errors.append('event start must be HH:MM')
            if e.get('timezone'):zone(e['timezone'],'event')
            for g in e.get('guides',[]):
                record(g,'guide');check(bool(re.match(r'^https://(?:[\w-]+\.)*(?:xiaohongshu\.com|xhslink\.(?:com|cn))/',g.get('url',''))),'guide must be a Xiaohongshu URL')
    cities=set()
    overview=data.get('overview',{})
    def pair(value,low,high):return isinstance(value,list) and len(value)==2 and all(isinstance(x,(int,float)) and not isinstance(x,bool) and math.isfinite(x) and low<=x<=high for x in value)
    if overview.get('canvas'):
        check(all(isinstance(overview['canvas'].get(k),(int,float)) and not isinstance(overview['canvas'].get(k),bool) and math.isfinite(overview['canvas'][k]) and 200<=overview['canvas'][k]<=4000 for k in ['width','height']),'overview canvas requires finite width/height 200–4000')
    for c in overview.get('cities',[]):
        record(c,'city');cities.add(c.get('id'));check(bool(c.get('name')),'overview city name required')
        if 'position' in c:check(pair(c['position'],0,1),'overview position must be normalized [x,y]')
        if overview.get('mapImage'):check('position' in c,'overview background requires each city position')
        if 'coordinates' in c:check(pair(c['coordinates'],-180,180) and -90<=c['coordinates'][0]<=90,'overview city coordinates must be [lat,lon]')
        if 'labelOffset' in c:check(pair(c['labelOffset'],-4000,4000),'overview labelOffset invalid')
        if 'labelAnchor' in c:check(c['labelAnchor'] in ['start','middle','end'],'overview labelAnchor invalid')
    for leg in data.get('overview',{}).get('legs',[]):check(leg.get('from') in cities and leg.get('to') in cities,'overview leg references unknown city')
    for e in data.get('importantEvents',[]):record(e,'important event');timestamp(e.get('at'),'important event')
    bookings=data.get('bookings',{})
    for f in bookings.get('flights',[]):
        record(f,'flight');previous_arrival=None
        for seg in f.get('segments',[]):
            a=timestamp(seg.get('departure'),'flight departure');b=timestamp(seg.get('arrival'),'flight arrival');zone(seg.get('departureZone'),'departureZone');zone(seg.get('arrivalZone'),'arrivalZone')
            if a and b and a.tzinfo and b.tzinfo:check(b>a,'flight must arrive after departure');check(previous_arrival is None or a>previous_arrival,'connection before preceding arrival');previous_arrival=b
    for h in bookings.get('hotels',[]):
        record(h,'hotel')
        if h.get('placeId'):place(h['placeId'],'hotel')
        for room in h.get('rooms',[]):
            try:check(date.fromisoformat(room['checkOut'])>date.fromisoformat(room['checkIn']),'hotel checkout must follow checkin')
            except Exception:errors.append('invalid hotel dates')
            check(not any(x in room for x in ['price','orderNumber','email']),'private hotel fields do not belong in display data')
    for row in bookings.get('pending',[]):
        record(row,'pending booking')
        if row.get('placeId'):place(row['placeId'],'pending booking')
    for p in data.get('packing',[]):record(p,'packing group');check(bool(p.get('text')) and bool(p.get('category')),'packing text/category required')
    for p in data.get('shopping',[]):record(p,'shopping item');check(bool(p.get('name')),'shopping name required')
    for t in data.get('todos',[]):
        record(t,'todo');check(bool(t.get('timingLabel')),'todo time label required')
        if t.get('deadline'):timestamp(t['deadline'],'todo deadline')
        if t.get('relatedEventId'):check(t['relatedEventId'] in events,'todo event reference invalid')
    ledger=data.get('ledger',{});people=set()
    for p in ledger.get('travelers',[]):record(p,'traveler');people.add(p.get('id'));check(bool(p.get('name')),'traveler name required')
    settings=ledger.get('settings',{});check(bool(re.fullmatch(r'[A-Z]{3}',settings.get('baseCurrency',''))),'baseCurrency must be ISO code')
    check(not settings.get('selfTravelerId') or settings['selfTravelerId'] in people,'self id must reference a traveler')
    for rate in settings.get('exchangeRates',{}).values():check(isinstance(rate,(int,float)) and not isinstance(rate,bool) and math.isfinite(rate) and rate>0,'rates must be finite and positive')
    for bill in ledger.get('bills',[]):
        record(bill,'bill');check(bill.get('payerId') in people and bool(bill.get('participantIds')) and set(bill.get('participantIds',[]))<=people,'bill people invalid')
        for field in ['originalAmountCents','baseAmountCents']:check(type(bill.get(field)) is int and bill[field]>0,'bill amounts must be positive minor-unit integers')
    return errors

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('data',type=Path);args=parser.parse_args()
    try:errors=validate(json.loads(args.data.read_text(encoding='utf-8')))
    except Exception as error:print('Invalid trip data:',error,file=sys.stderr);return 1
    if errors:
        for error in errors:print('- '+error,file=sys.stderr)
        return 1
    print('Trip data is valid. Verify actual facts, coordinates and travel buffers separately.');return 0
if __name__=='__main__':sys.exit(main())
