var stylesheet = require("../config/stylesheet")
var sankey     = require("./lib/sankey")
var svg2png    = require("svg2png")
var jsdom      = require("jsdom")
var d3         = require("d3")

// server routes ===========================================================
module.exports = function(app) {
    app.get('/api/ping', function(req, res) {
        res.setHeader('Content-Type', 'text/plain')
        res.send("pong")
    })

	app.post('/api/sankey', function(req, res) {
		jsdom.env({
			html:'',
			features:{ QuerySelector:true }, //you need query selector for D3 to work
			done: function (err, window) {
				try {
					if (err) {
						throw err
					}
					graph = req.body
					if (!graph || !graph.nodes) {
						throw {status: 400, message: "Bad Request"}
					}

					width  = stylesheet.sizes.width  - stylesheet.sizes.margins.left - stylesheet.sizes.margins.right
					height = stylesheet.sizes.height - stylesheet.sizes.margins.top  - stylesheet.sizes.margins.bottom
					var formatNumber = d3.format(",.0f"), // zero decimal places
						format = function(d) {
						  return formatNumber(d) + "%";
						};

					var doc = d3.select(window.document) //get d3 into the dom

					vis = doc.select('body').html('')
						.append("svg")
						.attr('xmlns', 'http://www.w3.org/2000/svg')
						.attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
						.attr("width", stylesheet.sizes.width + stylesheet.sizes.margins.left + stylesheet.sizes.margins.right)
						.attr("height", stylesheet.sizes.height + stylesheet.sizes.margins.top + stylesheet.sizes.margins.bottom)
						.append("g").attr("transform", "translate(" + stylesheet.sizes.margins.left + "," + stylesheet.sizes.margins.top + ")")

					// Set the sankey diagram properties
					diagram = sankey.sankey()
						.nodeWidth(stylesheet.sizes.nodes.width)
						.nodePadding(stylesheet.sizes.nodes.padding)
						.size([width, height])

					path = diagram.link()

					nodeMap = {}
					graph.nodes.forEach(function(x) { nodeMap[x.name] = x })
					graph.links = graph.links.map(function(x) {
						return {
							source: nodeMap[x.source],
							target: nodeMap[x.target],
							value: x.value
						}
					})

					diagram
						.nodes(graph.nodes)
						.links(graph.links)
						.layout(32)

					// computing link ratios
					graph.nodes.forEach(function(x) {
						x.sourceLinks.forEach(function(t) {
							if (x.value > t.value) {
								t.percent = t.value / x.value * 100
								t.dir = "out"
							}
						})
						x.targetLinks.forEach(function(s) {
							if (x.value > s.value) {
								s.percent = s.value / x.value * 100
								s.dir = "in"
							}
						})
					})

					g = vis.append("g")
					// add in the links
					link = g.selectAll(".link")
						.data(graph.links)
						.enter()
						.append("path")
						.style("fill", "none")
						.style("stroke", function(d) { return d.color = (typeof d.target.meta !== 'undefined' && d.target.meta.highlight)
							? stylesheet.colors.highlight.background
							: stylesheet.colors.primary.background })
						.style("stroke-opacity", function(d) { return d.opacity = (typeof d.target.meta !== 'undefined' && d.target.meta.highlight)
							? stylesheet.colors.highlight.gamma
							: stylesheet.colors.primary.gamma })
						.attr("d", path)
						.attr("id", function(d) { return d.source.name + "_" + d.target.name})
						.style("stroke-width", function(d) { return Math.max(1, d.dy) })
						.sort(function(a, b) { return b.dy - a.dy })

					// add in links labels
					link_labels = g.append("text")
						.attr("font-family", stylesheet.font)
						.attr("font-size", "18px")
						.selectAll(".link")
						.data(graph.links)
						.enter()
						.append("textPath")
						.attr("alignment-baseline", "middle")
						.style("fill", "none")
						.style("stroke-width", "2px")
						.style("stroke", function(d) { return d.color = (typeof d.target.meta !== 'undefined' && d.target.meta.highlight)
							? stylesheet.colors.highlight.background
							: stylesheet.colors.primary.background })
						.attr(":xlink:href", function(d) { return "#" + d.source.name + "_" + d.target.name })
						.attr("startOffset", function(d) { return d.dir == "in" ? "70%" : "18%" })
						.text(function(d) { return (typeof d.percent !== "undefined") ? format(d.percent) : "" })

					// add in the nodes
					node = vis.append("g")
						.selectAll(".node")
						.data(graph.nodes)
						.enter().append("g")
						.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })

					// add the rectangles for the nodes
					node.append("rect")
						.attr("height", function(d) { return d.dy })
						.attr("width", diagram.nodeWidth())
						.style("fill", function(d) { return d.color = (typeof d.meta !== 'undefined' && d.meta.highlight)
							? stylesheet.colors.highlight.background
							: stylesheet.colors.primary.background })

					// add in the title for the nodes
					node.append("text")
						.style("fill", function (d) { return stylesheet.colors.primary.text })
						.attr("font-family", stylesheet.font)
						.attr("font-size", "16px")
						.attr("x", -6)
						.attr("y", function(d) { return d.dy / 2 })
						.attr("dy", ".35em")
						.attr("text-anchor", "end")
						.attr("transform", null)
						.text(function(d) { return d.name })
						.filter(function(d) { return d.x < width / 2 })
						.attr("x", 6 + diagram.nodeWidth())
						.attr("text-anchor", "start")

					// add in the values for the nodes
					node.append("text")
						.style("fill", function (d) { return d.color = (typeof d.meta !== 'undefined' && d.meta.highlight)
							? stylesheet.colors.highlight.text
							: stylesheet.colors.primary.text })
						.attr("font-family", stylesheet.font)
						.attr("font-size", "12px")
						.attr("font-weight", "bold")
						.attr("x", function(d) { return -d.dy / 2 })
						.attr("y", 12)
						.attr("text-anchor", "middle")
						.attr("transform", "rotate(-90)")
						.text(function(d) { return d.value })

					outputBuffer = svg2png.sync(new Buffer(doc.select('body').html().split("textpath").join("textPath")))
					res.setHeader('Content-Type', 'image/png')
					res.send(outputBuffer)
				} catch(err) {
					console.log(err)
					res.status(typeof err.status !== 'undefined' ? err.status : 500).end()
				}
			}
		})
	})
}