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
    drawMap(us, incomes);
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
      .style('stroke-width', 1)
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
