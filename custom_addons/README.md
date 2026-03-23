# 🚀 AI Marketplace Dashboard for Odoo 17

Transform your raw marketplace data into actionable insights instantly. This module leverages the power of **Google Gemini AI** to automatically analyze uploaded datasets, calculate key performance indicators (KPIs), and generate dynamic visualizations without any manual configuration.

---

## ✨ Key Features

* **🤖 AI-Powered Analysis:** Simply upload an Excel or CSV file. Gemini AI reads your column headers and sample data to identify the most relevant KPIs.
* **📊 Dynamic Charting:** Toggle between **Bar**, **Line**, and **Pie** charts in real-time. 
* **🔄 Flexible Dimensions:** Change your **Group By (X-Axis)** and **Measure (Y-Axis)** on the fly. The dashboard recalculates totals automatically.
* **📥 One-Click Export:** Download your processed data back to CSV/Excel for external reporting.
* **🌓 Dark Mode Support:** Full compatibility with Odoo's dark and light themes.
* **🔒 Privacy First:** Your Gemini API key is stored locally in your browser's `localStorage` or securely in Odoo System Parameters.

---

## 🛠️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/odoo-dashboard.git](https://github.com/your-username/odoo-dashboard.git)
    ```
2.  **Add to Addons Path:**
    Move the `marketplace_dashboard` folder into your Odoo `addons` directory.
3.  **Update App List:**
    - Activate **Developer Mode** in Odoo.
    - Go to the **Apps** menu and click **Update Apps List**.
4.  **Install:**
    Search for "Marketplace Dashboard" and click **Install**.

---

## ⚙️ Configuration

To enable the AI features, you need a Gemini API Key:

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a free API Key.
2.  **In Odoo:**
    - Open the **Marketplace** app.
    - Click the **API Settings** button.
    - Paste your key and save.
    - *Alternatively: Set a system parameter with the key `gemini_api_key`.*

---

## 📖 How to Use

1.  **Select a Template:** Choose from pre-configured layouts like "B2B Sales" or "E-Commerce."
2.  **Upload Data:** Drag and drop your `.xlsx` or `.csv` file.
3.  **Refine:** Use the **Edit Layout** sidebar to change chart types or switch metrics (e.g., from `Sales_Total` to `Profit_Margin`).
4.  **Publish:** Save your dashboard to access it later from the "Published" list on the landing page.

---

## 📝 Technical Details

* **Framework:** Odoo 17 / Owl (Odoo Web Library)
* **AI Model:** Gemini 1.5 Flash (via Google GenAI Python SDK)
* **Visualization:** Chart.js 4.4
* **Backend:** Python 3.11+ / Pandas

---

## 📄 License

This project is licensed under the **LGPL-3** License - see the [LICENSE](LICENSE) file for details. 