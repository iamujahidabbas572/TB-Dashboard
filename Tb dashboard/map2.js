// Set dimensions for the map
const mapWidth = 1200, mapHeight = 500;
// const mapWidth = 500, mapHeight = 400;

// SVG and projection setup
const svg = d3.select("#map")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

const projection = d3.geoNaturalEarth1()
  .scale(140)
  .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3.select("#tooltip");

// Load data and GeoJSON
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("tx_2022-08-29.csv")
]).then(([geoData, csvData]) => {
  // Convert CSV data to a usable format
  csvData.forEach(d => {
    d.year = +d.year;
    d["c.new.tsr"] = +d["c.new.tsr"];
  });

  // Prepare color scale for treatment success rate
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, 100]); // 0% to 100%

  // Add color legend
  addLegend(colorScale);

  // Prepare country dropdown
  const countries = [...new Set(csvData.map(d => d.country))].sort();
  d3.select("#regionFilter")
    .attr("id", "countryFilter")
    .selectAll("option")
    .data(["All Countries", ...countries])
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d);

  // Join CSV data to GeoJSON
  geoData.features.forEach(feature => {
    const countryData = csvData.find(d => d.iso3 === feature.id);
    feature.properties = {
      tsr: countryData ? countryData["c.new.tsr"] : null,
      region: countryData ? countryData.g_whoregion : "Unknown",
      year: countryData ? countryData.year : "Unknown",
      country: countryData ? countryData.country : "Unknown"
    };
  });

  // Draw map
  const paths = svg.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => d.properties.tsr ? colorScale(d.properties.tsr) : "#ccc")
    .attr("stroke", "#333")
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(
          `<strong>${d.properties.country || "Unknown"}</strong><br>
          TSR: ${d.properties.tsr || "N/A"}%<br>
          Year: ${d.properties.year || "N/A"}`
        );
    })
    .on("mousemove", event => {
      tooltip.style("top", `${event.pageY + 5}px`)
        .style("left", `${event.pageX + 5}px`);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });

  // Zoom and Pan
  svg.call(d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", event => {
      svg.selectAll("path").attr("transform", event.transform);
    }));

  d3.select("#countryFilter").on("change", function () {
    const selectedCountry = this.value;
    updateMap({ country: selectedCountry });
  });

  // Function to update map
  function updateMap({ year, country }) {
    console.log("Selected Year:", year);
    console.log("Selected Country:", country);

    const filteredData = csvData.filter(d => {
      const matchesYear = !year || d.year === year;
      const matchesCountry = country === "All Countries" || d.country === country;
      return matchesYear && matchesCountry;
    });

    console.log("Filtered Data:", filteredData);

    geoData.features.forEach(feature => {
      const countryData = filteredData.find(d => d.iso3 === feature.id);
      feature.properties.tsr = countryData ? countryData["c.new.tsr"] : null;
    });

    const paths = svg.selectAll("path");
    paths.transition()
      .duration(500)
      .attr("fill", d => d.properties.tsr ? colorScale(d.properties.tsr) : "#ccc");
  }

  // Add legend
  function addLegend(scale) {
    const map1Width = 200, map1Height = 20;
    const legendSvg = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${mapWidth - map1Width - 20}, ${mapHeight - 50})`);

    const gradient = legendSvg.append("defs")
      .append("linearGradient")
      .attr("id", "legendGradient");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", scale(0));

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", scale(100));

    legendSvg.append("rect")
      .attr("width", map1Width)
      .attr("height", map1Height)
      .style("fill", "url(#legendGradient)");

    const legendScale = d3.scaleLinear()
      .domain(scale.domain())
      .range([0, map1Width]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    legendSvg.append("g")
      .attr("transform", `translate(0, ${map1Height})`)
      .call(legendAxis);
  }
});
