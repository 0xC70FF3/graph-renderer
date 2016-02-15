var stylesheet = require("../../config/stylesheet")
var sankey     = require("./sankey")
var d3         = require('d3')

module.exports = {
    sankey : function(window, graph) {
        var width  = stylesheet.sizes.width  - stylesheet.sizes.margins.left - stylesheet.sizes.margins.right
        var height = stylesheet.sizes.height - stylesheet.sizes.margins.top  - stylesheet.sizes.margins.bottom
        var formatNumber = d3.format(",.0f")
        var format = function(d) { return formatNumber(d) + "%" }

        var doc = d3.select(window.document) //get d3 into the dom
        var vis = doc.select('body').html('')
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
                    t.mode = "out"
                }
            })
            x.targetLinks.forEach(function(s) {
                if (x.value > s.value) {
                    s.percent = s.value / x.value * 100
                    s.mode = "in"
                }
            })
        })

        // add in the links
        link = vis.append("g")
            .selectAll(".link")
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
        link_labels = vis.append("g")
            .append("text")
            .attr("font-family", stylesheet.font)
            .attr("font-size", "20px")
            .selectAll(".link")
            .data(graph.links)
            .enter()
            .append("textPath")
            .attr("alignment-baseline", "middle")
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("stroke", function(d) { return d.color = (typeof d.target.meta !== 'undefined' && d.target.meta.highlight)
                ? stylesheet.colors.highlight.background
                : stylesheet.colors.primary.background })
            .attr(":xlink:href", function(d) { return "#" + d.source.name + "_" + d.target.name })
            .attr("startOffset", function(d) { return d.mode == "in" ? "60%" : "25%" })
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

        return doc.select('body').html().replace(/textpath/g, "textPath")
    }
}