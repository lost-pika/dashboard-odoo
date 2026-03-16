import json
import pandas as pd
import io
from odoo import http
from odoo.http import request

class DashboardAPI(http.Controller):

    @http.route('/dashboard/upload', type='http', auth='user', methods=['POST'], csrf=False)
    def upload(self, **kw):
        file = kw.get('file')
        template_name = kw.get('template_name', 'Custom Dashboard')

        if not file:
            return request.make_response(
                json.dumps({'error': 'No file received'}), 
                headers=[('Content-Type', 'application/json')], 
                status=400
            )

        try:
            # Read file - handle both CSV and Excel
            filename = file.filename.lower()
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file.read()))
            else:
                df = pd.read_excel(io.BytesIO(file.read()))

            # AI Logic Placeholder (or call Gemini here as per previous code)
            # For debugging, let's return a successful response:
            kpis = [
                {"title": f"Total {template_name}", "value": "1,240", "color": "#5fa4a6", "icon": "fa-chart-line"},
                {"title": "Analyzed Records", "value": str(len(df)), "color": "#2b3648", "icon": "fa-database"},
                {"title": "AI Confidence", "value": "98%", "color": "#84babb", "icon": "fa-check"}
            ]

            return request.make_response(
                json.dumps({'kpis': kpis}), 
                headers=[('Content-Type', 'application/json')]
            )

        except Exception as e:
            return request.make_response(
                json.dumps({'error': str(e)}), 
                headers=[('Content-Type', 'application/json')], 
                status=400
            )