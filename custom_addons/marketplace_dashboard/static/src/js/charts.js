import Chart from "chart.js/auto";

const ctx = document.getElementById("sales_chart");

new Chart(ctx,{
    type:'line',
    data:{
        labels:["Jan","Feb","Mar"],
        datasets:[{
            label:"Sales",
            data:[100,200,300]
        }]
    }
});