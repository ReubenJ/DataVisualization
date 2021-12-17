import * as d3 from "https://cdn.skypack.dev/d3@7";

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
// 
// Modified for Data Visualization IN4089 InfoViz project
// Added Node selection
// Linked to other visualizations
function ForceGraph({
  nodes, // an iterable of node objects (typically [{id}, …])
  links // an iterable of link objects (typically [{source, target}, …])
}, {
  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
  nodeImage = d => d.url,
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  nodeGroups, // an array of ordinal values representing the node groups
  nodeTitle, // given d in nodes, a title string
  nodeFill = "#aaa", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = "1", // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = "25", // node radius, in pixels
  expandedRadius = (4 * parseFloat(nodeRadius)).toString(),
  nodeStrength = "-30",
  linkSource = ({source}) => source, // given d in links, returns a node identifier string
  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
  linkStroke = "#999", // link stroke color
  linkStrokeOpacity = 0.4, // link stroke opacity
  linkStrokeWidth, // given d in links, returns a stroke width in pixels
  linkStrokeLinecap = "round", // link stroke linecap
  linkStrength,
  colors = d3.schemeTableau10, // an array of color strings, for the node groups
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  invalidation // when this promise resolves, stop the simulation
} = {}) {
  // Compute values.
  const N = d3.map(nodes, nodeId).map(intern);
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
  const I = d3.map(nodes, nodeImage);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({id: N[i], genres: G[i]}));
  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // Construct the forces.
  const forceNode = d3.forceManyBody().distanceMax("150");
  const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("center",  d3.forceCenter())
      .on("tick", ticked);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const contents = svg.append("g")
    .attr("id", "forceContents");

  const link = contents.append("g")
      .attr("stroke", linkStroke)
      .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", "0.25") //typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  svg.call(d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[-width/2, -height/2], [width/2, height/2]])
    .on("zoom", function(e) {
        console.log(e.transform);
        contents.attr("transform", e.transform);
      }
    )
  );

  const node = contents.append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("fill-opacity", "50%")
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
      .attr("id", "nodeGroup")
    .selectAll("circle")
    .data(nodes)
    .join("g")
      .attr("r", nodeRadius)
      .call(drag(simulation));

  var selected = d3.select(null);

  // Add circular clip path to mask image
  node.append("clipPath")
    .attr("id", function(d, i) {return `circularClip-${i}`;})
    .append("circle")
    .attr("r", nodeRadius);

  node.append("circle")
    .attr("r", nodeRadius);
  
  // Add image tag
  node.append("image")
    .attr("href", function(d, i) {return I[i]})
    .attr("height", "50")
    .attr("width", "50")
    .attr("style", "opacity: 0%;")
    // This contrains the image to the circle
    .attr("clip-path", function(d, i) {return `url(#circularClip-${i})`});

  node
    .on('mouseover', function(e, d) {
      let mousedOverSel = selected.filter(dSel => dSel.id === d.id)
      mousedOverSel.select("image")
        // .transition()
          .attr("style", "opacity: 100%");
      mousedOverSel.selectAll("circle")
        // .transition()
          .attr("fill-opacity", "100%");
    })
    .on("mouseout", function(e, d) {
      let mouseOutSel = selected.filter(dSel => dSel.id === d.id);
      mouseOutSel.select("image")
        .transition()
          .attr("style", "opacity: 50%");
      mouseOutSel.selectAll("circle")
        .transition()
          .attr("r", "10")
          .attr("fill-opacity", "50%");
    })
    .on("click", function(e, d) {
        // Clear old selection styles
        selected.select("image")
          .transition()
            .attr("style", "opacity: 0%;");
        selected.selectAll("circle")
          .transition()
            .attr("fill-opacity", "50%")
            .attr("fill", nodeFill)
            .attr("r", nodeRadius);
        selected.attr("selected", null);
        node.selectAll("circle")
          .attr("fill", nodeFill)
          .attr("fill-opacity", "50%")
          .attr("r", nodeRadius);
        d3.select("#genretable").selectAll("tr")
          .attr("style", "background-color: unset");

        
        // Clear selection for genre table as well
        selected.each(function(d) {
          console.log(G[d.id]);
          for (let g in G[d.id]) {
            let id = `#genreRow-${G[d.id][g].replace(" ", "-").replace("&", "")}`
            d3.select(id)
              .selectAll("td")
              .attr("style", "background-color: unset; color: #fff");
          };
          d3.select("#genretable").selectAll("tr").filter(d => d !== undefined)
            .sort((a, b) => d3.ascending(a.ranking, b.ranking));
        });

        // Update new selection styles
        d3.select(this).selectAll("circle")
          .transition()
            .attr("opacity", "100%")
            .attr("r", expandedRadius);

        d3.select(this).select("image")
          .transition()
          .attr("style", "opacity: 100%");

        d3.select(this)
          .attr("selected", true)
          .raise();

        selected = d3.select(this);
        
        // update genre table
        selected.each(function(d) {
          link
            .filter(dLink => dLink.target.id === d.id || dLink.source.id === d.id)
            .attr("stroke-width", "0.75")
            .attr("stroke", "#fff")
            .attr("stroke-opacity", "90%")
            .raise();
          d3.selectAll("[id^=genreRow-]")
            .attr("style", "opacity: 50%;");
          for (let g in G[d.id]) {
            let id = `#genreRow-${G[d.id][g].replace(" ", "-").replace("&", "")}`
            d3.select(id)
              .lower()
              .attr("style", "opacity: 100%;")
              .selectAll("td")
              .attr("style", "background-color: #fff; color: #000;");
          }
        })
        
        e.stopPropagation();
      }
    );

  svg
    .on('click', function() {
      selected
        .select("image")
        .transition()
          .attr("style", "opacity: 0%;");
      node
        .selectAll("circle")
        .transition()
          .attr("fill-opacity", "50%")
          .attr("fill", nodeFill)
          .attr("r", nodeRadius);

      // Clear selection for genre table as well
      d3.selectAll("[id^=genreRow]")
          .attr("style", "opacity: 100%;")
          .filter(d => d !== undefined)
          .sort((a, b) => d3.ascending(a.ranking, b.ranking))
          .selectAll("td")
            .attr("style", "background-color: none; color: #fff");

      link
        .attr("stroke-width", "0.25")
        .attr("stroke", "#aaa")
        .attr("stroke-opacity", "0.4")
        .sort();
      
      selected.attr("selected", null);

      selected = d3.select(null);
    }
  );

  // if (W) link.attr("stroke-width", ({index: i}) => W[i]);
  if (G) node.attr("fill", ({index: i}) => nodeFill); //color(G[i][0]));
  if (T) node.append("title").text(({index: i}) => T[i]);
  if (invalidation != null) invalidation.then(() => simulation.stop());

  function intern(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  function ticked() {
    let parsedRadius = parseFloat(expandedRadius) + 5;
    link
      .attr("x1", d => (Math.max(parsedRadius, Math.min(width - parsedRadius, d.source.x + (width / 2))) - (width / 2)).toString())
      .attr("y1", d => (Math.max(parsedRadius, Math.min(height - parsedRadius, d.source.y + (height / 2))) - (height / 2)).toString())
      .attr("x2", d => (Math.max(parsedRadius, Math.min(width - parsedRadius,  d.target.x + (width / 2))) - (width / 2)).toString())
      .attr("y2", d => (Math.max(parsedRadius, Math.min(height - parsedRadius, d.target.y + (height / 2))) - (height / 2)).toString());
    node
      .select("image")
      .attr("x", d => (Math.max(parsedRadius, Math.min(width - parsedRadius, d.x + (width / 2))) - 25 - (width / 2)).toString())
      .attr("y", d => (Math.max(parsedRadius, Math.min(height - parsedRadius, d.y + (height / 2))) - 25 - (height / 2)).toString());
    
    node
      .selectAll("circle")
      .attr("cx", d => (Math.max(parsedRadius, Math.min(width - parsedRadius, d.x + (width / 2))) - (width / 2)).toString())
      .attr("cy", d => (Math.max(parsedRadius, Math.min(height - parsedRadius, d.y + (height / 2))) - (height / 2)).toString());
    
  }

  function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return Object.assign(svg.node(), {scales: {color}});
};

function artists(currentPlaylist) {
  let res = currentPlaylist.songs
    // Retrieve data needed for artists
    .map(song => ({
      name: song.artists.name,
      group: song.genres,
      url: song.artists.image[0].url,
    }))
    // Remove duplicate artists
    .filter((item, index) => 
      currentPlaylist.songs
        .map(song => song.artists.name).indexOf(item.name) === index
    )
    .map((artist, i) => ({
      id: i,
      name: artist.name,
      group: artist.group,
      url: artist.url
    })); 
    return res;
}

function connections(artists) {
  let res = artists
    .map(artist => 
      artists
        .filter(otherArtist => artist !== otherArtist)
        .map(otherArtist => ({
          source: artist.id,
          target: otherArtist.id,
          // how many genres overlap
          strength: (new Set([...artist.group].filter(x => otherArtist.group.includes(x)))).size
        }))
        )
    .flat()
    .filter(connection => connection.strength > 0);
  return res;
}

export function buildForceGraph(currentPlaylist) {
  d3.select("#force").select("svg").remove();
  let artistsArray = artists(currentPlaylist);
  let connectionsArray = connections(artistsArray);
  var data = {
    nodes: artistsArray,
    links: connectionsArray
  };

  var chart = ForceGraph(data, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `Artist: ${d.name}\nGenres: ${d.group.join(", ")}`,
      linkStrokeWidth: l => 0.001 * Math.sqrt(l.value),
      nodeRadius: "6",
      width: window.innerWidth.toString(),
      height: (0.7 * window.innerHeight).toString()
  });

  d3.select("#force").node().appendChild(chart);
  // console.log(json[0]["songs"][0]["artists"]);
}

// console.log(artists());