# Fast Windows-Safe PlantDoc Git Object Recovery Utility
# Extracts image blobs directly from Git object database without checkout
import os
import sys
import re
import json
import time
import hashlib
import argparse
import subprocess
from PIL import Image

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
WINDOWS_INVALID_CHARS = re.compile(r'[<>:"|?*]')

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

def to_windows_extended_path(path):
    """Converts an absolute path to Windows extended-length path format (\\\\?\\) if on Windows."""
    abs_path = os.path.abspath(path)
    if os.name == 'nt' and not abs_path.startswith('\\\\?\\'):
        return '\\\\?\\' + abs_path
    return abs_path

def sanitize_component(comp):
    """Sanitizes a single directory or file name component for Windows filesystem."""
    sanitized = WINDOWS_INVALID_CHARS.sub('_', comp)
    # Truncate overly long component names (max 120 chars) to prevent MAX_PATH issues
    if len(sanitized) > 120:
        base, ext = os.path.splitext(sanitized)
        h = hashlib.sha256(sanitized.encode('utf-8')).hexdigest()[:8]
        sanitized = base[:100] + "_" + h + ext
    # Windows does not permit trailing dots or spaces in folder/file names
    sanitized = sanitized.rstrip('. ')
    if not sanitized:
        sanitized = "_"
    return sanitized

def sanitize_relative_path(rel_path):
    """Sanitizes all path components for Windows while preserving path structure and extension."""
    parts = rel_path.replace('\\', '/').split('/')
    sanitized_parts = []
    for p in parts:
        if not p:
            continue
        sanitized_parts.append(sanitize_component(p))
    return os.path.join(*sanitized_parts) if sanitized_parts else "_"

def get_git_tree_entries(git_repo_dir):
    """Retrieves all tracked blob objects and paths from git tree via 'git ls-tree -r -z HEAD'."""
    cmd = ['git', '-C', git_repo_dir, 'ls-tree', '-r', '-z', 'HEAD']
    res = subprocess.run(cmd, capture_output=True, check=True)
    raw_output = res.stdout

    entries = []
    # Entries are separated by null bytes (\0)
    raw_items = raw_output.split(b'\x00')
    for item in raw_items:
        if not item:
            continue
        try:
            # Format: "<mode> <type> <object_id>\t<path>"
            meta, path_bytes = item.split(b'\t', 1)
            parts = meta.split(b' ')
            if len(parts) >= 3:
                mode = parts[0].decode('ascii', errors='ignore')
                obj_type = parts[1].decode('ascii', errors='ignore')
                obj_id = parts[2].decode('ascii', errors='ignore')
                # Decode path using UTF-8 with surrogateescape or replace
                path_str = path_bytes.decode('utf-8', errors='replace')
                entries.append({
                    "mode": mode,
                    "type": obj_type,
                    "object_id": obj_id,
                    "raw_path": path_str
                })
        except Exception as e:
            print(f"[Warning] Failed to parse tree entry: {e}")
            continue

    return entries

class GitBatchExtractor:
    """Persistent 'git cat-file --batch' process for high-throughput blob extraction."""
    def __init__(self, git_repo_dir):
        self.proc = subprocess.Popen(
            ['git', '-C', git_repo_dir, 'cat-file', '--batch'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=1048576
        )

    def extract_blob(self, object_id):
        query = f"{object_id}\n".encode('ascii')
        self.proc.stdin.write(query)
        self.proc.stdin.flush()

        header = self.proc.stdout.readline()
        if not header:
            raise RuntimeError(f"Unexpected EOF while reading header for blob {object_id}")

        parts = header.strip().split(b' ')
        if len(parts) < 3 or parts[1] != b'blob':
            raise RuntimeError(f"Object {object_id} is not a blob: {header}")

        size = int(parts[2])
        # Read exact blob payload
        data = self.proc.stdout.read(size)
        # Read the trailing newline emitted by git cat-file
        trailing_nl = self.proc.stdout.read(1)

        return data

    def close(self):
        if self.proc:
            try:
                self.proc.stdin.close()
                self.proc.stdout.close()
                self.proc.stderr.close()
                self.proc.terminate()
            except Exception:
                pass

def run_recovery(repo_dir, output_dir, report_path):
    resolved_repo = resolve_path(repo_dir)
    resolved_out = resolve_path(output_dir)
    resolved_report = resolve_path(report_path)

    print("==================================================")
    print("AGRISMART AI - HIGH-SPEED PLANTDOC GIT RECOVERY")
    print("==================================================")
    print(f"[Repo] Source: {resolved_repo}")
    print(f"[Dest] Target: {resolved_out}")
    print(f"[Info] Inspecting git tree...")

    start_time = time.time()
    entries = get_git_tree_entries(resolved_repo)
    total_tracked = len(entries)
    print(f"[Repo] Total tracked paths: {total_tracked}")

    # Identify invalid windows characters count
    invalid_char_paths = [e for e in entries if '?' in e['raw_path'] or WINDOWS_INVALID_CHARS.search(e['raw_path'])]
    print(f"[Repo] Tracked paths with Windows-invalid characters: {len(invalid_char_paths)}")

    # Filter image blobs
    image_entries = []
    skipped_non_images = []
    for e in entries:
        if e['type'] == 'blob':
            ext = os.path.splitext(e['raw_path'])[1].lower()
            if ext in IMAGE_EXTENSIONS:
                image_entries.append(e)
            else:
                skipped_non_images.append(e['raw_path'])

    total_images = len(image_entries)
    print(f"[Repo] Target image blobs to extract: {total_images} (Skipped {len(skipped_non_images)} non-image files)")

    # 1. Smoke test on first 5 image blobs
    print("\n--- RUNNING SMOKE TEST (5 BLOBS) ---")
    smoke_extractor = GitBatchExtractor(resolved_repo)
    smoke_success = 0
    try:
        for i in range(min(5, len(image_entries))):
            test_entry = image_entries[i]
            data = smoke_extractor.extract_blob(test_entry['object_id'])
            if len(data) > 0:
                # Test opening with PIL in memory
                import io
                img = Image.open(io.BytesIO(data))
                img.verify()
                smoke_success += 1
        print(f"[Smoke Test] Successfully extracted and verified {smoke_success}/5 sample blobs in memory!")
    finally:
        smoke_extractor.close()

    if smoke_success == 0 and len(image_entries) > 0:
        raise RuntimeError("Smoke test failed: unable to decode sample git blobs.")

    # 2. Run Full Bulk Recovery
    print(f"\n--- RUNNING FULL BULK EXTRACTION ({total_images} IMAGES) ---")
    os.makedirs(resolved_out, exist_ok=True)
    extractor = GitBatchExtractor(resolved_repo)

    extracted_count = 0
    sanitized_count = 0
    collision_count = 0
    extraction_errors = []
    used_dest_paths = {}

    extracted_manifest = []

    try:
        for idx, entry in enumerate(image_entries, 1):
            raw_p = entry['raw_path']
            obj_id = entry['object_id']
            is_renamed = False

            if '?' in raw_p or WINDOWS_INVALID_CHARS.search(raw_p):
                is_renamed = True
                sanitized_count += 1

            rel_sanitized = sanitize_relative_path(raw_p)
            dest_full = os.path.join(resolved_out, rel_sanitized)

            # Collision check
            if dest_full in used_dest_paths and used_dest_paths[dest_full] != obj_id:
                collision_count += 1
                base, ext = os.path.splitext(dest_full)
                short_hash = obj_id[:8]
                dest_full = f"{base}_h{short_hash}{ext}"
                rel_sanitized = os.path.relpath(dest_full, resolved_out)

            used_dest_paths[dest_full] = obj_id

            try:
                blob_data = extractor.extract_blob(obj_id)
                ext_dest = to_windows_extended_path(dest_full)
                os.makedirs(os.path.dirname(ext_dest), exist_ok=True)
                with open(ext_dest, 'wb') as f:
                    f.write(blob_data)
                extracted_count += 1
                extracted_manifest.append({
                    "raw_path": raw_p,
                    "dest_rel_path": rel_sanitized,
                    "object_id": obj_id,
                    "is_renamed": is_renamed
                })
            except Exception as ex:
                extraction_errors.append({"path": raw_p, "object_id": obj_id, "error": str(ex)})

            if idx % 250 == 0 or idx == total_images:
                pct = (idx / total_images) * 100
                print(f"  -> Extracted {idx}/{total_images} files ({pct:.1f}%)...")

    finally:
        extractor.close()

    elapsed_extraction = time.time() - start_time
    print(f"[Extraction] Completed in {elapsed_extraction:.2f} seconds ({extracted_count} images written)")

    # Save manifest
    manifest_path = os.path.join(os.path.dirname(resolved_report), "plantdoc_manifest.json")
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(extracted_manifest, f, indent=2)
    print(f"[Manifest] Saved authoritative manifest ({len(extracted_manifest)} items): {manifest_path}")

    # 3. Post-Recovery Integrity & Decoding Audit with PIL
    print("\n--- POST-RECOVERY INTEGRITY AUDIT (PIL) ---")
    valid_images = 0
    corrupt_images = []
    train_count = 0
    test_count = 0
    other_count = 0
    class_distribution = {}

    for root, _, files in os.walk(resolved_out):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                f_path = os.path.join(root, f)
                rel_to_out = os.path.relpath(f_path, resolved_out)

                # Split categorization
                norm_rel = rel_to_out.replace('\\', '/').lower()
                if norm_rel.startswith('train/'):
                    train_count += 1
                elif norm_rel.startswith('test/'):
                    test_count += 1
                else:
                    other_count += 1

                # Integrity check
                try:
                    with Image.open(f_path) as im:
                        im.verify()
                    valid_images += 1
                except Exception as ex:
                    corrupt_images.append({"file": rel_to_out, "error": str(ex)})

    print(f"[Audit] Total Valid Images Decoded: {valid_images}")
    print(f"[Audit] Corrupt/Unreadable Images:  {len(corrupt_images)}")
    print(f"[Audit] Train Set Images:           {train_count}")
    print(f"[Audit] Test Set Images:            {test_count}")
    if other_count > 0:
        print(f"[Audit] Other Split Images:         {other_count}")

    # 4. Generate Recovery Report
    total_elapsed = time.time() - start_time
    report = {
        "dataset_name": "PlantDoc",
        "git_source_directory": resolved_repo,
        "recovered_output_directory": resolved_out,
        "total_git_tracked_paths": total_tracked,
        "image_paths_found": total_images,
        "extracted_images_count": extracted_count,
        "skipped_non_image_files_count": len(skipped_non_images),
        "sanitized_windows_paths_count": sanitized_count,
        "collision_resolution_count": collision_count,
        "extraction_errors_count": len(extraction_errors),
        "corrupt_images_count": len(corrupt_images),
        "valid_decoded_images_count": valid_images,
        "train_image_count": train_count,
        "test_image_count": test_count,
        "elapsed_seconds": round(total_elapsed, 2),
        "extraction_errors": extraction_errors,
        "corrupt_images": corrupt_images[:10],
        "is_ready_for_validation": (len(corrupt_images) == 0 and extracted_count > 2000)
    }

    os.makedirs(os.path.dirname(resolved_report), exist_ok=True)
    with open(resolved_report, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\n==================================================")
    print(f"Report Generated: {resolved_report}")
    print(f"Total Recovery Time: {total_elapsed:.2f} seconds")
    print(f"Ready for Validation: {report['is_ready_for_validation']}")
    print("==================================================")

    return report

def main():
    parser = argparse.ArgumentParser(description="Fast Windows-Safe PlantDoc Git Object Recovery")
    parser.add_argument("--repo-dir", type=str, default="ml-pipeline/data/raw/plantdoc", help="PlantDoc git clone directory")
    parser.add_argument("--output-dir", type=str, default="ml-pipeline/data/raw/plantdoc_recovered", help="Target output directory")
    parser.add_argument("--report-path", type=str, default="ml-pipeline/data/plantdoc_recovery_report.json", help="Output JSON report path")
    args = parser.parse_args()

    run_recovery(args.repo_dir, args.output_dir, args.report_path)

if __name__ == "__main__":
    main()