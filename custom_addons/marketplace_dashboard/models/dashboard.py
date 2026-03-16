from odoo import models, fields

class MarketplaceDashboard(models.Model):
    _name = 'marketplace.dashboard'
    _description = 'Marketplace Dashboard'

    name = fields.Char(string="Dashboard Name", required=True)
    config_data = fields.Text(string="Configuration Data")