var width, height, projection, path, svg, g;

var color = d3.scale.threshold()
  .domain([30000, 40000, 50000, 60000, 70000])
  .range(["#FCDDC0", "#FFBB83", "#FF9933", "#F27D14", "#C15606"]);

width = 800;
height = 600;

draw();

function draw () {
  setup(width, height);

  queue()
    .defer(d3.json, 'USA.json')
    .defer(d3.csv, 'per_capita_personal_income.csv')
    .await(ready);


  function ready( error, us, data ) {

    incomes = transformFIPSData(data);
    // console.log(incomes);
    drawMap(us, incomes);
    drawLineGraph(incomes);
  }

  function dataByState(data, state) {
    var result = [];

    for (var i = 0; i < data.length; i++) {
      if (data[i].GeoName === state) {
        console.log(data[i].Years);

        Object.keys(data[i].Years).forEach(function(year) {

          // TODO: see if we can plot points without reconfiguring data into this format
          result.push({
            year : year,
            value : data[i].Years[year]
          });
        });
      }
    }

    return result;
  }

  // data is array of objects with Years key of objects
  function drawLineGraph(data) {
    //baked in state
    var HIStateData = dataByState(data, "Hawaii");
    var USAvgData = dataByState(data, "United States");

    console.log(USAvgData);

    var vis = d3.select('#line-graph');
    var width = 600;
    var height = 350;
    var margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 60
      };

    //TODO: set domains for xScale and yScale dynamically
    var xScale = d3.scale.linear().range([margins.left, width - margins.right]).domain([1929, 2013]);
    var yScale = d3.scale.linear().range([height - margins.top, margins.bottom]).domain([0,50000]);

    var formatXAxis = d3.format('.0f');

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(formatXAxis);
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    vis.append("svg:g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + (height - margins.bottom) + ")")
       .call(xAxis);

    vis.append("svg:g")
       .attr("class", "y axis")
       .attr("transform", "translate(" + (margins.left) + ",0)")
       .call(yAxis);

    vis.append("text")
      .attr("x", width/2)
      .attr("y", height + margins.bottom)
      .style("text-anchor", "middle")
      .text("Date");

    var lineGen = d3.svg.line()
      .x(function(d) {
        return xScale(d.year);
      })
      .y(function(d) {
        return yScale(d.value);
      })
      .interpolate("linear");

    vis.append("svg:path")
       .attr("d", lineGen(USAvgData))
       .attr("stroke", "#AAA797")
       .attr("stroke-width", 3)
       .attr("fill", "none");

    vis.append("svg:path")
       .attr("d", lineGen(HIStateData))
       .attr("stroke", "orange") //TODO: change color dynamically
       .attr("stroke-width", 3)
       .attr("fill", "none");

  }
  
  function setup (width, height) {
    projection = d3.geo.albersUsa()
      .scale(1000)
      .translate([width / 2, height / 2]);

    path = d3.geo.path()
      .projection(projection);

    svg = d3.select('#map').append('svg')
      .attr('width', width)
      .attr('height', height);

    g = svg.append('g');
  
  }

  function drawMap (us, incomes) {

    var maxVals = findMaxFIPSVals(incomes);
    console.log(maxVals);
    var minVals = findMinFIPSVals(incomes);
    var stateMaxes = [];
    var stateMins = [];

    var incomesByState = {};

    incomes.forEach(function (d, i) {
      // console.log(d);
      // console.log(d.GeoName, +d.Years[maxVals.maxYear]); // this will be changed to state
      incomesByState[d.GeoName] = +d.Years[maxVals.maxYear];
    });

    console.log(incomesByState);
    var states = topojson.feature(us, us.objects.units).features;

    g.selectAll(".states")
      .data(states)
      .enter().append("path")
      .attr("d", path)
      .style('stroke', '#FFF')
      .style('stroke-width', 3)
      .style('fill', function (d) {
        return color(incomesByState[d.properties.name]);
      });
  }

  function updateMap () {
  }
}


// This function work takes a FIPS dataset 
function transformFIPSData (data) {
  var yearKey = /^\d\d\d\d$/;
  return _.map(data, function (item) {
    return _.transform(item, function (result, n, key) {
      if (yearKey.test(key)) {
        var transformedVal = parseInt(n, 10);
        result.Years[key] = transformedVal ? transformedVal : -1;
      } else {
        result[key] = n;
      }
    }, {Years: {}});
  });  
}

function findMaxFIPSVals (data) {
  return _.reduce(data, function (result, item, key) {
    var keysArr = d3.keys(item.Years);
  
    if (keysArr.length > result.numOfYrs) {
      result.numOfYrs = keysArr.length;
      var maxKey = d3.max(keysArr);
      if (maxKey > result.maxYear) {
        result.maxYear = maxKey;  
      }
    }
    var stateMax = d3.max(d3.values(item.Years));
    if (stateMax > result.maxVal) {
      result.maxVal = stateMax;
    }
    return result;
  }, {numOfYrs: 0, maxYear: 0, maxVal: 0});
}

function findMinFIPSVals (data) {
  return _.reduce(data, function (result, item, key) {
    var keysArr = d3.keys(item.Years);
  
    if (keysArr.length > result.numOfYrs) {
      result.numOfYrs = keysArr.length;
      var minKey = d3.min(keysArr);
      if (minKey < result.minYear) {
        result.minYear = minKey;  
      }
    }
    var stateMin = d3.min(d3.values(item.Years));
    if (stateMin < result.minVal && stateMin != -1) {
      result.minVal = stateMin;
    }
    return result;
  }, {numOfYrs: 0, minYear: Infinity, minVal: Infinity});
}
