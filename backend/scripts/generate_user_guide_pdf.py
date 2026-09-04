from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "BuyFlow_AI_Commerce_OS_User_Guide.pdf"


def _styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=12,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base["BodyText"],
            fontSize=11.5,
            leading=17,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceAfter=14,
        ),
        "badge": ParagraphStyle(
            "Badge",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#2563eb"),
            backColor=colors.HexColor("#eff6ff"),
            borderColor=colors.HexColor("#bfdbfe"),
            borderWidth=0.8,
            borderPadding=5,
            spaceAfter=16,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#2563eb"),
            spaceBefore=7,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontSize=8.8,
            leading=12.5,
            textColor=colors.HexColor("#334155"),
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontSize=8.6,
            leading=12.2,
            leftIndent=12,
            firstLineIndent=-7,
            textColor=colors.HexColor("#334155"),
            spaceAfter=3,
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=12.2,
            textColor=colors.HexColor("#0f172a"),
            backColor=colors.HexColor("#f8fafc"),
            borderColor=colors.HexColor("#cbd5e1"),
            borderWidth=0.8,
            borderPadding=7,
            spaceBefore=5,
            spaceAfter=7,
        ),
        "callout_green": ParagraphStyle(
            "CalloutGreen",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=12.2,
            textColor=colors.HexColor("#065f46"),
            backColor=colors.HexColor("#ecfdf5"),
            borderColor=colors.HexColor("#a7f3d0"),
            borderWidth=0.8,
            borderPadding=7,
            spaceBefore=5,
            spaceAfter=7,
        ),
        "chat_user": ParagraphStyle(
            "ChatUser",
            parent=base["BodyText"],
            fontSize=8.2,
            leading=11.5,
            textColor=colors.HexColor("#1e3a8a"),
            backColor=colors.HexColor("#dbeafe"),
            borderPadding=5,
            spaceAfter=3,
        ),
        "chat_ai": ParagraphStyle(
            "ChatAI",
            parent=base["BodyText"],
            fontSize=8.2,
            leading=11.5,
            textColor=colors.HexColor("#0f172a"),
            backColor=colors.HexColor("#f1f5f9"),
            borderPadding=5,
            spaceAfter=6,
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.8,
            leading=10,
            textColor=colors.white,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=base["BodyText"],
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#1e293b"),
        ),
        "table_cell_bold": ParagraphStyle(
            "TableCellBold",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#0f172a"),
        ),
    }


def _footer(canvas, doc):
    canvas.saveState()
    width, _ = A4
    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.setLineWidth(0.8)
    canvas.line(0.72 * inch, 0.55 * inch, width - 0.72 * inch, 0.55 * inch)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(0.72 * inch, 0.38 * inch, "BuyFlow AI Commerce OS - User Guide and Handbook")
    canvas.drawRightString(width - 0.72 * inch, 0.38 * inch, f"Page {doc.page} of 6")
    canvas.restoreState()


def p(text, style):
    return Paragraph(text, style)


def bullets(items, styles):
    return [p(f"- {item}", styles["bullet"]) for item in items]


def section(title, body, styles):
    story = [p(title, styles["h1"])]
    for item in body:
        if isinstance(item, tuple) and item[0] == "h2":
            story.append(p(item[1], styles["h2"]))
        elif isinstance(item, tuple) and item[0] == "bullets":
            story.extend(bullets(item[1], styles))
        elif isinstance(item, tuple) and item[0] == "callout":
            story.append(p(item[1], styles["callout"]))
        elif isinstance(item, tuple) and item[0] == "callout_green":
            story.append(p(item[1], styles["callout_green"]))
        elif isinstance(item, tuple) and item[0] == "chat":
            story.append(p(f"<b>Shopper:</b> {item[1]}", styles["chat_user"]))
            story.append(p(f"<b>BuyFlow AI:</b> {item[2]}", styles["chat_ai"]))
        elif isinstance(item, Table):
            story.append(item)
            story.append(Spacer(1, 4))
        else:
            story.append(p(item, styles["body"]))
    return story


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = _styles()

    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.68 * inch,
        bottomMargin=0.72 * inch,
        title="BuyFlow AI Commerce OS User Guide",
        author="BuyFlow",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="Guide", frames=[frame], onPage=_footer)])

    story = []

    # ==========================================
    # PAGE 1: TITLE & EXECUTIVE OVERVIEW
    # ==========================================
    story.append(Spacer(1, 15))
    story.append(p("BuyFlow AI Commerce OS", styles["cover_title"]))
    story.append(p("Complete User Guide & Operating Handbook for Shoppers and Merchants", styles["cover_subtitle"]))
    story.append(p("Conversational Shopping - Policy-Safe Offers - 1-Click Razorpay Checkout - Order Tracking", styles["badge"]))

    story += section(
        "1. Welcome to Next-Generation AI Commerce",
        [
            "BuyFlow is an intelligent conversational commerce platform that turns standard product catalogs into interactive, self-selling shopping experiences. Instead of navigating confusing menus or guessing technical specifications, shoppers can talk directly to an AI concierge that understands natural language, recommends the right items, exposes merchant-approved discount coupons only when relevant, and completes secure Razorpay payments directly inside the chat.",
            ("callout", "<b>Key Value:</b> BuyFlow connects real store catalogs, merchant safety policies, transactional email OTP verification, and Razorpay test-mode checkout into one seamless, frictionless flow."),
            ("h2", "Two Ways to Use BuyFlow"),
            ("bullets", [
                "<b>For Shoppers:</b> Chat in plain language, receive tailored recommendations, ask for eligible coupons, pay with 1-click in chat, and track BlueDart courier shipments.",
                "<b>For Merchants:</b> Easily manage products with AI spec enrichment, set discount safety limits, dispatch verified OTP emails via Brevo/Resend, track customer spend, and launch automated sales campaigns.",
            ]),
        ],
        styles,
    )

    overview_table_data = [
        [p("Module", styles["table_header"]), p("Shopper Experience", styles["table_header"]), p("Merchant Experience", styles["table_header"])],
        [
            p("Discovery & Q&A", styles["table_cell_bold"]),
            p("Ask for products by budget, specs, or use-case in plain English.", styles["table_cell"]),
            p("AI automatically extracts CPU, GPU, RAM, and use-case tags from descriptions.", styles["table_cell"])
        ],
        [
            p("Discounts & Offers", styles["table_cell_bold"]),
            p("Active store promo codes (e.g. WELCOME10) appear only when deal intent is detected and remain controlled by policy.", styles["table_cell"]),
            p("Configure maximum discount caps and minimum cart requirements via Policy Engine.", styles["table_cell"])
        ],
        [
            p("Payments", styles["table_cell_bold"]),
            p("1-Click native Razorpay checkout modal directly inside chat.", styles["table_cell"]),
            p("Server-side recalculation prevents price tampering; verified via Razorpay signatures.", styles["table_cell"])
        ],
        [
            p("Logistics & Tracking", styles["table_cell_bold"]),
            p("Zero-click BlueDart tracking displays real-time courier journey.", styles["table_cell"]),
            p("External OMS Webhooks dispatch signed events to Shopify/ERP systems automatically.", styles["table_cell"])
        ],
    ]
    t1 = Table(overview_table_data, colWidths=[1.3 * inch, 2.5 * inch, 2.5 * inch])
    t1.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t1)
    story.append(PageBreak())

    # ==========================================
    # PAGE 2: SHOPPER HANDBOOK - DISCOVERY & PROMOS
    # ==========================================
    story += section(
        "2. Shopper Handbook: Finding Products & Unlocking Deals",
        [
            ("h2", "Step 1: In-Chat Account & OTP Verification"),
            "When you open any BuyFlow store link (e.g. <i>https://razorpay-buildthon.vercel.app/chat?merchant=store_id</i>) or scan a QR code:",
            ("bullets", [
                "The AI Shopping Concierge opens instantly and prompts for your <b>Full Name</b> and <b>Email Address</b>.",
                "Click <b>'Send Verification Code'</b> to receive a secure 6-digit OTP in your inbox.",
                "Enter the 6 digits to verify. Your session is immediately authenticated, saving your name and order history.",
                "The AI concierge greets you personally: <i>'Welcome, Manav! How can I help you find what you need today?'</i>",
            ]),
            ("callout_green", "<b>Why Verify?</b> Verification allows 1-click Razorpay payment prefill, connects your order history to your email, and enables 0-click live package tracking without re-typing details."),
            ("h2", "Step 2: Natural Language Product Discovery"),
            "You don't need exact model numbers or complex keywords. Talk to the assistant just like a friendly store expert:",
            ("bullets", [
                "<b>By Budget:</b> <i>'Show me high-performance gaming laptops under INR 1,40,000.'</i>",
                "<b>By Use-Case:</b> <i>'I am a software engineer looking for a lightweight laptop with 32GB RAM for coding.'</i>",
                "<b>By Specifications:</b> <i>'Find laptops with OLED display and at least 1TB SSD storage.'</i>",
                "<b>Comparison & Deep-Dive:</b> <i>'What is the difference between the Legion Pro 5 and ASUS ROG Strix?'</i>",
                "<b>Accessories:</b> <i>'What wireless mouse and cooling pad go well with this laptop?'</i>",
            ]),
            ("h2", "Step 3: Policy-Safe Discounts and Offer Visibility"),
            "You never need to copy-paste promo codes from external websites:",
            ("bullets", [
                "Active merchant promotions (e.g. <b>WELCOME10</b>, <b>SAVE15</b>, <b>FLASH20</b>) are shown when the shopper asks about deals, coupons, or discounts.",
                "Product cards can display verified savings after a shopper chooses to apply an eligible offer.",
                "Asking <i>'Any discounts available?'</i> triggers the Offer Agent to verify policy rules and explain your savings.",
                "When clicking <b>'Buy Now'</b>, any selected discount code is validated again on the server before checkout.",
            ]),
        ],
        styles,
    )
    story.append(PageBreak())

    # ==========================================
    # PAGE 3: SHOPPER HANDBOOK - CHECKOUT & TRACKING
    # ==========================================
    story += section(
        "3. Shopper Handbook: 1-Click Checkout & Live Tracking",
        [
            ("h2", "Step 4: 1-Click In-Chat Razorpay Checkout"),
            "Buying an item takes just one click without ever leaving the conversation:",
            ("bullets", [
                "Click the <b>'Buy Now'</b> button on any product card in the chat.",
                "The official <b>Razorpay Secure Payment Modal</b> opens directly inside the chat window.",
                "Your verified customer name, email address, and backend-verified payable amount are prefilled automatically.",
                "Choose any standard Indian payment method:",
            ]),
        ],
        styles,
    )

    payment_table_data = [
        [p("Payment Method", styles["table_header"]), p("Supported Options", styles["table_header"]), p("Experience", styles["table_header"])],
        [
            p("UPI & QR", styles["table_cell_bold"]),
            p("Google Pay, PhonePe, Paytm, CRED, BHIM QR", styles["table_cell"]),
            p("Instant approval via UPI app or instant QR scan.", styles["table_cell"])
        ],
        [
            p("Credit / Debit Cards", styles["table_cell_bold"]),
            p("Visa, Mastercard, RuPay, Diners, Amex", styles["table_cell"]),
            p("Secure OTP authentication with saved card support.", styles["table_cell"])
        ],
        [
            p("Netbanking & EMI", styles["table_cell_bold"]),
            p("50+ Indian banks, Cardless EMI, PayLater", styles["table_cell"]),
            p("Direct bank verification and instant receipt generation.", styles["table_cell"])
        ],
    ]
    t2 = Table(payment_table_data, colWidths=[1.5 * inch, 2.5 * inch, 2.3 * inch])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t2)

    story += section(
        "",
        [
            ("h2", "Step 5: Zero-Click Real-Time Courier Tracking"),
            "Once an order is confirmed, tracking your shipment is completely effortless:",
            ("bullets", [
                "Click the <b>Truck icon</b> at the top right of the header or click the <b>'Track my order'</b> quick pill.",
                "Because your email is already verified, the tracking dialog <b>opens your live BlueDart Express tracking journey immediately</b> without asking you to type anything.",
                "View real-time delivery milestones:",
                "  1. <b>Order Confirmed</b> - Razorpay payment captured and verified.",
                "  2. <b>Dispatched from Hub</b> - Packed and assigned AWB tracking number (e.g. <i>BD-AIR-892104</i>).",
                "  3. <b>In Transit</b> - BlueDart Express FastAir air cargo flight.",
                "  4. <b>Out for Delivery</b> - Delivery executive arriving with signature OTP confirmation.",
            ]),
            ("h2", "Visual Store Catalog View"),
            "Prefer browsing items in a traditional store grid? Click the <b>'Catalog'</b> button in the header to view all products with images, categories, and stock numbers. You can click <b>'Ask AI'</b> or <b>'Buy'</b> on any item directly from the grid.",
        ],
        styles,
    )
    story.append(PageBreak())

    # ==========================================
    # PAGE 4: MERCHANT MANUAL - STORE & POLICIES
    # ==========================================
    story += section(
        "4. Merchant Operating Manual: Store Setup & Policy Controls",
        [
            ("h2", "Step 1: Merchant Account & Storefront Onboarding"),
            "Access the Merchant Control Center at <i>/merchant</i> after signing in:",
            ("bullets", [
                "Configure your <b>Store Name</b>, <b>Business Category</b>, <b>Address</b>, and <b>Support Phone</b>.",
                "Your unique shareable AI storefront URL is automatically generated: <i>https://razorpay-buildthon.vercel.app/chat?merchant=YOUR_MERCHANT_ID</i>.",
                "You can print this link as a QR code for in-store physical placement, share it via WhatsApp, or embed it on your existing website.",
            ]),
            ("h2", "Step 2: Adding Products & Automated AI Spec Enrichment"),
            "Adding items is fast and intelligent. When you enter a basic product description:",
            ("bullets", [
                "The Catalog AI analyzes the description and extracts structured technical specs (CPU, GPU, RAM, Storage, Screen size).",
                "It automatically generates targeted <b>Customer Use-Cases</b> (e.g., <i>Esports Gaming, 4K Video Editing, Heavy Multitasking</i>).",
                "It establishes automatic <b>Upsell Relationships</b> (linking premium upgrade tiers) and <b>Cross-Sell Bundles</b> (pairing laptops with bags and mice).",
            ]),
            ("h2", "Step 3: Policy Engine & Financial Safety Guardrails"),
            "Merchants maintain 100% control over pricing, discount ceilings, and order approval rules:",
        ],
        styles,
    )

    policy_table_data = [
        [p("Policy Parameter", styles["table_header"]), p("Rule Description", styles["table_header"]), p("Enforcement Mechanism", styles["table_header"])],
        [
            p("Max Discount %", styles["table_cell_bold"]),
            p("Hard ceiling on the percentage discount an AI agent can offer (e.g. 20%).", styles["table_cell"]),
            p("Server Policy Engine clamps excessive discounts before cart recalculation.", styles["table_cell"])
        ],
        [
            p("Max INR Cap", styles["table_cell_bold"]),
            p("Upper limit on absolute INR savings per transaction (e.g. INR 5,000).", styles["table_cell"]),
            p("Automatically limits large carts from exceeding allowable merchant margins.", styles["table_cell"])
        ],
        [
            p("Min Cart Amount", styles["table_cell_bold"]),
            p("Minimum subtotal required before promo codes activate (e.g. INR 500).", styles["table_cell"]),
            p("Prevents micro-transactions from consuming percentage discount codes.", styles["table_cell"])
        ],
        [
            p("Auto-Approval Limit", styles["table_cell_bold"]),
            p("Orders below INR 2,00,000 process autonomously; higher amounts require review.", styles["table_cell"]),
            p("Fraud prevention and risk management for high-value enterprise orders.", styles["table_cell"])
        ],
    ]
    t3 = Table(policy_table_data, colWidths=[1.5 * inch, 2.5 * inch, 2.3 * inch])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t3)
    story.append(PageBreak())

    # ==========================================
    # PAGE 5: MERCHANT MANUAL - EMAIL & CAMPAIGNS
    # ==========================================
    story += section(
        "5. Merchant Operating Manual: Email, Growth Campaigns & Webhooks",
        [
            ("h2", "Step 4: Configuring Live Email Delivery (Brevo / Resend)"),
            "Ensure real OTP codes and order confirmations reach shopper inboxes reliably:",
            ("bullets", [
                "Navigate to the <b>'Email Delivery'</b> tab in your Merchant Dashboard.",
                "Choose <b>Brevo (Recommended)</b> or <b>Resend</b>.",
                "Paste your API Key (starting with <i>xkeysib-...</i>) and your verified Sender Email address.",
                "Click <b>'Test Live Email Dispatch'</b> to verify real-time email receipt within 5 seconds.",
            ]),
            ("h2", "Step 5: Autonomous Revenue Campaign Engine"),
            "BuyFlow actively monitors store signals to discover revenue opportunities:",
            ("bullets", [
                "<b>Slow Inventory Triggers:</b> Automatically detects products with stagnant turnover (e.g., 14-inch laptops in stock for 30+ days) and drafts time-limited flash promotions (e.g., <i>FESTIVE15</i>).",
                "<b>Abandoned Cart Recovery:</b> Identifies shoppers who initialized checkout but paused, generating personalized incentive proposals.",
                "<b>1-Click Approval:</b> Merchants review the AI's revenue impact projection and click <b>'Approve'</b> to activate promotions store-wide instantly.",
            ]),
            ("h2", "Step 6: External OMS & Webhook Integration"),
            "Connect BuyFlow to your existing warehouse or Shopify/WooCommerce backend:",
            ("bullets", [
                "Enter your external Webhook URL under the <b>Webhooks</b> tab.",
                "Every completed payment dispatches an <b>HMAC-SHA256 signed</b> JSON event containing customer identity, purchased items, and shipping address.",
            ]),
            ("h2", "Step 7: Explainable AI Decision Ledger"),
            "Under <b>Audit Logs</b>, merchants have complete visibility into every autonomous action taken by the AI concierge, including customer queries, retrieved catalog candidates, policy checks, and timestamps.",
        ],
        styles,
    )
    story.append(PageBreak())

    # ==========================================
    # PAGE 6: CHAT SCENARIOS & FAQ
    # ==========================================
    story += section(
        "6. Real-World Chat Scenarios & Troubleshooting FAQ",
        [
            ("h2", "Example Conversational Scenarios"),
            ("chat",
                "I need a laptop for university computer science and machine learning under INR 1,20,000.",
                "I recommend the Lenovo Legion Slim 5 (INR 1,09,999)! It features an AMD Ryzen 7 8845HS processor, 16GB high-speed DDR5 RAM, and an NVIDIA RTX 4060 GPU with Tensor cores for local AI model execution. You can ask for available discounts, and any coupon will be checked against merchant policy before checkout."),
            ("chat",
                "Does it support dual external monitors?",
                "Yes! It includes two full-function USB Type-C DisplayPort 1.4 ports and an HDMI 2.1 port, allowing you to connect up to three external 4K displays simultaneously."),
            ("h2", "Frequently Asked Questions & Troubleshooting"),
            ("bullets", [
                "<b>Q: What if a shopper tries to negotiate an unreasonable discount?</b><br/>"
                "A: The AI has zero authority over financial calculations. The server-side Policy Engine strictly caps all discounts at your configured maximum allowed ceiling (e.g. 20%).",
                "<b>Q: What if an OTP email is delayed?</b><br/>"
                "A: Check your spam folder. If running in developer mode, the verification code is also logged directly to the browser console for testing.",
                "<b>Q: How are customer payments verified?</b><br/>"
                "A: BuyFlow uses official Razorpay HMAC-SHA256 cryptographic signatures. Orders are only confirmed in the database when the signature matches the server secret.",
                "<b>Q: Can external AI buyer bots purchase from my store?</b><br/>"
                "A: Yes! BuyFlow provides machine-readable manifests at <i>/api/agent/manifest</i> and idempotent transaction endpoints at <i>/api/agent/transact</i> for autonomous agent purchases.",
            ]),
            ("callout", "<b>Support & Repository:</b> For technical inquiries, custom integrations, or bug reports, visit our official repository at <b>github.com/manavnagpal08/razor-pay</b>."),
        ],
        styles,
    )

    doc.build(story)
    print(f"User Guide PDF successfully generated at: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
