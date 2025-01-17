// Set dimensions and margins
const timeMargin = { top: 20, right: 30, bottom: 50, left: 70 };
let timeWidth = 500 - timeMargin.left - timeMargin.right;
const timeHeight = 370 - timeMargin.top - timeMargin.bottom;

// Create SVG container
const timeSvgTimeline = d3.select("#timeline")
  .attr("width", timeWidth + timeMargin.left + timeMargin.right)
  .attr("height", timeHeight + timeMargin.top + timeMargin.bottom)
  .append("g")
  .attr("transform", `translate(${timeMargin.left}, ${timeMargin.top})`);

// Tooltip
const timeTooltip = d3.select("#tooltip");

// Scales
const timeX = d3.scaleLinear().range([0, timeWidth]);
const timeY = d3.scaleLinear().range([timeHeight, 0]);

// Line generator
const timeLine = d3.line()
  .x(d => timeX(d.year))
  .y(d => timeY(d.value));

// Zoom behavior
const timeZoom = d3.zoom()
  .scaleExtent([1, 8]) // Set zoom limits
  .on("zoom", event => {
    timeSvgTimeline.selectAll(".x-axis").call(d3.axisBottom(timeX).scale(event.transform.rescaleX(timeX))); // Update X-axis
    timeSvgTimeline.selectAll(".line").attr("transform", event.transform); // Zoom lines
    timeSvgTimeline.selectAll(".circle").attr("transform", event.transform); // Zoom points
  });

// Add zoom functionality to the SVG
timeSvgTimeline.call(timeZoom);

// Load data
d3.csv("tb_preprocessfile_2.csv").then(data => {
  // Parse and clean data
  data.forEach(d => {
    d.year = +d.year;
    d["c.new.tsr"] = +d["c.new.tsr"];
    d["new.sp.cur"] = +d["new.sp.cur"];
    d["new.sp.died"] = +d["new.sp.died"];
  });

  // Extract unique countries
  const timeCountries = [...new Set(data.map(d => d.country))].sort();

  // Populate country filter
  d3.select("#countryFilter")
    .selectAll("option")
    .data(["All Countries", ...timeCountries])
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d);

  // Initialize chart with default settings
  updateChart("All Countries", "c.new.tsr");

  // Update chart when filters change
  d3.select("#countryFilter").on("change", function () {
    const country = this.value;
    const metric = d3.select("#metricFilter").property("value");
    updateChart(country, metric);
  });

  d3.select("#metricFilter").on("change", function () {
    const metric = this.value;
    const country = d3.select("#countryFilter").property("value");
    updateChart(country, metric);
  });

  // Function to update the chart
  function updateChart(country, metric) {
    // Filter data
    const timeFilteredData = country === "All Countries"
      ? data
      : data.filter(d => d.country === country);

    // Group data by year and calculate the average metric
    const timeGroupedData = d3.rollup(
      timeFilteredData,
      v => d3.mean(v, d => d[metric]),
      d => d.year
    );

    // Convert grouped data to array
    const timeProcessedData = Array.from(timeGroupedData, ([year, value]) => ({ year, value }));

    // Update scales
    timeX.domain(d3.extent(timeProcessedData, d => d.year));
    timeY.domain([0, d3.max(timeProcessedData, d => d.value)]);

    // Color scale for the points (from light to dark based on value)
    const timeColorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([d3.min(timeProcessedData, d => d.value), d3.max(timeProcessedData, d => d.value)]);

    // Draw axes
    timeSvgTimeline.selectAll(".x-axis").remove();
    timeSvgTimeline.selectAll(".y-axis").remove();

    timeSvgTimeline.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${timeHeight})`)
      .call(d3.axisBottom(timeX).ticks(10).tickFormat(d3.format("d")));

    timeSvgTimeline.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(timeY));

    // Bind data and update line
    const timePath = timeSvgTimeline.selectAll(".line").data([timeProcessedData]);

    timePath.enter()
      .append("path")
      .attr("class", "line")
      .merge(timePath)
      .transition()
      .duration(1000)
      .attr("d", timeLine)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    timePath.exit().remove();

    // Bind data and update points
    const timePoints = timeSvgTimeline.selectAll(".circle").data(timeProcessedData);

    timePoints.enter()
      .append("circle")
      .attr("class", "circle")
      .merge(timePoints)
      .transition()
      .duration(1000)
      .attr("cx", d => timeX(d.year))
      .attr("cy", d => timeY(d.value))
      .attr("r", 5)
      .attr("fill", d => timeColorScale(d.value)); // Apply color scale

    timePoints.exit().remove();

    // Tooltip interaction
    timeSvgTimeline.selectAll(".circle")
      .on("mouseover", (event, d) => {
        timeTooltip.style("display", "block")
          .html(`
            <strong>Year:</strong> ${d.year}<br>
            <strong>Value:</strong> ${d.value.toFixed(2)}
          `);
      })
      .on("mousemove", event => {
        timeTooltip.style("top", `${event.pageY + 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        timeTooltip.style("display", "none");
      })
      .on("click", (event, d) => zoomToPoint(d)); // Click to zoom interaction

    // Zoom to specific point when clicked
    function zoomToPoint(d) {
      const timeXScale = d3.scaleLinear().range([0, timeWidth]).domain([d.year - 1, d.year + 1]); // Zoom around the clicked year
      const timeYScale = d3.scaleLinear().range([timeHeight, 0]).domain([d.value * 0.9, d.value * 1.1]); // Zoom around the clicked value

      timeSvgTimeline.transition().duration(750).call(
        timeZoom.transform,
        d3.zoomIdentity
          .scale(3) // Set zoom level
          .translate(-timeX(d.year) + timeWidth / 2, -timeY(d.value) + timeHeight / 2) // Center on the clicked point
      );
    }

    // Add legend for color scale
    const time2Width = 200;
    const time2Height = 10;

    const timeLegend = timeSvgTimeline.append("g")
      .attr("transform", `translate(${timeWidth - time2Width - 20}, ${timeHeight + 30})`); // Move the legend down

    const timeLegendScale = d3.scaleLinear()
      .domain([d3.min(timeProcessedData, d => d.value), d3.max(timeProcessedData, d => d.value)])
      .range([0, time2Width]);

    timeLegend.append("rect")
      .attr("width", time2Width)
      .attr("height", time2Height)
      .attr("fill", "url(#gradient)");

    // Add color stops to the gradient
    timeLegend.selectAll("rect")
      .data(timeLegendScale.ticks(5))
      .enter()
      .append("rect")
      .attr("x", d => timeLegendScale(d))
      .attr("width", timeLegendScale(timeLegendScale.ticks(5)[0]) - timeLegendScale(timeLegendScale.ticks(5)[4]))
      .attr("height", time2Height)
      .attr("fill", d => timeColorScale(d));

    // Define a gradient
    timeSvgTimeline.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%")
      .selectAll("stop")
      .data(timeColorScale.range())
      .enter()
      .append("stop")
      .attr("offset", (d, i) => `${(i / (timeColorScale.range().length - 1)) * 100}%`)
      .attr("stop-color", d => d);

    // Add labels to the legend
    timeLegend.append("text")
      .attr("x", 0)
      .attr("y", time2Height + 20)
      .attr("text-anchor", "middle")
      .text("0%");

    timeLegend.append("text")
      .attr("x", time2Width)
      .attr("y", time2Height + 20)
      .attr("text-anchor", "middle")
      .text("100%");
  }
});
