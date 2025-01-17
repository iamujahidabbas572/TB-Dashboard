// ✅ 1. Verify JS is Loaded
console.log("✅ JavaScript file is successfully loaded!");

// ✅ 2. Dimensions and Initial Setup
const treeWidth1 = 700;
const treeHeight1 = 500;
const treePadding1 = 2;

// ✅ 3. Create SVG and Groups
const treeSvg1 = d3.select("#treeContainer")
    .attr("width", treeWidth1)
    .attr("height", treeHeight1)
    .append("g")
    .attr("transform", "translate(0,0)");

// ✅ 4. Create Tooltip
const treeTooltip1 = d3.select("#treeTooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("font-size", "12px");

// ✅ 5. Color Scale
const treeColorScale1 = d3.scaleOrdinal(d3.schemeCategory10);

// ✅ 6. Year Slider (Dynamic Check)
const treeYearSlider1 = document.getElementById("treeYearSlider") || document.getElementById("year-slider");
const treeYearLabel1 = document.getElementById("treeYearLabel") || document.getElementById("year-display");

// ✅ 7. Declare Global Data Variable
let treeData1 = null;

// ✅ 8. JSON Loading
console.log("⏳ Attempting to load JSON file...");
d3.json("notified.json")
    .then(data => {
        console.log("✅ JSON Data Loaded:", data);
        treeData1 = data; // Store the data globally

        let currentTreeYear1 = treeYearSlider1?.value || "2020";
        renderTreeMap1(currentTreeYear1);

        // Slider Event Listener
        if (treeYearSlider1) {
            treeYearSlider1.addEventListener("input", function () {
                currentTreeYear1 = this.value;
                treeYearLabel1.textContent = currentTreeYear1;
                renderTreeMap1(currentTreeYear1);
            });
        }
    })
    .catch(error => {
        console.error("❌ Failed to load JSON:", error);
    });

// ✅ 9. Tree Map Rendering Function
function renderTreeMap1(year) {
    console.log(`ℹ️ Rendering Tree Map for Year: ${year}`);

    treeSvg1.selectAll("*").remove();

    // Verify if treeData1 exists and year exists in data
    if (!treeData1 || !treeData1[year]) {
        console.error(`❌ Year ${year} not found in the data.`);
        return;
    }

    // Hierarchical Structure
    const treeRoot1 = d3.hierarchy(treeData1[year])
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);

    // Treemap Layout
    const treeMapLayout1 = d3.treemap()
        .size([treeWidth1, treeHeight1])
        .padding(treePadding1)
        .round(true);

    treeMapLayout1(treeRoot1);

    const treeLeaves1 = treeSvg1.selectAll("g")
        .data(treeRoot1.leaves())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

    // ✅ Add Rectangles with Valid Dimensions
    treeLeaves1.append("rect")
        .attr("width", d => Math.max(0, d.x1 - d.x0))
        .attr("height", d => Math.max(0, d.y1 - d.y0))
        .attr("fill", d => treeColorScale1(d.parent?.data?.name))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            treeTooltip1.style("visibility", "visible")
                .html(`<strong>${d.data.name}</strong><br>Value: ${d.value}`);
        })
        .on("mousemove", event => {
            treeTooltip1.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            treeTooltip1.style("visibility", "hidden");
        });

    // ✅ Add Labels
    treeLeaves1.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "10px")
        .attr("fill", "black")
        .text(d => d.data.name);

    treeLeaves1.append("text")
        .attr("x", 5)
        .attr("y", 30)
        .attr("font-size", "8px")
        .attr("fill", "black")
        .text(d => d.value);

    // ✅ Zoom and Pan
    const zoom1 = d3.zoom()
        .scaleExtent([1, 5]) // Min and Max Zoom
        .translateExtent([[0, 0], [treeWidth1, treeHeight1]])
        .on("zoom", (event) => {
            treeSvg1.attr("transform", event.transform);
        });

    treeSvg1.call(zoom1);

    // ✅ Update Legend
    updateTreeLegend1(treeRoot1);
}

// ✅ 10. Update Legend Function
function updateTreeLegend1(treeRoot1) {
    console.log("ℹ️ Updating Legend...");
    const treeRegions1 = Array.from(
        new Set(treeRoot1.leaves().map(d => d.parent?.data?.name))
    );

    const treeLegend1 = d3.select("#treeLegend");
    treeLegend1.selectAll("div").remove();

    treeRegions1.forEach((region, i) => {
        treeLegend1.append("div")
            .html(`
                <span style="background:${treeColorScale1(region)}"></span>
                ${region}
            `);
    });
}
