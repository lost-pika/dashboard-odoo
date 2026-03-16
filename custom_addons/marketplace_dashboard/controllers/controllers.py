# -*- coding: utf-8 -*-
# from odoo import http


# class MarketplaceDashboard(http.Controller):
#     @http.route('/marketplace_dashboard/marketplace_dashboard', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/marketplace_dashboard/marketplace_dashboard/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('marketplace_dashboard.listing', {
#             'root': '/marketplace_dashboard/marketplace_dashboard',
#             'objects': http.request.env['marketplace_dashboard.marketplace_dashboard'].search([]),
#         })

#     @http.route('/marketplace_dashboard/marketplace_dashboard/objects/<model("marketplace_dashboard.marketplace_dashboard"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('marketplace_dashboard.object', {
#             'object': obj
#         })

