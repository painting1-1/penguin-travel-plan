#!/usr/bin/env python3
"""Copy the runnable penguin travel template into a new trip directory."""
import argparse,json,shutil,sys,uuid
from pathlib import Path
from validate_trip import validate

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--data',type=Path,help='Optional own trip-data.json; creates independent storage using its trip id')
    args=parser.parse_args();dest=args.output.resolve();root=Path(__file__).resolve().parents[1]
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):parser.error('Output must be a new or empty directory; refusing to overwrite.')
    data_path=args.data or root/'assets/template/trip-data.json'
    try:data=json.loads(data_path.read_text(encoding='utf-8'));errors=validate(data)
    except Exception as error:parser.error(str(error))
    if errors:parser.error('\n'.join(errors))
    if not args.data:data['id']='penguin-trip-'+uuid.uuid4().hex[:12]
    shutil.copytree(root/'assets/template',dest,dirs_exist_ok=True)
    (dest/'trip-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Runnable template prepared in {dest}. Replace trip-data.json and assets/cover.svg for your own journey.')
    print(f'Preview: python3 -m http.server 8000 --directory {dest}')
    print('Open http://localhost:8000/ . Default: local browser storage; no shared database or access protection.')
if __name__=='__main__':main()
