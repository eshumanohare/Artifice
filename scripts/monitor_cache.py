#!/usr/bin/env python3
"""
Cache monitoring script to check file sizes and clean up if needed
"""

import json
import time
from pathlib import Path

def monitor_cache_files():
    """Monitor cache files and report their sizes"""
    cache_dir = Path(__file__).parent.parent / '.cache'
    
    if not cache_dir.exists():
        print("❌ Cache directory not found")
        return
    
    print("📊 Cache File Sizes:")
    print("=" * 40)
    
    total_size = 0
    large_files = []
    
    for file_path in cache_dir.iterdir():
        if file_path.is_file():
            size = file_path.stat().st_size
            size_mb = size / 1024 / 1024
            total_size += size
            
            status = "⚠️" if size_mb > 1 else "✅"
            print(f"{status} {file_path.name}: {size_mb:.1f}MB")
            
            if size_mb > 5:  # Flag files larger than 5MB
                large_files.append(file_path)
    
    print(f"\n📁 Total cache size: {total_size / 1024 / 1024:.1f}MB")
    
    if large_files:
        print(f"\n⚠️  Warning: {len(large_files)} file(s) exceed 5MB:")
        for file_path in large_files:
            size_mb = file_path.stat().st_size / 1024 / 1024
            print(f"   - {file_path.name}: {size_mb:.1f}MB")
        
        print("\n💡 Consider running cleanup scripts or restarting streams")
    else:
        print("\n✅ All cache files are within reasonable size limits")

if __name__ == "__main__":
    print("=" * 50)
    print("Cache Monitor")
    print("=" * 50)
    monitor_cache_files()
