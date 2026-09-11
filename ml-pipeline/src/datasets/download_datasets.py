# Dataset Download Helper for AgriSmart AI
# Downloads PlantVillage (color) and PlantDoc datasets from public GitHub repositories
import os
import sys
import zipfile
import urllib.request
import shutil
import argparse

def resolve_path(path):
    if os.path.isabs(path) and os.path.exists(path):
        return path
    candidates = [
        path,
        os.path.abspath(path),
        os.path.join(os.path.dirname(__file__), "..", "..", path),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", path)
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return os.path.abspath(path)

def download_file(url, dest_path):
    """Download a file with progress reporting."""
    print(f"[Download] Fetching: {url}")
    print(f"[Download] Destination: {dest_path}")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    def reporthook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, downloaded * 100 / total_size)
            mb_down = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            sys.stdout.write(f"\r[Download] {mb_down:.1f} / {mb_total:.1f} MB ({pct:.0f}%)")
            sys.stdout.flush()
        else:
            mb_down = downloaded / (1024 * 1024)
            sys.stdout.write(f"\r[Download] {mb_down:.1f} MB downloaded")
            sys.stdout.flush()

    urllib.request.urlretrieve(url, dest_path, reporthook)
    print()
    print(f"[Download] Saved: {dest_path} ({os.path.getsize(dest_path) / (1024*1024):.1f} MB)")

def extract_zip(zip_path, extract_to):
    """Extract a zip archive."""
    print(f"[Extract] Extracting: {zip_path}")
    print(f"[Extract] Target: {extract_to}")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(extract_to)
    print(f"[Extract] Done.")

def find_image_root(base_dir):
    """Walk extracted dirs to find the actual image class folders."""
    # Look for the directory that has class subdirectories with images
    for root, dirs, files in os.walk(base_dir):
        # Skip __MACOSX and hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__MACOSX']
        # Check if any child directory contains image files
        has_image_child = False
        for d in dirs:
            child = os.path.join(root, d)
            child_files = os.listdir(child)
            image_files = [f for f in child_files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp'))]
            if len(image_files) > 0:
                has_image_child = True
                break
        if has_image_child and len(dirs) >= 3:
            return root
    return base_dir

def move_class_dirs(src_root, dest_dir):
    """Move class directories from extracted location to target."""
    os.makedirs(dest_dir, exist_ok=True)
    moved = 0
    for item in sorted(os.listdir(src_root)):
        src_item = os.path.join(src_root, item)
        if os.path.isdir(src_item) and not item.startswith('.') and item != '__MACOSX':
            dest_item = os.path.join(dest_dir, item)
            if os.path.exists(dest_item):
                print(f"[Move] Merging into existing: {item}")
                for f in os.listdir(src_item):
                    src_f = os.path.join(src_item, f)
                    dst_f = os.path.join(dest_item, f)
                    if os.path.isfile(src_f) and not os.path.exists(dst_f):
                        shutil.copy2(src_f, dst_f)
            else:
                shutil.move(src_item, dest_item)
            moved += 1
    return moved

def download_plantvillage(dest_dir, cache_dir):
    """Download PlantVillage color dataset from GitHub."""
    dest_dir = resolve_path(dest_dir)

    # Check if already populated
    if os.path.exists(dest_dir):
        existing = [d for d in os.listdir(dest_dir) if os.path.isdir(os.path.join(dest_dir, d))]
        if len(existing) >= 10:
            print(f"[PlantVillage] Already populated with {len(existing)} class directories. Skipping download.")
            return True

    # PlantVillage color images from the official spMohanty repository
    url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
    zip_path = os.path.join(cache_dir, "plantvillage_master.zip")
    extract_dir = os.path.join(cache_dir, "plantvillage_extracted")

    os.makedirs(cache_dir, exist_ok=True)

    if not os.path.exists(zip_path):
        print("[PlantVillage] Downloading from GitHub (this is a large download ~2.5 GB)...")
        download_file(url, zip_path)
    else:
        print(f"[PlantVillage] Using cached archive: {zip_path}")

    if not os.path.exists(extract_dir):
        os.makedirs(extract_dir, exist_ok=True)
        extract_zip(zip_path, extract_dir)

    # The color images are typically in: PlantVillage-Dataset-master/raw/color/
    color_dir = None
    for candidate in [
        os.path.join(extract_dir, "PlantVillage-Dataset-master", "raw", "color"),
        os.path.join(extract_dir, "PlantVillage-Dataset-master", "raw", "Color"),
    ]:
        if os.path.exists(candidate):
            color_dir = candidate
            break

    if color_dir is None:
        # Fallback: search for the directory with many class subdirs
        color_dir = find_image_root(extract_dir)
        print(f"[PlantVillage] Auto-detected image root: {color_dir}")

    moved = move_class_dirs(color_dir, dest_dir)
    print(f"[PlantVillage] Installed {moved} class directories into {dest_dir}")
    return moved > 0

def download_plantdoc(dest_dir, cache_dir):
    """Download PlantDoc dataset from GitHub."""
    dest_dir = resolve_path(dest_dir)

    # Check if already populated
    if os.path.exists(dest_dir):
        existing = [d for d in os.listdir(dest_dir) if os.path.isdir(os.path.join(dest_dir, d))]
        if len(existing) >= 5:
            print(f"[PlantDoc] Already populated with {len(existing)} class directories. Skipping download.")
            return True

    url = "https://github.com/pratikkayal/PlantDoc-Dataset/archive/refs/heads/master.zip"
    zip_path = os.path.join(cache_dir, "plantdoc_master.zip")
    extract_dir = os.path.join(cache_dir, "plantdoc_extracted")

    os.makedirs(cache_dir, exist_ok=True)

    if not os.path.exists(zip_path):
        print("[PlantDoc] Downloading from GitHub (~50 MB)...")
        download_file(url, zip_path)
    else:
        print(f"[PlantDoc] Using cached archive: {zip_path}")

    if not os.path.exists(extract_dir):
        os.makedirs(extract_dir, exist_ok=True)
        extract_zip(zip_path, extract_dir)

    # PlantDoc typically has train/ and test/ subdirectories with class folders inside
    # We want to merge all class folders into our raw plantdoc dir
    pd_root = None
    for candidate in [
        os.path.join(extract_dir, "PlantDoc-Dataset-master"),
        os.path.join(extract_dir, "PlantDoc-Dataset-master", "train"),
    ]:
        if os.path.exists(candidate):
            pd_root = candidate
            break

    if pd_root is None:
        pd_root = find_image_root(extract_dir)

    # PlantDoc has train/ and test/ subdirectories — merge both into our raw dir
    total_moved = 0
    for split_name in ['train', 'test']:
        split_dir = os.path.join(pd_root, split_name)
        if not os.path.exists(split_dir):
            # Maybe the root itself is the split
            split_dir = pd_root
        if os.path.exists(split_dir):
            moved = move_class_dirs(split_dir, dest_dir)
            total_moved += moved
            print(f"[PlantDoc] Installed {moved} class directories from '{split_name}' split")

    print(f"[PlantDoc] Total: {total_moved} class directories into {dest_dir}")
    return total_moved > 0

def main():
    parser = argparse.ArgumentParser(description="Download PlantVillage and PlantDoc datasets")
    parser.add_argument("--plantvillage-dir", type=str, default="ml-pipeline/data/raw/plantvillage")
    parser.add_argument("--plantdoc-dir", type=str, default="ml-pipeline/data/raw/plantdoc")
    parser.add_argument("--cache-dir", type=str, default="ml-pipeline/data/raw/.cache")
    parser.add_argument("--skip-plantvillage", action="store_true", help="Skip PlantVillage download")
    parser.add_argument("--skip-plantdoc", action="store_true", help="Skip PlantDoc download")
    args = parser.parse_args()

    print("==================================================")
    print("AGRISMART AI - DATASET ACQUISITION UTILITY")
    print("==================================================")
    print("Sources:")
    print("  PlantVillage: https://github.com/spMohanty/PlantVillage-Dataset")
    print("  PlantDoc:     https://github.com/pratikkayal/PlantDoc-Dataset")
    print("==================================================")

    if not args.skip_plantvillage:
        download_plantvillage(args.plantvillage_dir, args.cache_dir)
    else:
        print("[PlantVillage] Skipped.")

    print()
    if not args.skip_plantdoc:
        download_plantdoc(args.plantdoc_dir, args.cache_dir)
    else:
        print("[PlantDoc] Skipped.")

    print()
    print("==================================================")
    print("[DONE] Dataset acquisition complete.")
    print("Next step: Run class intersection analysis.")
    print("==================================================")

if __name__ == "__main__":
    main()
