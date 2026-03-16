/** @odoo-module **/
import { Component, useState, useRef, onWillStart, useEffect } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";

export class MarketplaceDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        this.salesChartRef = useRef("salesChart");
        this.fileInput = useRef("fileInput");

        this.state = useState({
            currentView: 'landing',
            savedDashboards: [], 
            draftCharts: [],     
            showConfigModal: false,
            showUploadModal: false,
            isGenerating: false,
            newConfig: { model: 'sale.order', metric: 'Total Sales', name: '', folder: 'My Dashboard' },
            activeDashboardName: "",
            activeDashboardId: null, // Track DB ID for viewing/deleting
            isEditMode: true,
            templates: [
                { id: 1, name: 'B2B Sales Overview', charts: 12, icon: 'fa-line-chart' },
                { id: 2, name: 'E-Commerce Analytics', charts: 8, icon: 'fa-shopping-cart' },
                { id: 3, name: 'Financial Summary', charts: 15, icon: 'fa-university' },
                { id: 4, name: 'Inventory Management', charts: 6, icon: 'fa-archive' },
                { id: 5, name: 'Marketing Campaign', charts: 10, icon: 'fa-bullhorn' },
                { id: 6, name: 'Customer Success', charts: 7, icon: 'fa-users' },
                { id: 7, name: 'HR & Operations', charts: 5, icon: 'fa-id-card' },
                { id: 8, name: 'SaaS Metrics (MRR)', charts: 9, icon: 'fa-refresh' },
                { id: 9, name: 'Supply Chain Logistics', charts: 11, icon: 'fa-truck' },
                { id: 10, name: 'Support Helpdesk', charts: 4, icon: 'fa-life-ring' },
                { id: 11, name: 'Website Traffic', charts: 8, icon: 'fa-globe' },
                { id: 12, name: 'Executive Dashboard', charts: 14, icon: 'fa-user-tie' }
            ],
            kpis: []
        });

        onWillStart(async () => {
            await this.loadDashboards();
        });

        loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js");

        useEffect(() => {
            if (this.state.currentView === 'dashboard' && this.salesChartRef.el) {
                this.renderChart();
            }
        }, () => [this.state.currentView, this.state.kpis]);
    }

    async loadDashboards() {
        const dashboards = await this.orm.searchRead(
            "marketplace.dashboard",
            [],
            ["id", "name", "config_data"]
        );
        this.state.savedDashboards = dashboards;
    }

    async applyChanges() {
        const val = {
            name: this.state.activeDashboardName,
            config_data: JSON.stringify(this.state.kpis),
        };
        // If it's an existing dashboard, write. If new, create.
        if (this.state.activeDashboardId) {
            await this.orm.write("marketplace.dashboard", [this.state.activeDashboardId], val);
        } else {
            await this.orm.create("marketplace.dashboard", [val]);
        }
        await this.loadDashboards();
        this.state.currentView = 'landing';
        this.state.draftCharts = [];
    }

    async viewDashboard(db) {
        this.state.activeDashboardName = db.name;
        this.state.activeDashboardId = db.id;
        this.state.kpis = JSON.parse(db.config_data || "[]");
        this.state.currentView = 'dashboard';
        this.state.isEditMode = false;
    }

    async deleteSavedDashboard(id) {
        if (confirm("Are you sure you want to delete this dashboard?")) {
            await this.orm.unlink("marketplace.dashboard", [id]);
            await this.loadDashboards();
            this.state.currentView = 'landing';
        }
    }

    openConfigModal(template) {
        this.state.newConfig.name = template.name + " (Copy)";
        this.state.showConfigModal = true;
    }

    closeModals() {
        this.state.showConfigModal = false;
        this.state.showUploadModal = false;
    }

    goToUpload() {
        this.state.showConfigModal = false;
        this.state.showUploadModal = true;
    }

    triggerFileInput() { this.fileInput.el.click(); }

    async onFileChange(ev) {
        const file = ev.target.files[0];
        if (!file) return;
        this.state.isGenerating = true;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_name', this.state.newConfig.name);
        formData.append('csrf_token', odoo.csrf_token);

        try {
            const response = await fetch('/dashboard/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok && result.kpis) {
                this.state.kpis = result.kpis.map((kpi, index) => ({ ...kpi, id: index + 1 }));
                this.state.activeDashboardName = this.state.newConfig.name;
                this.state.activeDashboardId = null; // New upload is a draft
                this.state.currentView = 'dashboard';
                this.state.isEditMode = true;
                this.state.draftCharts = [{name: this.state.activeDashboardName}];
            }
        } catch (error) {
            console.error("Analysis Failed:", error);
        } finally {
            this.state.isGenerating = false;
            this.state.showUploadModal = false;
        }
    }

    renderChart() {
        if (!this.salesChartRef.el) return;
        new Chart(this.salesChartRef.el, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{ label: 'Market Trends', data: [65, 59, 80, 81, 56, 95], backgroundColor: '#5fa4a6', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    toggleEditMode() { this.state.isEditMode = !this.state.isEditMode; }
    deleteDashboard() { this.state.currentView = 'landing'; this.state.draftCharts = []; }
    goHome() { this.state.currentView = 'landing'; }
}

MarketplaceDashboard.template = "marketplace_dashboard.Dashboard";
registry.category("actions").add("marketplace_dashboard.dashboard", MarketplaceDashboard);