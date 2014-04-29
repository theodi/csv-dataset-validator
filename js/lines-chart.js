var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

function make_x_axis() {
  return d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(15)
}
function make_y_axis() {
  return d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
}

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temperature); });

var svg = d3.select("lines-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function renderLinesChart(data) {
//d3.csv("test.csv", function(error, data) {
 
  console.log(data);
  color.domain(d3.keys(data[0]));

  x.domain(d3.extent(data, function(d) { return d.file; }));

  y.domain([
    d3.min(data, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(data, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  svg.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(make_x_axis()
            .tickSize(-height, 0, 0)
      )

  svg.append("g")
      .attr("class", "grid")
      .call(make_y_axis()
            .tickSize(-width, 0, 0)
      )
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Line count");

  var city = svg.selectAll(".city")
      .data(data)
      .enter().append("g")
      .attr("class", "city");

  city.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });

  city.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.file) + "," + y(d.value.value) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  var focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("circle")
      .attr("r", 4.5);

  focus.append("text")
      .attr("x", 9)
      .attr("dy", "1em");

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
        y0 = Math.round(y.invert(d3.mouse(this)[1]) * 10) / 10,
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    outval = null;
    for(var key in d) {
        if(d[key] == y0) {
                focus.attr("transform", "translate(" + x(d.file) + "," + y(y0) + ")");
                focus.select("text").text(y0);
        }
    }
  }
}
  
