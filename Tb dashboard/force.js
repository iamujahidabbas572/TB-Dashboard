const forceWidth = 500;
const forceHeight = 300;
const forceSvg = d3.select("#force-graph")
  .attr("width", forceWidth)
  .attr("height", forceHeight);

// Tooltip
const forceTooltip = d3.select("#tooltip");

let yearFilter = 2020; // Default year
let metricFilter = "c.new.sp.tsr"; // Default metric

// Update the year display
const yearDisplay = document.getElementById("year-display");
const yearFilterElement = document.getElementById("year-filter");
if (yearFilterElement) {
  yearFilterElement.addEventListener("input", (event) => {
    yearFilter = +event.target.value;
    if (yearDisplay) {
      yearDisplay.textContent = yearFilter;
    }
    updateGraph();
  });
}

// Update the metric filter
const metricFilterElement = document.getElementById("metric-filter");
if (metricFilterElement) {
  metricFilterElement.addEventListener("change", (event) => {
    metricFilter = event.target.value;
    updateGraph();
  });
}

// Load and preprocess data
let rawData, nodes, links;

d3.csv("tb_preprocessfile_2.csv").then(data => {
  rawData = data;
  initializeGraph();
});

function preprocessData() {
  const filteredData = rawData.filter(d => +d.year === yearFilter);

  nodes = Array.from(new Set(filteredData.map(d => d["g.whoregion"]))).
    map(region => ({
      id: region,
      cases: d3.sum(filteredData.filter(d => d["g.whoregion"] === region), d => +d[metricFilter]),
      countries: filteredData.filter(d => d["g.whoregion"] === region).map(d => d.country)
    }));

  links = nodes.map((source, i) => {
    const target = nodes[(i + 1) % nodes.length];
    return {
      source: source.id,
      target: target.id,
      value: Math.random() * 10
    };
  });
}

function initializeGraph() {
  preprocessData();

  const maxCases = d3.max(nodes, d => d.cases);
  const minCases = d3.min(nodes, d => d.cases);

  const colorScale = d3.scaleLinear()
    .domain([minCases, maxCases])
    .range(["#d3e5ff", "#08306b"]);

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).strength(d => d.value / 10))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(forceWidth / 2, forceHeight / 2));

  const link = forceSvg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("stroke-width", d => Math.sqrt(d.value))
    .attr("stroke", "#ccc");

  const node = forceSvg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", d => colorScale(d.cases))
    .call(drag(simulation))
    .on("mouseover", (event, d) => {
      forceTooltip.style("visibility", "visible")
        .html(`<b>Region:</b> ${d.id}<br><b>Cases:</b> ${d.cases}`);
    })
    .on("mousemove", (event) => {
      forceTooltip.style("top", (event.pageY + 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => forceTooltip.style("visibility", "hidden"))
    .on("click", (event, d) => {
      link.style("stroke", l => l.source.id === d.id || l.target.id === d.id ? "orange" : "#ccc");
    });

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  // Add legend
  const force1Width = 200;
  const force1Height = 10;
  const legendMargin = 20;

  const legendScale = d3.scaleLinear()
    .domain([minCases, maxCases])
    .range([0, force1Width]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${Math.round((d / maxCases) * 100)}%`);

  const legend = forceSvg.append("g")
    .attr("transform", `translate(${forceWidth - force1Width - legendMargin}, ${forceHeight - 50})`);

  legend.append("rect")
    .attr("width", force1Width)
    .attr("height", force1Height)
    .style("fill", "url(#gradient)");

  legend.append("g")
    .attr("transform", `translate(0, ${force1Height})`)
    .call(legendAxis);

  const defs = forceSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "gradient");

  linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#d3e5ff");
  linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#08306b");
}

function updateGraph() {
  forceSvg.selectAll("*").remove();
  initializeGraph();
}

function drag(simulation) {
  return d3.drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
