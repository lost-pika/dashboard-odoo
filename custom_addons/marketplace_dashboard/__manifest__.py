{
    "name": "Marketplace Dashboard",
    "version": "1.0",
    "category": "Sales", # Added for the App Store
    "summary": "AI Dashboard using Gemini",
    "depends": ["base", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "marketplace_dashboard/static/src/css/dashboard.css",
            "marketplace_dashboard/static/src/js/dashboard.js",
            "marketplace_dashboard/static/src/xml/dashboard.xml", # Put it back here!
        ],
    },
    "application": True,
    "license": "LGPL-3", 
}