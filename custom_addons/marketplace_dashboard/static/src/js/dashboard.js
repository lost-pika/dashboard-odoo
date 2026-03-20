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
            showSavedList: false,
            showDraftList: false,
            savedDashboards: [],
            draftCharts: [],
            showConfigModal: false,
            showUploadModal: false,
            isGenerating: false,
            newConfig: { name: '' },
            activeDashboardName: "",
            activeDashboardId: null,
            isEditMode: true,
            showSettings: false,
            userApiKey: localStorage.getItem('gemini_api_key') || "",
            templateSearchTerm: "", // New state for searching templates
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
            kpis: [],
            availableColumns: [],
            rawRecords: [],
            chartConfig: { chart_type: 'bar', labels: [], values: [], label_column: '', value_column: '' }
        });

        onWillStart(async () => { await this.loadDashboards(); });
        loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js");

        useEffect(() => {
        if (this.state.currentView === 'dashboard' && this.salesChartRef.el) {
            this.renderChart();
        }
    }, () => [
        this.state.currentView, 
        this.state.chartConfig.labels, // Watch the labels specifically
        this.state.chartConfig.values, // Watch the values specifically
        this.state.chartConfig.chart_type
    ]);
    }

    // Getter to filter templates based on search term
    get filteredTemplates() {
        const term = this.state.templateSearchTerm.toLowerCase();
        return this.state.templates.filter(t =>
            t.name.toLowerCase().includes(term)
        );
    }

    saveUserKey() {
        localStorage.setItem('gemini_api_key', this.state.userApiKey);
        this.state.showSettings = false;
    }

    async loadDashboards() {
        const all = await this.orm.searchRead("marketplace.dashboard", [], ["id", "name", "config_data", "state"]);
        this.state.savedDashboards = all.filter(r => r.state === 'published');
        this.state.draftCharts = all.filter(r => r.state === 'draft');
    }

    async viewDashboard(db) {
        this.state.activeDashboardName = db.name;
        this.state.activeDashboardId = db.id;
        try {
            const data = JSON.parse(db.config_data || "{}");
            this.state.rawRecords = data.rawRecords || []; // Add this
            this.state.kpis = data.kpis || [];
            this.state.chartConfig = data.chartConfig || this.state.chartConfig;
            this.state.availableColumns = data.availableColumns || [];
            this.state.currentView = 'dashboard';
            this.state.isEditMode = false;
        } catch (e) {
            console.error("Error loading dashboard", e);
        }
    }

    async updateChartDimension(newCol) {
        this.state.chartConfig.label_column = newCol;
        this._updateChartData();
    }

    exportToExcel() {
        if (!this.state.rawRecords || this.state.rawRecords.length === 0) return;

        // 1. Get headers from the first record
        const headers = Object.keys(this.state.rawRecords[0]);

        // 2. Build CSV rows
        const csvContent = [
            headers.join(','), // Header row
            ...this.state.rawRecords.map(row =>
                headers.map(fieldName => {
                    let value = row[fieldName] === null ? '' : row[fieldName];
                    // Escape commas and quotes for CSV safety
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        // 3. Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${this.state.activeDashboardName}_data.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async resumeEdit(draft) {
        this.state.activeDashboardName = draft.name;
        this.state.activeDashboardId = draft.id;
        try {
            const data = JSON.parse(draft.config_data || "{}");
            this.state.kpis = data.kpis || [];
            this.state.chartConfig = data.chartConfig || this.state.chartConfig;
            this.state.availableColumns = data.availableColumns || [];
            this.state.currentView = 'dashboard';
            this.state.isEditMode = true;
        } catch (e) {
            console.error("Draft Corrupted", e);
        }
    }

    async deleteSavedDashboard(ev, id) {
        if (ev) { ev.stopPropagation(); }
        if (confirm("Are you sure you want to delete this?")) {
            await this.orm.unlink("marketplace.dashboard", [id]);
            await this.loadDashboards();
            this.state.currentView = 'landing';
        }
    }

    async onFileChange(ev) {
        const file = ev.target.files[0];
        if (!file) return;
        this.state.isGenerating = true;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_name', this.state.newConfig.name);
        formData.append('csrf_token', odoo.csrf_token);
        formData.append('user_api_key', this.state.userApiKey);

        try {
            const res = await fetch('/dashboard/upload', { method: 'POST', body: formData });
            const result = await res.json();
            if (res.ok) {
                this.state.kpis = result.kpis.map((k, i) => ({ ...k, id: i + 1 }));
                // Store the raw records for dynamic filtering/grouping
                this.state.rawRecords = result.raw_records;
                this.state.chartConfig = {
                    chart_type: result.chart_data.type,
                    label_column: result.chart_data.label_column,
                    value_column: result.chart_data.value_column,
                    // These will now be calculated dynamically
                    labels: result.chart_data.labels,
                    values: result.chart_data.values,
                };
                this.state.availableColumns = result.available_columns;
                this.state.activeDashboardName = this.state.newConfig.name;

                const newDraft = await this.orm.create("marketplace.dashboard", [{
                    name: this.state.activeDashboardName,
                    config_data: JSON.stringify({ kpis: this.state.kpis, chartConfig: this.state.chartConfig, availableColumns: this.state.availableColumns }),
                    state: 'draft'
                }]);
                this.state.activeDashboardId = newDraft[0];
                await this.loadDashboards();
                this.state.currentView = 'dashboard';
            } else { alert(result.error); }
        } finally { ev.target.value = ""; this.state.isGenerating = false; this.state.showUploadModal = false; }
    }

    renderChart() {
        if (!this.salesChartRef.el) return;
        if (this.chart) { this.chart.destroy(); }

        // High visibility palette
        const chartColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const isDarkMode = document.body.classList.contains('dark-mode');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDarkMode ? '#cbd5e1' : '#475569';

        this.chart = new Chart(this.salesChartRef.el, {
            type: this.state.chartConfig.chart_type,
            data: {
                labels: this.state.chartConfig.labels,
                datasets: [{
                    label: this.state.chartConfig.value_column,
                    data: this.state.chartConfig.values,
                    backgroundColor: this.state.chartConfig.chart_type === 'pie' ? chartColors : '#6366f1',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    y: { grid: { color: gridColor }, ticks: { color: textColor } },
                    x: { grid: { color: gridColor }, ticks: { color: textColor } }
                }
            }
        });
    }

    toggleDarkMode() {
        this.state.isDarkMode = !this.state.isDarkMode;
        document.body.classList.toggle('dark-mode', this.state.isDarkMode);
        this.renderChart(); // Re-render to update grid/text colors
    }

    async updateChartMeasure(newCol) {
        this.state.chartConfig.value_column = newCol;
        this._updateChartData();
    }

    // Helper to centralize the grouping logic
    _updateChartData() {
        if (this.state.rawRecords && this.state.rawRecords.length > 0) {
            const labelCol = this.state.chartConfig.label_column;
            const valCol = this.state.chartConfig.value_column;
            
            const grouped = {};
            this.state.rawRecords.forEach(rec => {
                const label = rec[labelCol] || "Unknown";
                const val = parseFloat(rec[valCol]) || 0;
                grouped[label] = (grouped[label] || 0) + val;
            });

            const topEntries = Object.entries(grouped).slice(0, 10);
            
            // Re-assign the entire arrays to trigger Owl's proxy logic
            this.state.chartConfig.labels = topEntries.map(e => String(e[0]));
            this.state.chartConfig.values = topEntries.map(e => e[1]);
            
            // Explicitly call render just in case the proxy delay is too long
            this.renderChart();
        }
    }

    async applyChanges() {
        if (this.state.activeDashboardId) {
            await this.orm.write("marketplace.dashboard", [this.state.activeDashboardId], {
                state: 'published',
                config_data: JSON.stringify({
                    kpis: this.state.kpis,
                    chartConfig: this.state.chartConfig,
                    availableColumns: this.state.availableColumns,
                    rawRecords: this.state.rawRecords // Ensure this is saved
                })
            });
        }
        await this.loadDashboards();
        this.state.currentView = 'landing';
    }

    openConfigModal(t) { this.state.newConfig.name = t.name + " (Copy)"; this.state.showConfigModal = true; }
    closeModals() { this.state.showConfigModal = false; this.state.showUploadModal = false; }
    goToUpload() { this.state.showConfigModal = false; this.state.showUploadModal = true; }
    triggerFileInput() { this.fileInput.el.click(); }
    toggleEditMode() { this.state.isEditMode = !this.state.isEditMode; }
    goHome() { this.state.currentView = 'landing'; }
    deleteDashboard() { this.state.currentView = 'landing'; }
}

MarketplaceDashboard.template = "marketplace_dashboard.Dashboard";
MarketplaceDashboard.props = {
    "*": { optional: true },
};
registry.category("actions").add("marketplace_dashboard.dashboard", MarketplaceDashboard);