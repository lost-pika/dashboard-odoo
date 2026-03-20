import json
import pandas as pd
import io
import logging
from google import genai
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class DashboardAPI(http.Controller):

    @http.route('/dashboard/upload', type='http', auth='user', methods=['POST'], csrf=False)
    def upload(self, **kw):
        file = kw.get('file')
        template_name = str(kw.get('template_name', 'Custom Dashboard'))

        if not file:
            return request.make_response(json.dumps({'error': 'No file received'}), status=400)

        try:
            # --- 1. Load Data ---
            filename = file.filename.lower()
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file.read()))
            else:
                df = pd.read_excel(io.BytesIO(file.read()))

            columns = df.columns.tolist()
            sample_data_str = df.head(10).to_string()
            
            # --- 2. Configure Gemini (New SDK) ---
            # Check if user sent their own key (BYOK), otherwise fallback to System Parameter
            db_api_key = request.env['ir.config_parameter'].sudo().get_param('gemini_api_key')
            api_key = kw.get('user_api_key') or db_api_key

            # Strict check: If no key is found at all, return a 400 error with a clear message
            if not api_key or api_key in ["undefined", "null", ""]:
                return request.make_response(
                    json.dumps({
                        'error': 'API Key Missing: Please enter your Gemini API Key in the "API Settings" or contact your administrator.'
                    }), 
                    status=400,
                    headers=[('Content-Type', 'application/json')]
                )

            client = genai.Client(api_key=api_key)
            model_id = "gemini-2.5-flash" 

            prompt = f"""
            Act as a Data Analyst expert in Odoo Dashboards. 
            The user is creating a dashboard for: {template_name}.
            
            Dataset Columns: {columns}
            Data Sample:
            {sample_data_str}

            Task: Identify the 3 most relevant KPIs and a primary chart.
            Return ONLY a valid JSON object with this exact structure:
            {{
                "kpis": [
                    {{"title": "KPI Title", "value": "Calculated String", "color": "#HEXCODE", "icon": "fa-icon-name"}}
                ],
                "chart_mapping": {{
                    "label_column": "best_column_for_x_axis",
                    "value_column": "best_column_for_y_axis",
                    "chart_type": "bar"
                }}
            }}
            Rules: Use colors like #5fa4a6, #2b3648, or #84babb. Icons should be FontAwesome 4.7.
            """

            # --- 3. Generate AI Content ---
            response = client.models.generate_content(model=model_id, contents=prompt)
            clean_json_text = response.text.replace('```json', '').replace('```', '').strip()
            ai_data = json.loads(clean_json_text)

            # --- 4. Data Processing & JSON Cleaning ---
            mapping = ai_data.get('chart_mapping', {})
            l_col = mapping.get('label_column')
            v_col = mapping.get('value_column')

            if l_col not in columns: l_col = columns[0]
            if v_col not in columns: v_col = columns[-1]

            df[v_col] = pd.to_numeric(df[v_col], errors='coerce').fillna(0)

            summary = df.groupby(l_col)[v_col].sum().head(10).fillna(0)
            labels = [str(label) for label in summary.index.tolist()] 
            values = [float(val) for val in summary.values.tolist()]  

            raw_records_cleaned = df.head(100).fillna(0).to_dict('records')

            # --- 5. Calculation Engine ---
            processed_kpis = []
            for kpi in ai_data.get('kpis', []):
                original_value = kpi.get('value', '0')
                title = kpi.get('title', '')
                final_calculated_value = original_value 

                target_col = next((c for c in columns if c.lower() in original_value.lower()), None)

                if target_col:
                    try:
                        temp_series = pd.to_numeric(df[target_col], errors='coerce').fillna(0)
                        if "avg" in original_value.lower() or "average" in original_value.lower():
                            val = temp_series.mean()
                            final_calculated_value = f"{val:.1f}"
                        elif "sum" in original_value.lower():
                            val = temp_series.sum()
                            final_calculated_value = f"{val:,.0f}"
                        elif "count" in original_value.lower():
                            val = temp_series.count()
                            final_calculated_value = str(val)
                    except:
                        pass

                processed_kpis.append({
                    'title': title,
                    'value': final_calculated_value,
                    'color': kpi.get('color', '#5fa4a6'),
                    'icon': kpi.get('icon', 'fa-line-chart'),
                    'id': len(processed_kpis) + 1
                })

            # Final check for NaN in KPIs
            for kpi in processed_kpis:
                if pd.isna(kpi['value']):
                    kpi['value'] = "0"

            # --- 6. Return Final Response ---
            return request.make_response(
                json.dumps({
                    'kpis': processed_kpis,
                    'chart_data': {
                        'labels': labels,
                        'values': values,
                        'type': mapping.get('chart_type', 'bar'),
                        'label_column': l_col,
                        'value_column': v_col
                    },
                    'available_columns': columns,
                    'raw_records': raw_records_cleaned
                }), 
                headers=[('Content-Type', 'application/json')]
            )

        except Exception as e:
            _logger.error("Marketplace Dashboard Upload Error: %s", str(e))
            return request.make_response(json.dumps({'error': str(e)}), status=500)