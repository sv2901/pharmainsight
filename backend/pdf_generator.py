import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from fpdf import FPDF
import logging

logger = logging.getLogger(__name__)

SLATE_900 = (15, 23, 42)
SLATE_700 = (51, 65, 85)
SLATE_500 = (100, 116, 139)
SLATE_200 = (226, 232, 240)
TEAL = (13, 148, 136)
RED = (220, 38, 38)
WHITE = (255, 255, 255)

# Sanitize text for Helvetica (Latin-1 only)
def _s(text):
    if not isinstance(text, str):
        text = str(text)
    replacements = {
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
        '\u2013': '-', '\u2014': '--', '\u2022': '-', '\u2026': '...',
        '\u00a0': ' ', '\u2010': '-', '\u2033': '"', '\u2032': "'",
        '\u2116': 'No.', '\u20b9': 'INR ', '\u2265': '>=', '\u2264': '<=',
        '\u2248': '~', '\u2260': '!=', '\u00b1': '+/-',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Strip any remaining non-Latin-1 characters
    return text.encode('latin-1', errors='replace').decode('latin-1')


class PharmaPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*SLATE_500)
        self.cell(0, 8, _s("PharmaInsight | Market Intelligence Report"), 0, 0, "L")
        self.set_draw_color(*SLATE_200)
        self.line(10, 14, self.w - 10, 14)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*SLATE_500)
        self.cell(0, 10, f"Confidential | Page {self.page_no()}/{{nb}}", 0, 0, "C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*SLATE_900)
        self.cell(0, 10, _s(title), 0, 1, "L")
        self.set_draw_color(*SLATE_900)
        self.line(10, self.get_y(), 60, self.get_y())
        self.ln(4)

    def section_body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*SLATE_700)
        self.set_x(self.l_margin)
        self.multi_cell(self.epw, 5.5, _s(text))
        self.ln(3)

    def stat_row(self, label, value):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*SLATE_500)
        self.cell(70, 6, _s(label), 0, 0, "L")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*SLATE_900)
        self.cell(0, 6, _s(str(value)), 0, 1, "L")

    def add_table(self, headers, rows, col_widths=None):
        if not col_widths:
            col_widths = [self.epw / len(headers)] * len(headers)
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(241, 245, 249)
        self.set_text_color(*SLATE_700)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, _s(h), 1, 0, "C", True)
        self.ln()
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*SLATE_700)
        for row in rows:
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 6, _s(str(cell)[:30]), 1, 0, "C")
            self.ln()
        self.ln(3)


def _create_revenue_chart(yearly_forecast):
    fig, ax = plt.subplots(figsize=(7, 3.5))
    years = [d.get("year", 0) for d in yearly_forecast]
    base = [d.get("revenue_base_millions", 0) for d in yearly_forecast]
    best = [d.get("revenue_best_millions", 0) for d in yearly_forecast]
    worst = [d.get("revenue_worst_millions", 0) for d in yearly_forecast]
    ax.plot(years, base, color="#0f172a", linewidth=2, marker="o", markersize=4, label="Base Case")
    ax.plot(years, best, color="#0d9488", linewidth=1.5, linestyle="--", marker="s", markersize=3, label="Best Case")
    ax.plot(years, worst, color="#dc2626", linewidth=1.5, linestyle="--", marker="^", markersize=3, label="Worst Case")
    ax.fill_between(years, worst, best, alpha=0.06, color="#0f172a")
    ax.set_xlabel("Year", fontsize=9, color="#64748b")
    ax.set_ylabel("Revenue (USD Millions)", fontsize=9, color="#64748b")
    ax.set_title("Revenue Forecast — Scenario Analysis", fontsize=11, fontweight="bold", color="#0f172a", pad=12)
    ax.legend(fontsize=8, framealpha=0.9)
    ax.grid(True, alpha=0.2)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def _create_scenario_chart(summary):
    fig, ax = plt.subplots(figsize=(5, 3))
    scenarios = ["Worst", "Base", "Best"]
    values = [
        summary.get("total_cumulative_revenue_worst_millions", 0),
        summary.get("total_cumulative_revenue_base_millions", 0),
        summary.get("total_cumulative_revenue_best_millions", 0),
    ]
    colors = ["#dc2626", "#0f172a", "#0d9488"]
    bars = ax.bar(scenarios, values, color=colors, width=0.5)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2., bar.get_height() + max(values) * 0.02, f"${val:.0f}M", ha="center", va="bottom", fontsize=9, fontweight="bold")
    ax.set_ylabel("Cumulative Revenue (USD M)", fontsize=9, color="#64748b")
    ax.set_title("Scenario Comparison", fontsize=11, fontweight="bold", color="#0f172a", pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.2)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf


def generate_report_pdf(report):
    pdf = PharmaPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ---- Cover Page ----
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*SLATE_900)
    pdf.cell(0, 14, _s("Market Intelligence Report"), 0, 1, "C")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(*SLATE_700)
    pdf.cell(0, 10, _s(report.get("drug_name", "")), 0, 1, "C")
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(*SLATE_500)
    pdf.cell(0, 8, _s(f"{report.get('disease', '')} | {report.get('region', '')} | {report.get('forecast_horizon', 5)}-Year Horizon"), 0, 1, "C")
    pdf.ln(20)
    pdf.set_draw_color(*SLATE_200)
    pdf.line(60, pdf.get_y(), pdf.w - 60, pdf.get_y())
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*SLATE_500)
    pdf.cell(0, 6, _s(f"Generated: {report.get('created_at', '')[:10]}"), 0, 1, "C")
    pdf.cell(0, 6, _s("PharmaInsight AI-Powered Analytics"), 0, 1, "C")
    pdf.cell(0, 6, _s("CONFIDENTIAL"), 0, 1, "C")

    mr = report.get("market_research") or {}
    fc = report.get("forecast") or {}
    st = report.get("strategy") or {}

    # ---- Executive Summary ----
    if st.get("executive_summary"):
        pdf.add_page()
        pdf.section_title("Executive Summary")
        pdf.section_body(st["executive_summary"])
        pdf.ln(4)

    # ---- Market Overview ----
    overview = mr.get("market_overview", {})
    if overview:
        pdf.add_page()
        pdf.section_title("1. Market Overview")
        pdf.section_body(overview.get("market_summary", ""))
        pdf.ln(2)
        pdf.stat_row("Current Market Size", _s(f"${overview.get('current_market_size_usd_millions', 0)}M"))
        pdf.stat_row("Projected Market Size", _s(f"${overview.get('projected_market_size_usd_millions', 0)}M"))
        pdf.stat_row("Growth Rate (CAGR)", _s(f"{overview.get('market_growth_rate_pct', 0)}%"))
        pdf.ln(4)
        trends = overview.get("key_market_trends", [])
        if trends:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(*SLATE_900)
            pdf.cell(0, 7, _s("Key Market Trends"), 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*SLATE_700)
            for t in trends:
                pdf.cell(5, 5, "", 0, 0)
                pdf.cell(0, 5, _s(f"- {t}"), 0, 1)

    # ---- Patient Population ----
    pop = mr.get("patient_population", {})
    if pop:
        pdf.add_page()
        pdf.section_title("2. Patient Population")
        pdf.stat_row("Total Patients", _s(f"{pop.get('total_patients', 0):,.0f}"))
        pdf.stat_row("Diagnosed Patients", _s(f"{pop.get('diagnosed_patients', 0):,.0f}"))
        pdf.stat_row("Eligible for Treatment", _s(f"{pop.get('eligible_for_treatment', 0):,.0f}"))
        pdf.stat_row("Currently Treated", _s(f"{pop.get('currently_treated', 0):,.0f}"))
        pdf.stat_row("Treatment Gap", _s(f"{pop.get('treatment_gap', 0):,.0f}"))
        pdf.stat_row("Prevalence Rate", _s(f"{pop.get('disease_prevalence_rate_pct', 0)}%"))

    # ---- Competitor Landscape ----
    comp = mr.get("competitor_landscape", {})
    competitors = comp.get("competitors", [])
    if competitors:
        pdf.add_page()
        pdf.section_title("3. Competitive Landscape")
        headers = ["Drug", "Manufacturer", "Share %", "Annual Cost", "Mechanism"]
        rows = []
        for c in competitors[:8]:
            rows.append([
                _s(c.get("drug_name", "")[:18]),
                _s(c.get("manufacturer", "")[:18]),
                _s(f"{c.get('market_share_pct', 0)}%"),
                _s(f"${c.get('avg_annual_cost_usd', 0):,.0f}"),
                _s(c.get("mechanism", "")[:22]),
            ])
        w = [30, 30, 18, 25, max(pdf.epw - 103, 30)]
        pdf.add_table(headers, rows, w)
        if comp.get("pricing_overview"):
            pdf.section_body(comp["pricing_overview"])

    # ---- Revenue Forecast ----
    yearly = fc.get("yearly_forecast", [])
    if yearly:
        pdf.add_page()
        pdf.section_title("4. Revenue Forecast")
        try:
            chart_buf = _create_revenue_chart(yearly)
            chart_path = "/tmp/pharma_revenue_chart.png"
            with open(chart_path, "wb") as f:
                f.write(chart_buf.read())
            pdf.image(chart_path, x=10, w=pdf.epw)
            pdf.set_x(pdf.l_margin)
            pdf.ln(6)
        except Exception as e:
            logger.warning(f"Chart generation failed: {e}")

        headers = ["Year", "Patients (Base)", "Rev Base", "Rev Best", "Rev Worst"]
        rows = []
        for y in yearly:
            rows.append([
                _s(str(y.get("year", ""))),
                _s(f"{y.get('patients_treated_base', 0):,.0f}"),
                _s(f"${y.get('revenue_base_millions', 0):.1f}M"),
                _s(f"${y.get('revenue_best_millions', 0):.1f}M"),
                _s(f"${y.get('revenue_worst_millions', 0):.1f}M"),
            ])
        cw = pdf.epw / 5
        pdf.add_table(headers, rows, [cw] * 5)

    # ---- Scenario Comparison ----
    summary = fc.get("summary", {})
    if summary:
        try:
            pdf.add_page()
            pdf.section_title("5. Scenario Comparison")
            pdf.stat_row("CAGR (Base)", f"{summary.get('cagr_base_pct', 0)}%")
            pdf.stat_row("CAGR (Best)", f"{summary.get('cagr_best_pct', 0)}%")
            pdf.stat_row("Peak Revenue", f"${summary.get('peak_revenue_base_millions', 0)}M (Year {summary.get('peak_year', '')})")
            pdf.ln(4)
            chart_buf = _create_scenario_chart(summary)
            chart_path = "/tmp/pharma_scenario_chart.png"
            with open(chart_path, "wb") as f:
                f.write(chart_buf.read())
            pdf.image(chart_path, x=30, w=pdf.epw - 40)
            pdf.set_x(pdf.l_margin)
            pdf.ln(4)
        except Exception as e:
            logger.warning(f"Scenario chart failed: {e}")

    # ---- Market Drivers ----
    drivers = st.get("market_drivers", [])
    if drivers:
        pdf.add_page()
        pdf.section_title("6. Key Market Drivers")
        for d in drivers:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(*SLATE_900)
            pdf.set_x(pdf.l_margin)
            pdf.cell(0, 6, _s(f"{d.get('driver', '')} [{d.get('impact', '')} Impact]"), 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*SLATE_700)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 5, _s(d.get("description", "")))
            pdf.ln(3)

    # ---- Key Risks ----
    risks = st.get("key_risks", [])
    if risks:
        pdf.add_page()
        pdf.section_title("7. Key Risks")
        for r in risks:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(*SLATE_900)
            pdf.set_x(pdf.l_margin)
            pdf.cell(0, 6, _s(f"{r.get('risk', '')} [Severity: {r.get('severity', '')}]"), 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*SLATE_700)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 5, _s(r.get("description", "")))
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(*SLATE_500)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 4.5, _s(f"Mitigation: {r.get('mitigation', '')}"))
            pdf.ln(3)

    # ---- Strategic Recommendations ----
    recs = st.get("strategic_recommendations", [])
    if recs:
        pdf.add_page()
        pdf.section_title("8. Strategic Recommendations")
        for i, rec in enumerate(recs, 1):
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(*SLATE_900)
            pdf.set_x(pdf.l_margin)
            pdf.cell(0, 6, _s(f"{i}. {rec.get('recommendation', '')} [{rec.get('priority', '')} Priority]"), 0, 1)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*SLATE_700)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(pdf.epw, 5, _s(rec.get("rationale", "")))
            pdf.ln(3)

    # ---- Market Entry Strategy ----
    entry = st.get("market_entry_strategy", {})
    if entry:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*SLATE_900)
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 8, _s("Market Entry Strategy"), 0, 1)
        pdf.section_body(entry.get("recommended_approach", ""))
        for phase_key in ["phase_1", "phase_2", "phase_3"]:
            phase = entry.get(phase_key, {})
            if phase:
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(*SLATE_900)
                pdf.set_x(pdf.l_margin)
                pdf.cell(0, 6, _s(f"Phase {phase_key[-1]}: {phase.get('target_segment', '')}"), 0, 1)
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(*SLATE_700)
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(pdf.epw, 4.5, _s(f"{phase.get('description', '')} (Timeline: {phase.get('timeline', '')})"))
                pdf.ln(2)

    output = io.BytesIO()
    pdf_bytes = pdf.output()
    output.write(pdf_bytes)
    output.seek(0)
    return output
