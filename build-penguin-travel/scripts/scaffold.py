#!/usr/bin/env python3
"""Prepare brand assets, demo data and a layout example; do not deploy a website."""
import argparse
import json
import shutil
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    dest = args.output.resolve()
    if dest.exists() and (not dest.is_dir() or any(dest.iterdir())):
        parser.error("Output must be a new or empty directory; refusing to overwrite.")
    root = Path(__file__).resolve().parents[1]
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / "assets/theme.css", dest / "theme.css")
    shutil.copy2(root / "assets/trip.example.json", dest / "trip.json")
    shutil.copy2(root / "assets/layout-example.html", dest / "layout-example.html")
    shutil.copytree(root / "assets/icons", dest / "icons")
    shutil.copy2(root / "LICENSE", dest / "LICENSE")
    manifest = {
        "name": "小企鹅旅行手册", "short_name": "企鹅旅行",
        "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#F8F4FB", "theme_color": "#7148A1",
        "icons": [
            {"src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png"}
        ]
    }
    (dest / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared assets and demo data in {dest}. Read layout-example.html first, then create the complete index.html.")
    print('HTML head: <link rel="stylesheet" href="./theme.css"><link rel="manifest" href="./site.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32.png">')

if __name__ == "__main__":
    main()
