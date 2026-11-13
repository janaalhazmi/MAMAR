from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

AMBER = colors.HexColor("#F2A900")
INK = colors.HexColor("#1F2421")
MUTED = colors.HexColor("#6B7570")


def money(value, currency: str) -> str:
    return f"{currency} {float(value):,.2f}"


def receipt_pdf(payment, project, provider, contractor) -> bytes:
    # One A4 page: the header band, the receipt details, and a sandbox note at the bottom.
    buffer = BytesIO()
    page = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    page.setTitle(f"MAMAR receipt {payment.payment_id}")

    page.setFillColor(AMBER)
    page.rect(0, height - 38 * mm, width, 38 * mm, stroke=0, fill=1)
    page.setFillColor(INK)
    page.setFont("Helvetica-Bold", 26)
    page.drawString(20 * mm, height - 22 * mm, "MAMAR")
    page.setFont("Helvetica", 11)
    page.drawString(20 * mm, height - 30 * mm, "Temporary traffic control platform - Riyadh")
    page.setFont("Helvetica-Bold", 16)
    page.drawRightString(width - 20 * mm, height - 22 * mm, "PAYMENT RECEIPT")
    page.setFont("Helvetica", 11)
    page.drawRightString(width - 20 * mm, height - 30 * mm, f"No. MAMAR-{payment.payment_id:05d}")

    paid = payment.paid_at.strftime("%d %b %Y, %H:%M UTC") if payment.paid_at else "-"
    rows = [
        ("Date paid", paid),
        ("Project", f"#{project.project_id} {project.project_name}"),
        ("Location", project.location or "-"),
        ("Project dates", f"{project.start_date:%d %b %Y} - {project.end_date:%d %b %Y}"),
        ("Contractor", f"{contractor.full_name} ({contractor.email})" if contractor else "-"),
        ("Service provider", provider.company_name if provider else "-"),
        ("Quotation", f"#{payment.quote_id}"),
        ("Payment method", "PayPal (sandbox)"),
        ("PayPal order", payment.paypal_order_id),
        ("PayPal capture", payment.paypal_capture_id or "-"),
        ("Status", payment.status.upper()),
    ]
    y = height - 55 * mm
    for label, value in rows:
        page.setFont("Helvetica", 10)
        page.setFillColor(MUTED)
        page.drawString(20 * mm, y, label)
        page.setFont("Helvetica", 11)
        page.setFillColor(INK)
        page.drawString(70 * mm, y, str(value)[:80])
        y -= 9 * mm

    y -= 4 * mm
    page.setStrokeColor(AMBER)
    page.setLineWidth(1.5)
    page.line(20 * mm, y + 6 * mm, width - 20 * mm, y + 6 * mm)
    page.setFont("Helvetica-Bold", 14)
    page.drawString(20 * mm, y - 4 * mm, "Total")
    page.drawRightString(width - 20 * mm, y - 4 * mm, money(payment.amount, payment.currency))
    page.setFont("Helvetica", 10)
    page.setFillColor(MUTED)
    page.drawRightString(
        width - 20 * mm, y - 11 * mm, f"Charged on PayPal: {money(payment.charged_amount, payment.charged_currency)}"
    )

    page.setFont("Helvetica-Oblique", 9)
    page.drawString(20 * mm, 18 * mm, "Sandbox payment for a student project: no real money was charged.")
    page.showPage()
    page.save()
    return buffer.getvalue()
