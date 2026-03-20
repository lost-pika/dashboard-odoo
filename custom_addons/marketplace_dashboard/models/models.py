# from odoo import models, fields


# class MarketplaceDashboard(models.Model):
#     _name = 'marketplace.dashboard'
#     _description = 'Marketplace Dashboard'

#     name = fields.Char(string="Dashboard Name")


# class MarketplaceDashboardWidget(models.Model):
#     _name = "marketplace.dashboard.widget"
#     _description = "Dashboard Widget"

#     dashboard_id = fields.Many2one("marketplace.dashboard")

#     name = fields.Char()

#     widget_type = fields.Selection([
#         ('kpi','KPI'),
#         ('chart','Chart'),
#         ('table','Table')
#     ])

#     model_name = fields.Char()
#     metric = fields.Char()
#     group_by = fields.Char()