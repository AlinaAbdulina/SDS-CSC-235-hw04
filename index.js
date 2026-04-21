const COLORS = {
  Instagram: "steelblue",
  TikTok: "tomato",
  Both: "orange"
};

const margin = { top: 20, right: 20, bottom: 70, left: 50 };
const W = 600, H = 440;
const w = W - margin.left - margin.right;
const h = H - margin.top - margin.bottom;

const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", W)
  .attr("height", H)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.csv("Teen_Mental_Health_Dataset.csv", d => ({
  age:           +d.age,
  platform_usage: d.platform_usage,
  stress_level:  +d.stress_level
})).then(data => {

  const platforms = ["Instagram", "TikTok", "Both"];
  const ages = [13, 14, 15, 16, 17, 18, 19];

  // Compute average stress per platform per age
  const lineData = platforms.map(platform => {
    const points = ages.map(age => {
      const group = data.filter(d => d.platform_usage === platform && d.age === age);
      const avg = group.length ? d3.mean(group, d => d.stress_level) : null;
      return { age, avg };
    }).filter(d => d.avg !== null);
    return { platform, points };
  });

  const x = d3.scaleLinear().domain([13, 19]).range([0, w]);
  const y = d3.scaleLinear().domain([0, 10]).range([h, 0]);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickValues(ages).tickFormat(d3.format("d")));

  // Y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // X label
  svg.append("text")
    .attr("x", w / 2).attr("y", h + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Age");

  // Y label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -h / 2).attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Average Stress Level (0-10)");

  // Line generator
  const line = d3.line()
    .x(d => x(d.age))
    .y(d => y(d.avg));

  // Draw lines
  lineData.forEach(({ platform, points }) => {
    svg.append("path")
      .datum(points)
      .attr("class", `line-${platform}`)
      .attr("fill", "none")
      .attr("stroke", COLORS[platform])
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Dots on each point
    svg.selectAll(`.dot-${platform}`)
      .data(points)
      .join("circle")
      .attr("class", `dot-${platform}`)
      .attr("cx", d => x(d.age))
      .attr("cy", d => y(d.avg))
      .attr("r", 5)
      .attr("fill", COLORS[platform])
      .on("mousemove", (event, d) => {
        tooltip
          .classed("hidden", false)
          .style("left", (event.clientX + 12) + "px")
          .style("top",  (event.clientY - 28) + "px")
          .html(`<strong>${platform}</strong><br>Age: ${d.age}<br>Avg Stress: ${d.avg.toFixed(2)}`);
      })
      .on("mouseleave", () => tooltip.classed("hidden", true));
  });

  // Legend
  const legend = svg.append("g").attr("transform", `translate(0, ${h + 55})`);
  Object.entries(COLORS).forEach(([name, color], i) => {
    legend.append("circle").attr("cx", i * 110 + 6).attr("cy", 0).attr("r", 5).attr("fill", color);
    legend.append("text").attr("x", i * 110 + 15).attr("y", 4).attr("font-size", 11).text(name);
  });

});

// Filter function
function filterPlatform(platform) {
  const platforms = ["Instagram", "TikTok", "Both"];
  platforms.forEach(p => {
    const opacity = platform === "All" || p === platform ? 1 : 0.05;
    svg.selectAll(`.line-${p}`).attr("opacity", opacity);
    svg.selectAll(`.dot-${p}`).attr("opacity", opacity);
  });

  document.querySelectorAll("button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === platform);
  });
}