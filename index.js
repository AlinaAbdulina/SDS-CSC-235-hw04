const COLORS = {
  Instagram: "blue",
  TikTok: "red",
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

  const lineData = platforms.map(platform => {
    const points = ages.map(age => {
      const group = data.filter(d => d.platform_usage === platform && d.age === age);
      if (!group.length) return null;
      const avg = d3.mean(group, d => d.stress_level);
      const sd  = d3.deviation(group, d => d.stress_level) || 0;
      return { age, avg, sd };
    }).filter(Boolean);
    return { platform, points };
  });

  const x = d3.scaleLinear().domain([13, 19]).range([0, w]);
  const y = d3.scaleLinear().domain([0, 10]).range([h, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickValues(ages).tickFormat(d3.format("d")));

  svg.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", w / 2).attr("y", h + 40)
    .attr("text-anchor", "middle").attr("font-size", 12)
    .text("Age");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -h / 2).attr("y", -40)
    .attr("text-anchor", "middle").attr("font-size", 12)
    .text("Average Stress Level (0-10)");

  const line = d3.line().x(d => x(d.age)).y(d => y(d.avg));

  lineData.forEach(({ platform, points }) => {

    // Standard deviation
    const area = d3.area()
      .x(d => x(d.age))
      .y0(d => y(Math.max(0, d.avg - d.sd)))
      .y1(d => y(Math.min(10, d.avg + d.sd)));

    svg.append("path")
      .datum(points)
      .attr("class", `band-${platform}`)
      .attr("fill", COLORS[platform])
      .attr("opacity", 0.12)
      .attr("d", area);

    // Error bar
    const errorBarCapWidth = 6;
    svg.selectAll(`.ebar-${platform}`)
      .data(points)
      .join("g")
      .attr("class", `ebar-${platform}`)
      .each(function(d) {
        const g = d3.select(this);
        const cx = x(d.age);
        const yTop = y(Math.min(10, d.avg + d.sd));
        const yBot = y(Math.max(0, d.avg - d.sd));

        g.append("line")
          .attr("x1", cx).attr("x2", cx)
          .attr("y1", yTop).attr("y2", yBot)
          .attr("stroke", COLORS[platform])
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.6);

        g.append("line")
          .attr("x1", cx - errorBarCapWidth).attr("x2", cx + errorBarCapWidth)
          .attr("y1", yTop).attr("y2", yTop)
          .attr("stroke", COLORS[platform])
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.6);

        g.append("line")
          .attr("x1", cx - errorBarCapWidth).attr("x2", cx + errorBarCapWidth)
          .attr("y1", yBot).attr("y2", yBot)
          .attr("stroke", COLORS[platform])
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.6);
      });

    svg.append("path")
      .datum(points)
      .attr("class", `line-${platform}`)
      .attr("fill", "none")
      .attr("stroke", COLORS[platform])
      .attr("stroke-width", 2.5)
      .attr("d", line);

    svg.selectAll(`.dot-${platform}`)
      .data(points)
      .join("circle")
      .attr("class", `dot-${platform}`)
      .attr("cx", d => x(d.age)).attr("cy", d => y(d.avg))
      .attr("r", 5).attr("fill", COLORS[platform])
      .on("mousemove", (event, d) => {
        tooltip.classed("hidden", false)
          .style("left", (event.clientX + 12) + "px")
          .style("top",  (event.clientY - 28) + "px")
          .html(`<strong>${platform}</strong><br>Age: ${d.age}<br>Avg Stress: ${d.avg.toFixed(2)}<br>±SD: ${d.sd.toFixed(2)}`);
      })
      .on("mouseleave", () => tooltip.classed("hidden", true));
  });

  const legend = svg.append("g").attr("transform", `translate(0, ${h + 55})`);
  Object.entries(COLORS).forEach(([name, color], i) => {
    legend.append("circle").attr("cx", i * 110 + 6).attr("cy", 0).attr("r", 5).attr("fill", color);
    legend.append("text").attr("x", i * 110 + 15).attr("y", 4).attr("font-size", 11).text(name);
  });

  // Bar chart
  const bm = { top: 30, right: 20, bottom: 40, left: 50 };
  const BW = W;   // 600 — matches line chart
  const BH = H;   // 440 — matches line chart
  const bw = BW - bm.left - bm.right;
  const bh = BH - bm.top - bm.bottom;

  const barSvg = d3.select("#bar-container")
    .append("svg").attr("width", BW).attr("height", BH)
    .append("g").attr("transform", `translate(${bm.left},${bm.top})`);

  const barData = platforms.map(p => ({
    platform: p,
    avg: d3.mean(data.filter(d => d.platform_usage === p), d => d.stress_level),
    sd:  d3.deviation(data.filter(d => d.platform_usage === p), d => d.stress_level) || 0
  }));

  const bx = d3.scaleBand().domain(platforms).range([0, bw]).padding(0.3);
  const by = d3.scaleLinear().domain([0, 10]).range([bh, 0]);

  barSvg.append("g").attr("transform", `translate(0,${bh})`).call(d3.axisBottom(bx));
  barSvg.append("g").call(d3.axisLeft(by).ticks(5));

  barSvg.append("text")
    .attr("x", bw / 2).attr("y", -10)
    .attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", "bold")
    .text("Overall Avg Stress by Platform");

  barSvg.append("text")
    .attr("transform", "rotate(-90)").attr("x", -bh / 2).attr("y", -40)
    .attr("text-anchor", "middle").attr("font-size", 11)
    .text("Avg Stress (0-10)");

  barSvg.selectAll("rect").data(barData).join("rect")
    .attr("x", d => bx(d.platform)).attr("y", d => by(d.avg))
    .attr("width", bx.bandwidth()).attr("height", d => bh - by(d.avg))
    .attr("fill", d => COLORS[d.platform])
    .on("mousemove", (event, d) => {
      tooltip.classed("hidden", false)
        .style("left", (event.clientX + 12) + "px")
        .style("top",  (event.clientY - 28) + "px")
        .html(`<strong>${d.platform}</strong><br>Avg Stress: ${d.avg.toFixed(2)}<br>±SD: ${d.sd.toFixed(2)}`);
    })
    .on("mouseleave", () => tooltip.classed("hidden", true));

  // Error bars
  barSvg.selectAll(".bar-ebar")
    .data(barData)
    .join("g")
    .attr("class", "bar-ebar")
    .each(function(d) {
      const g = d3.select(this);
      const cx = bx(d.platform) + bx.bandwidth() / 2;
      const yTop = by(Math.min(10, d.avg + d.sd));
      const yBot = by(Math.max(0, d.avg - d.sd));
      const capW = 10;

      g.append("line")
        .attr("x1", cx).attr("x2", cx)
        .attr("y1", yTop).attr("y2", yBot)
        .attr("stroke", "black").attr("stroke-width", 1.5);

      g.append("line")
        .attr("x1", cx - capW).attr("x2", cx + capW)
        .attr("y1", yTop).attr("y2", yTop)
        .attr("stroke", "black").attr("stroke-width", 1.5);

      g.append("line")
        .attr("x1", cx - capW).attr("x2", cx + capW)
        .attr("y1", yBot).attr("y2", yBot)
        .attr("stroke", "black").attr("stroke-width", 1.5);
    });
});

// Filter
function filterPlatform(platform) {
  const platforms = ["Instagram", "TikTok", "Both"];
  platforms.forEach(p => {
    const visible = platform === "All" || p === platform;
    svg.selectAll(`.line-${p}`).attr("opacity", visible ? 1 : 0.05);
    svg.selectAll(`.dot-${p}`).attr("opacity", visible ? 1 : 0.05);
    svg.selectAll(`.band-${p}`).attr("opacity", visible ? 0.12 : 0.01);
    svg.selectAll(`.ebar-${p}`).attr("opacity", visible ? 1 : 0.05);
  });
  document.querySelectorAll("button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === platform);
  });
}