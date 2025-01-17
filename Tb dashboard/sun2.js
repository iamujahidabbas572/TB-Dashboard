// Dimensions and radius
const sunburstWidthAlt = 450;
const sunburstHeightAlt = 450;
const sunburstRadiusAlt = sunburstWidthAlt / 2;

// SVG Container
const sunburstSvgAlt = d3.select("#unique-sunburst-svg")
    .attr("width", sunburstWidthAlt)
    .attr("height", sunburstHeightAlt)
    .append("g")
    .attr("transform", `translate(${sunburstWidthAlt / 2}, ${sunburstHeightAlt / 2})`);

// Tooltip
const sunburstTooltipAlt = d3.select("#unique-sunburst-tooltip");

// Color Scale
const sunburstColorAlt = d3.scaleOrdinal(d3.schemeCategory10);

// Partition Layout
const sunburstPartitionAlt = d3.partition()
    .size([2 * Math.PI, sunburstRadiusAlt]);

// Arc Generator
const sunburstArcAlt = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

// Load Data
d3.json("sunburst_data.json").then(data => {
    const transformedData = transformDataAlt(data);
    renderSunburstChartAlt(transformedData);
});

// 🔄 Transform Data for New Layers
function transformDataAlt(data) {
    return {
        name: "TB Report",
        children: data.children.map(incomeGroup => ({
            name: incomeGroup.name, // Income Level (Low, Middle)
            children: incomeGroup.children.map(country => ({
                name: country.name, // Country Name
                value: d3.sum(country.children, d => d.value) // Aggregate values
            }))
        }))
    };
}

// 🎨 Render Sunburst Chart
function renderSunburstChartAlt(data) {
    const rootAlt = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    sunburstPartitionAlt(rootAlt);

    // Draw Arcs
    const pathAlt = sunburstSvgAlt.selectAll("path")
        .data(rootAlt.descendants())
        .enter()
        .append("path")
        .attr("d", sunburstArcAlt)
        .attr("fill", d => sunburstColorAlt(d.depth))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
            sunburstTooltipAlt.style("visibility", "visible")
                .html(`<strong>${d.data.name}</strong><br>Value: ${d.value}`);
        })
        .on("mousemove", event => {
            sunburstTooltipAlt.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            sunburstTooltipAlt.style("visibility", "hidden");
        })
        .on("click", (event, d) => zoomSunburstAlt(d));

    // Add Labels
    sunburstSvgAlt.selectAll("text")
        .data(rootAlt.descendants().filter(d => d.depth > 0))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${sunburstArcAlt.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .text(d => (d.depth > 0 ? d.data.name : ''));

    // Zoom Functionality
    function zoomSunburstAlt(d) {
        sunburstSvgAlt.transition()
            .duration(1000)
            .attr("transform", `translate(${sunburstWidthAlt / 2}, ${sunburstHeightAlt / 2}) scale(1.5)`);
    }
}
