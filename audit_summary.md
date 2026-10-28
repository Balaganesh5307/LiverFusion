# LiverFusion AI — Dataset Audit Summary

> **Note:** Read-only dataset inspection. No dataset files were deleted, moved, or modified.

## 1. Class Distribution & Verification
* **Total Files Scanned:** 6323
* **Valid Readable Images:** 6323
* **Unreadable/Corrupt Files:** 0

| Fibrosis Stage | File Count | Percentage |
| :--- | :---: | :---: |
| **F0** | 2114 | 33.43% |
| **F1** | 861 | 13.62% |
| **F2** | 793 | 12.54% |
| **F3** | 857 | 13.55% |
| **F4** | 1698 | 26.85% |
| **Total** | **6323** | **100.00%** |

## 2. Image Properties
### Image Modes
* `L`: 3459 images
* `RGB`: 2864 images

### Image Dimensions
* `640x480` px: 3459 images
* `449x464` px: 2864 images

## 3. Filename Patterns (Report Only)
* `a*.jpg`: 1841 occurrences
* `other*.png`: 926 occurrences
* `k*.jpg`: 189 occurrences
* `j*.jpg`: 172 occurrences
* `h*.jpg`: 149 occurrences
* `O*.jpg`: 95 occurrences
* `Q*.jpg`: 90 occurrences
* `l*.jpg`: 89 occurrences
* `L*.jpg`: 87 occurrences
* `q*.jpg`: 87 occurrences

## 4. Duplicate Frame Analysis
* **Exact Duplicate MD5 Sets:** 1438 sets (6225 total files)
* **Total Partitionable Duplicate Groups:** 957
* **Multi-Item Groups (Duplicated Frames):** 866
* **Single-Item Groups (Unique Frames):** 91
* **Largest Duplicate Group Size:** 2599 images

### 5 Spot-Checked Duplicate Groups
#### Group 1: `grp_00000` (2599 members in F0, F1, F4)
  * `F0/a1000.jpg`
  * `F0/a1002.jpg`
  * `F0/a1005.jpg`
  * `F0/a1027.jpg`
  * `F0/a1037.jpg`
#### Group 2: `grp_00010` (29 members in F0)
  * `F0/a1010.jpg`
  * `F0/a1536.jpg`
  * `F0/a188.jpg`
  * `F0/a196.jpg`
  * `F0/a2624.jpg`
#### Group 3: `grp_00031` (9 members in F0)
  * `F0/a1028.jpg`
  * `F0/a1596.jpg`
  * `F0/a251.jpg`
  * `F0/a360.jpg`
  * `F0/a5046.jpg`
#### Group 4: `grp_00003` (53 members in F0)
  * `F0/a1051.jpg`
  * `F0/a110.jpg`
  * `F0/a1688.jpg`
  * `F0/a1728.jpg`
  * `F0/a182.jpg`
#### Group 5: `grp_00004` (53 members in F0)
  * `F0/a1070.jpg`
  * `F0/a119.jpg`
  * `F0/a127.jpg`
  * `F0/a148.jpg`
  * `F0/a161.jpg`

## 5. Cross-Class Label Conflicts (Report Only)
* **Cross-Class Conflicting Groups:** 22
> [!WARNING]
> Near-duplicate frames span across distinct class folders. As per specification, no files were modified or dropped.

* **`grp_00000`**: Classes ['F0', 'F1', 'F4'] (2599 files)
  - `F0/a1000.jpg`
  - `F0/a1002.jpg`
  - `F0/a1005.jpg`
  - `F0/a1027.jpg`
  - `F0/a1037.jpg`
  - `F0/a1041.jpg`
* **`grp_00009`**: Classes ['F0', 'F1'] (29 files)
  - `F0/a1162.jpg`
  - `F0/a1305.jpg`
  - `F0/a191.jpg`
  - `F0/a209.jpg`
  - `F0/a3070.jpg`
  - `F0/a4166.jpg`
* **`grp_00060`**: Classes ['F1', 'F3'] (7 files)
  - `F1/B8665.jpg`
  - `F1/b8295.jpg`
  - `F1/ct1-33.png`
  - `F1/ct2-10.png`
  - `F3/P7890.jpg`
  - `F3/U8967.jpg`
* **`grp_00048`**: Classes ['F1', 'F2'] (8 files)
  - `F1/B9650.jpg`
  - `F1/E1689.jpg`
  - `F1/L7547.jpg`
  - `F1/ct1-49.png`
  - `F1/p7901.jpg`
  - `F2/R4911.jpg`
* **`grp_00002`**: Classes ['F1', 'F2', 'F3', 'F4'] (56 files)
  - `F1/C5666.jpg`
  - `F1/M9821.jpg`
  - `F1/O1329.jpg`
  - `F1/R3689.jpg`
  - `F1/ct2-26.png`
  - `F1/ct2-3.png`
