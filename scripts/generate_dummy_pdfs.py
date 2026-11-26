#!/usr/bin/env python3
"""2026年度用のダミーPDFを生成（学生名は記載しない）"""

from pathlib import Path
from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "pdf" / "2026"
FONT = Path("/tmp/NotoSansCJKjp-Regular.otf")

CLASSES = [
    ("mizuno", "水野クラス"),
    ("iguchi", "井口クラス"),
    ("takawo", "高尾クラス"),
    ("yao", "八尾クラス"),
    ("yamashita", "山下クラス"),
]
GROUPS = [
    ("a", "グループA"),
    ("b", "グループB"),
    ("c", "グループC"),
]


def cell(pdf: FPDF, h: float, text: str) -> None:
    pdf.cell(0, h, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def make_pdf(slug: str, class_label: str, group_label: str) -> None:
    pdf = FPDF(orientation="L", format="A4")
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    pdf.add_font("Noto", "", str(FONT))

    pdf.set_font("Noto", size=26)
    pdf.set_text_color(17, 17, 17)
    pdf.set_xy(20, 24)
    cell(pdf, 12, "メディア表現入門演習Ⅱ　2026")

    pdf.set_font("Noto", size=13)
    pdf.set_xy(20, 40)
    cell(pdf, 8, "Seminar in Creative Media Studies (Introduction) 2")
    pdf.set_xy(20, 50)
    cell(pdf, 8, "Creative Media Studies / メディア表現学科")

    pdf.set_font("Noto", size=18)
    pdf.set_xy(20, 68)
    cell(pdf, 11, f"{class_label}　／　{group_label}")

    pdf.set_font("Noto", size=22)
    pdf.set_xy(20, 90)
    cell(pdf, 12, "提出用サンプルPDF（ダミー）")

    pdf.set_font("Noto", size=13)
    lines = [
        "このPDFは提出案内のための見本です。本番の発表資料に差し替えてください。",
        "",
        "【注意】発表資料PDFには学生名を記載しないでください。",
        "クラス名・グループ名・発表タイトルのみを記載します。",
        "",
        "提出：スプレッドシート（メタ情報）／ Teamsフォルダ（PDF本体）",
        f"ファイル名の例：{slug}.pdf",
    ]
    y = 112
    for line in lines:
        pdf.set_xy(20, y)
        cell(pdf, 9, line)
        y += 10

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{slug}.pdf"
    pdf.output(str(out))
    print(f"wrote {out.relative_to(ROOT)}")


def main() -> None:
    if not FONT.exists():
        raise SystemExit(f"Font not found: {FONT}")
    for class_slug, class_label in CLASSES:
        for group_slug, group_label in GROUPS:
            make_pdf(f"{class_slug}_group_{group_slug}", class_label, group_label)


if __name__ == "__main__":
    main()
