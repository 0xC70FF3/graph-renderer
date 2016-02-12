var d3 = require('d3')
var jsdom = require('jsdom')
var sk = require('./sankey/sankey')
var child_proc = require('child_process')
var url = require('url')

// server routes ===========================================================
module.exports = function(app) {

	app.post('/api/sankey', function(req, res) {
		try {

			res.writeHead(200, {'Content-Type': 'image/png'})
			var convert = child_proc.spawn("rsvg-convert", [])
			var values = (url.parse(req.url, true).query['values'] || ".5,.5").split(",").map(function(v){ return parseFloat(v) })

			convert.stdout.on('data', function (data) { res.write(data) })
			convert.on('exit', function(code) { res.end() })

			jsdom.env({
				html:'',
				features:{ QuerySelector:true }, //you need query selector for D3 to work
				done: function (errors, window) {
					graph = req.body

					units = "Users";
					color = {
						grey: "#525252",
						blue: "#4ad4fc",
						rose: "#fe3896",
						opacity: .3
					}
					nodes = {
					  width: 15,
					  padding: 60,
					}
					margin = {
					  top: 10,
					  right: 10,
					  bottom: 10,
					  left: 10,
					}
					width = 600 - margin.left - margin.right
					height = 300 - margin.top - margin.bottom

					formatNumber = d3.format(",.0f") // zero decimal places
					format = function(d) { return formatNumber(d) + " " + units }

					var doc = d3.select(window.document) //get d3 into the dom

					vis = doc.select('body').html('')
						.append("svg")
						.attr('xmlns', 'http://www.w3.org/2000/svg')
						.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
						.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					// Set the sankey diagram properties
					sankey = sk.sankey()
						.nodeWidth(nodes["width"])
						.nodePadding(nodes["padding"])
						.size([width, height]);

					path = sankey.link();

					nodeMap = {};
					graph.nodes.forEach(function(x) {
						nodeMap[x.name] = x;
					})
					graph.links = graph.links.map(function(x) {
						return {
							source: nodeMap[x.source],
							target: nodeMap[x.target],
							value: x.value
						}
					})

					sankey
						.nodes(graph.nodes)
						.links(graph.links)
						.layout(32);

					// add in the links
					link = vis.append("g").selectAll(".link")
						.data(graph.links)
						.enter()
						.append("path")
						.style("fill", "none")
						.style("stroke", function(d) {return d.color = (typeof d.target.meta !== 'undefined' && d.target.meta.highlight) ? color.rose : color.blue })
						.style("stroke-opacity", color.opacity)
						.attr("d", path)
						.style("stroke-width", function(d) { return Math.max(1, d.dy) })
						.sort(function(a, b) { return b.dy - a.dy })

					// add in the nodes
					node = vis.append("g").selectAll(".node")
						.data(graph.nodes)
						.enter().append("g")
						.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"  })

					// add the rectangles for the nodes
					node.append("rect")
						.attr("height", function(d) { return d.dy })
						.attr("width", sankey.nodeWidth())
						.style("fill", function(d) { return d.color = (typeof d.meta !== 'undefined' && d.meta.highlight) ? color.rose : color.blue })

					// add in the title for the nodes
					node.append("text")
					 	.style("fill", function (d) { return color.grey; })
					 	.attr("font-family", "Museo Sans Rounded")
					 	//.attr("font-weight", "bold")
					 	.attr("font-size", "16px")
						.attr("x", -6)
						.attr("y", function(d) { return d.dy / 2 })
						.attr("dy", ".35em")
						.attr("text-anchor", "end")
						.attr("transform", null)
						.text(function(d) { return d.name })
						.filter(function(d) { return d.x < width / 2 })
						.attr("x", 6 + sankey.nodeWidth())
						.attr("text-anchor", "start");

					node.append("text")
						.style("fill", function (d) { return d.color = (typeof d.meta !== 'undefined' && d.meta.highlight) ? "#fff" : color.grey })
					 	.attr("font-family", "Museo Sans Rounded")
						.attr("x", function(d) { return -d.dy / 2 })
						.attr("y", 11)
						//.attr("y", function(d) { return d.dy / 2 })
						.attr("text-anchor", "middle")
						//.attr("transform", null)
						.attr("transform", "rotate(-90)")
						.text(function(d) { return d.value })
						//.filter(function(d) { return d.x < width / 2 })
						//.attr("text-anchor", "start");


					svgsrc = doc.select('body').html()
					convert.stdin.write(svgsrc);
					convert.stdin.end();
				}
			})

		} catch(err) {
			console.log(err)
			res.writeHead(400, "Bad Request", {'content-type' : 'text/plain'});
  			res.end("Bad Request");
		}
	})
}