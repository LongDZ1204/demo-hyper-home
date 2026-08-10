#!/usr/bin/env python3
"""
Bơm các mảnh dùng chung (_partials/*.html) vào mọi page trong site/.

Vì sao cần script này: HTML tĩnh không có lệnh include. Chèn bằng JS lúc chạy thì
header/footer biến mất khỏi HTML gốc, mất tín hiệu internal link. Nên bơm lúc build:
sửa 1 file trong _partials/, chạy script, 21 page cập nhật, sản phẩm vẫn là HTML đủ link.

Cách dùng
    python3 build.py            # bơm partial vào tất cả page
    python3 build.py --check    # chỉ báo page nào lệch, không ghi gì
    python3 build.py --publish /duong/dan/demo-hyper-home   # bơm rồi đồng bộ sang repo publish

Cách đánh dấu trong page — đặt đúng 2 dòng này, phần giữa do script ghi đè:
    <!-- @include header -->
    <!-- /include header -->
"""
import sys, re, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PARTIALS = ROOT / "_partials"
# thư mục bắt đầu bằng _ là hạ tầng, không phải page
SKIP_DIRS = {"_partials", "_foundation", "_pages", "_hero-assets", "_artist-photos"}


def pages():
    return sorted(p for p in ROOT.glob("*.html") if not p.name.startswith("_"))


def block(name: str) -> str:
    f = PARTIALS / f"{name}.html"
    if not f.exists():
        sys.exit(f"thiếu mảnh dùng chung: {f}")
    return f.read_text(encoding="utf-8").rstrip("\n")


def inject(html: str, name: str, body: str):
    """Thay phần giữa 2 mốc. Trả (html_mới, đã_đổi, có_mốc_không)."""
    pat = re.compile(
        rf"(<!--\s*@include\s+{name}\s*-->)(.*?)(<!--\s*/include\s+{name}\s*-->)",
        re.S,
    )
    m = pat.search(html)
    if not m:
        return html, False, False
    new = f"{m.group(1)}\n{body}\n{m.group(3)}"
    if m.group(0) == new:
        return html, False, True
    return html[: m.start()] + new + html[m.end():], True, True


def main():
    check = "--check" in sys.argv
    publish = None
    if "--publish" in sys.argv:
        publish = Path(sys.argv[sys.argv.index("--publish") + 1]).resolve()

    parts = {n: block(n) for n in ("header", "footer")}
    changed, missing = [], []

    for page in pages():
        html = page.read_text(encoding="utf-8")
        orig, hit = html, False
        for name, body in parts.items():
            html, did, marked = inject(html, name, body)
            hit = hit or marked
            if did:
                changed.append(f"{page.name} · {name}")
        if not hit:
            missing.append(page.name)
        if html != orig and not check:
            page.write_text(html, encoding="utf-8")

    print(f"page quét: {len(pages())} · cập nhật: {len(changed)} · chưa đặt mốc: {len(missing)}")
    for c in changed:
        print("  ~", c)
    if missing:
        print("  chưa có mốc @include (bỏ qua):", ", ".join(missing))
    if check and changed:
        sys.exit(1)

    if publish:
        if not publish.is_dir():
            sys.exit(f"thư mục publish không tồn tại: {publish}")
        subprocess.run(
            ["rsync", "-a", "--delete",
             "--exclude", ".git", "--exclude", "_partials", "--exclude", "build.py",
             "--exclude", "*.bak*", "--exclude", ".DS_Store",
             f"{ROOT}/", f"{publish}/"],
            check=True,
        )
        print(f"đã đồng bộ sang {publish}")


if __name__ == "__main__":
    main()
