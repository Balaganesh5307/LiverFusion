"""
LiverFusion AI - Dataset Audit Tool
Performs a read-only audit of the ultrasound dataset:
- Discovers class folders
- Counts per-class files
- Checks for unreadable/corrupt files
- Tallies image modes and sizes
- Identifies exact duplicates (MD5)
- Identifies near-duplicates (64-bit dHash, Hamming distance <= 4)
- Identifies cross-class label conflicts (report only)
- Analyzes filename patterns
- Exports: audit_summary.md, audit_report.json, and file_manifest.csv
"""

import os
import sys
import json
import hashlib
import re
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Set, Any
import yaml
from PIL import Image


def compute_md5(file_path: str) -> str:
    """Compute MD5 hash of raw file bytes."""
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_dhash_64(image: Image.Image) -> int:
    """
    Compute 64-bit difference hash (dHash).
    Resizes image to 9x8 in grayscale; computes horizontal gradient (8x8 = 64 bits).
    """
    gray = image.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    pixels = list(gray.getdata())
    diff_bits = 0
    bit_index = 0
    for row in range(8):
        for col in range(8):
            left = pixels[row * 9 + col]
            right = pixels[row * 9 + col + 1]
            if left > right:
                diff_bits |= (1 << bit_index)
            bit_index += 1
    return diff_bits


def hamming_distance_64(h1: int, h2: int) -> int:
    """Compute Hamming distance between two 64-bit integers."""
    return bin(h1 ^ h2).count("1")


class UnionFind:
    """Disjoint-set data structure to cluster duplicate groups."""
    def __init__(self, elements: List[str]):
        self.parent = {elem: elem for elem in elements}

    def find(self, i: str) -> str:
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i: str, j: str):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_j] = root_i


def get_data_root(config_path: str = "configs/data.yaml") -> str:
    """Resolve dataset root from environment variable or config file."""
    env_var_name = "DATA_ROOT"
    default_root = "Dataset"
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            cfg = yaml.safe_load(f)
            if cfg:
                env_var_name = cfg.get("data_root_env_var", env_var_name)
                default_root = cfg.get("default_data_root", default_root)
    return os.environ.get(env_var_name, default_root)


def run_audit(data_root: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Execute complete dataset audit."""
    if not os.path.exists(data_root):
        raise FileNotFoundError(f"Data root directory not found: {data_root}")

    # 1. Discover class folders
    class_folders = sorted([
        d for d in os.listdir(data_root)
        if os.path.isdir(os.path.join(data_root, d)) and not d.startswith(".")
    ])
    
    if not class_folders:
        raise ValueError(f"No class folders found in {data_root}")

    file_records = []
    unreadable_files = []
    per_class_counts = Counter()
    image_modes = Counter()
    image_sizes = Counter()
    filename_patterns = defaultdict(int)

    print(f"Scanning dataset at '{data_root}' across {len(class_folders)} classes: {class_folders}...")

    # Regex for filename patterns (e.g. prefix letters and numbers)
    pattern_regex = re.compile(r"^([a-zA-Z_-]+)(\d+)?(\.[a-zA-Z0-9]+)$")

    for cls in class_folders:
        cls_dir = os.path.join(data_root, cls)
        for fname in sorted(os.listdir(cls_dir)):
            if fname.startswith("."):
                continue
            abs_path = os.path.join(cls_dir, fname)
            if not os.path.isfile(abs_path):
                continue

            per_class_counts[cls] += 1
            rel_path = os.path.join(cls, fname)

            # Analyze filename pattern
            match = pattern_regex.match(fname)
            if match:
                prefix = match.group(1)
                ext = match.group(3)
                filename_patterns[f"{prefix}*{ext}"] += 1
            else:
                ext = os.path.splitext(fname)[1]
                filename_patterns[f"other*{ext}"] += 1

            # Read and validate image
            try:
                md5_hash = compute_md5(abs_path)
                with Image.open(abs_path) as img:
                    img.verify()  # Verify image integrity
                
                # Reopen to read mode, size, and compute dhash
                with Image.open(abs_path) as img:
                    mode = img.mode
                    size = img.size
                    image_modes[mode] += 1
                    image_sizes[f"{size[0]}x{size[1]}"] += 1
                    dhash_val = compute_dhash_64(img)

                file_records.append({
                    "relative_path": rel_path.replace("\\", "/"),
                    "class_name": cls,
                    "filename": fname,
                    "size_bytes": os.path.getsize(abs_path),
                    "md5": md5_hash,
                    "dhash_int": dhash_val,
                    "dhash_hex": f"{dhash_val:016x}",
                    "mode": mode,
                    "dimensions": f"{size[0]}x{size[1]}"
                })
            except Exception as e:
                unreadable_files.append({
                    "relative_path": rel_path.replace("\\", "/"),
                    "class_name": cls,
                    "error": str(e)
                })

    print(f"Scanned {len(file_records)} readable files ({len(unreadable_files)} unreadable).")

    # 2. Exact Duplicates (MD5)
    md5_to_files = defaultdict(list)
    for rec in file_records:
        md5_to_files[rec["md5"]].append(rec["relative_path"])
    
    exact_duplicate_sets = {
        md5: paths for md5, paths in md5_to_files.items() if len(paths) > 1
    }

    # 3. Near-Duplicates (64-bit dHash, Hamming <= 4) & Exact Match Clustering
    # Initialize Union-Find over all files
    all_rel_paths = [rec["relative_path"] for rec in file_records]
    uf = UnionFind(all_rel_paths)

    # Union exact MD5 duplicates first
    for paths in exact_duplicate_sets.values():
        for i in range(1, len(paths)):
            uf.union(paths[0], paths[i])

    # Cluster unique dhashes to compare near duplicates efficiently
    # Group file records by exact dhash first
    dhash_to_records = defaultdict(list)
    for rec in file_records:
        dhash_to_records[rec["dhash_int"]].append(rec["relative_path"])

    # Union identical dhashes
    for paths in dhash_to_records.values():
        for i in range(1, len(paths)):
            uf.union(paths[0], paths[i])

    # Now compare distinct dhashes for Hamming distance <= 4
    unique_dhashes = list(dhash_to_records.keys())
    print(f"Comparing {len(unique_dhashes)} unique perceptual dhashes for near-duplicates (Hamming <= 4)...")
    
    near_dup_pairs_count = 0
    for i in range(len(unique_dhashes)):
        h1 = unique_dhashes[i]
        sample_path_1 = dhash_to_records[h1][0]
        for j in range(i + 1, len(unique_dhashes)):
            h2 = unique_dhashes[j]
            dist = hamming_distance_64(h1, h2)
            if dist <= 4:
                sample_path_2 = dhash_to_records[h2][0]
                uf.union(sample_path_1, sample_path_2)
                near_dup_pairs_count += 1

    # Assign duplicate group IDs based on connected components
    component_map = defaultdict(list)
    for path in all_rel_paths:
        root = uf.find(path)
        component_map[root].append(path)

    # Sort groups by size descending, then root name
    sorted_roots = sorted(component_map.keys(), key=lambda r: (-len(component_map[r]), r))
    root_to_group_id = {root: f"grp_{idx:05d}" for idx, root in enumerate(sorted_roots)}

    path_to_group_id = {}
    group_sizes = Counter()
    for root, paths in component_map.items():
        gid = root_to_group_id[root]
        group_sizes[gid] = len(paths)
        for p in paths:
            path_to_group_id[p] = gid

    # Attach duplicate_group_id to records
    for rec in file_records:
        rec["duplicate_group_id"] = path_to_group_id[rec["relative_path"]]

    # 4. Check for Cross-Class Label Conflicts (Report only)
    group_to_classes = defaultdict(set)
    group_to_paths = defaultdict(list)
    for rec in file_records:
        gid = rec["duplicate_group_id"]
        group_to_classes[gid].add(rec["class_name"])
        group_to_paths[gid].append(rec["relative_path"])

    conflicting_groups = []
    for gid, classes in group_to_classes.items():
        if len(classes) > 1:
            conflicting_groups.append({
                "duplicate_group_id": gid,
                "classes": sorted(list(classes)),
                "sample_count": len(group_to_paths[gid]),
                "sample_files": group_to_paths[gid][:6]  # show first few samples
            })

    # Summary statistics
    multi_member_groups = [gid for gid, sz in group_sizes.items() if sz > 1]
    single_member_groups = [gid for gid, sz in group_sizes.items() if sz == 1]

    # Pick 5 spot-checked duplicate groups with their members
    spot_checked_groups = []
    for gid in multi_member_groups[:5]:
        members = group_to_paths[gid]
        spot_checked_groups.append({
            "duplicate_group_id": gid,
            "member_count": len(members),
            "classes": sorted(list(group_to_classes[gid])),
            "files": members[:5]
        })

    report = {
        "dataset_root": os.path.abspath(data_root),
        "total_files_scanned": sum(per_class_counts.values()),
        "total_valid_images": len(file_records),
        "unreadable_files_count": len(unreadable_files),
        "unreadable_files": unreadable_files,
        "classes_discovered": class_folders,
        "per_class_counts": dict(per_class_counts),
        "image_modes": dict(image_modes),
        "image_dimensions": dict(image_sizes),
        "filename_patterns": dict(filename_patterns),
        "duplicate_analysis": {
            "exact_duplicate_md5_sets_count": len(exact_duplicate_sets),
            "exact_duplicate_files_count": sum(len(p) for p in exact_duplicate_sets.values()),
            "total_duplicate_groups": len(group_sizes),
            "multi_item_groups_count": len(multi_member_groups),
            "single_item_groups_count": len(single_member_groups),
            "largest_group_size": max(group_sizes.values()) if group_sizes else 0,
            "spot_checked_groups": spot_checked_groups,
        },
        "cross_class_conflicts": {
            "conflicting_groups_count": len(conflicting_groups),
            "conflicting_groups": conflicting_groups
        }
    }

    return report, file_records


def write_manifest_csv(file_records: List[Dict[str, Any]], output_path: str = "file_manifest.csv"):
    """Write file manifest CSV including duplicate group IDs."""
    import csv
    fieldnames = [
        "relative_path",
        "class_name",
        "filename",
        "duplicate_group_id",
        "size_bytes",
        "mode",
        "dimensions",
        "md5",
        "dhash_hex"
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for rec in file_records:
            writer.writerow(rec)
    print(f"Wrote file manifest to: {output_path}")


def write_markdown_summary(report: Dict[str, Any], output_path: str = "audit_summary.md"):
    """Generate comprehensive audit_summary.md report."""
    md = []
    md.append("# LiverFusion AI — Dataset Audit Summary")
    md.append("")
    md.append("> **Note:** Read-only dataset inspection. No dataset files were deleted, moved, or modified.")
    md.append("")
    md.append("## 1. Class Distribution & Verification")
    md.append(f"* **Total Files Scanned:** {report['total_files_scanned']}")
    md.append(f"* **Valid Readable Images:** {report['total_valid_images']}")
    md.append(f"* **Unreadable/Corrupt Files:** {report['unreadable_files_count']}")
    md.append("")
    md.append("| Fibrosis Stage | File Count | Percentage |")
    md.append("| :--- | :---: | :---: |")
    total = report['total_valid_images']
    for cls in report['classes_discovered']:
        cnt = report['per_class_counts'].get(cls, 0)
        pct = (cnt / total * 100) if total > 0 else 0
        md.append(f"| **{cls}** | {cnt} | {pct:.2f}% |")
    md.append(f"| **Total** | **{total}** | **100.00%** |")
    md.append("")

    md.append("## 2. Image Properties")
    md.append("### Image Modes")
    for mode, count in report['image_modes'].items():
        md.append(f"* `{mode}`: {count} images")
    md.append("")
    md.append("### Image Dimensions")
    for dim, count in sorted(report['image_dimensions'].items(), key=lambda x: -x[1]):
        md.append(f"* `{dim}` px: {count} images")
    md.append("")

    md.append("## 3. Filename Patterns (Report Only)")
    for pat, count in sorted(report['filename_patterns'].items(), key=lambda x: -x[1])[:10]:
        md.append(f"* `{pat}`: {count} occurrences")
    md.append("")

    md.append("## 4. Duplicate Frame Analysis")
    da = report['duplicate_analysis']
    md.append(f"* **Exact Duplicate MD5 Sets:** {da['exact_duplicate_md5_sets_count']} sets ({da['exact_duplicate_files_count']} total files)")
    md.append(f"* **Total Partitionable Duplicate Groups:** {da['total_duplicate_groups']}")
    md.append(f"* **Multi-Item Groups (Duplicated Frames):** {da['multi_item_groups_count']}")
    md.append(f"* **Single-Item Groups (Unique Frames):** {da['single_item_groups_count']}")
    md.append(f"* **Largest Duplicate Group Size:** {da['largest_group_size']} images")
    md.append("")

    md.append("### 5 Spot-Checked Duplicate Groups")
    for i, grp in enumerate(da['spot_checked_groups'], 1):
        md.append(f"#### Group {i}: `{grp['duplicate_group_id']}` ({grp['member_count']} members in {', '.join(grp['classes'])})")
        for f in grp['files']:
            md.append(f"  * `{f}`")
    md.append("")

    md.append("## 5. Cross-Class Label Conflicts (Report Only)")
    cc = report['cross_class_conflicts']
    md.append(f"* **Cross-Class Conflicting Groups:** {cc['conflicting_groups_count']}")
    if cc['conflicting_groups_count'] == 0:
        md.append("* **No cross-class label conflicts found.** All near/exact duplicate clusters are strictly internal to their respective stage folders.")
    else:
        md.append("> [!WARNING]")
        md.append("> Near-duplicate frames span across distinct class folders. As per specification, no files were modified or dropped.")
        md.append("")
        for conf in cc['conflicting_groups'][:5]:
            md.append(f"* **`{conf['duplicate_group_id']}`**: Classes {conf['classes']} ({conf['sample_count']} files)")
            for sf in conf['sample_files']:
                md.append(f"  - `{sf}`")
    md.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"Wrote audit summary markdown to: {output_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Dataset audit tool")
    parser.add_argument("--data-root", default=None, help="Path to dataset root folder")
    parser.add_argument("--config", default="configs/data.yaml", help="Path to data config YAML")
    parser.add_argument("--out-summary", default="audit_summary.md", help="Path for markdown summary")
    parser.add_argument("--out-json", default="audit_report.json", help="Path for JSON report")
    parser.add_argument("--out-csv", default="file_manifest.csv", help="Path for CSV manifest")
    args = parser.parse_args()

    root = args.data_root or get_data_root(args.config)
    report_data, records = run_audit(root)

    write_markdown_summary(report_data, args.out_summary)
    with open(args.out_json, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"Wrote audit report JSON to: {args.out_json}")
    write_manifest_csv(records, args.out_csv)
    print("Dataset audit complete.")
