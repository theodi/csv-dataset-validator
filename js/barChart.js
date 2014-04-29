
var chart;
nv.addGraph(function() {
    chart = nv.models.multiBarChart()
      .transitionDuration(350)
      .reduceXTicks(false)   //If 'false', every single x-axis tick label will be rendered.
      .showControls(false)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
      .groupSpacing(0.1)    //Distance between each group of bars.
      .tooltip(function(key, xLong, y, e, graph) { return "<p style='font-size: 1em;'>" + xLong + ": <b>" + parseFloat(y).toFixed(0) + "</b></p>";})
   ;
 
//    chart.xAxis
//        .tickFormat(d3.format(',f'));
 
    chart.yAxis
        .axisLabel('Number of Lines')
        .tickFormat(d3.format(',.0f'));
  
});

function updateChart(chart,data) {

	d3.select('#lines-chart svg')
		.datum(data)
		.call(chart);

	var xTicks = d3.select('.nv-x.nv-axis > g').selectAll('g');
	xTicks
	  .selectAll('text')
	  .attr('transform', function(d,i,j) { return 'translate (-20, '+(3 * d.length).toString()+') rotate(-65 0,0)' }) ;

	nv.utils.windowResize(chart.update);
}
