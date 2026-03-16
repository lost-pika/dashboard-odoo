{
    "name": "Marketplace Dashboard",
    "version": "1.0",
    "depends": ["base", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "marketplace_dashboard/static/src/css/dashboard.css",
            "marketplace_dashboard/static/src/js/dashboard.js",
            "marketplace_dashboard/static/src/xml/dashboard.xml",
        ],
    },
    "application": True,
}
