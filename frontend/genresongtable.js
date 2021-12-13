import {drawRadarChart} from "./index.js";

// Initializes the table
export function initTable(tableId, columnNames){
    var table = d3.select(tableId).append('table');
    table.append('tbody');
    table.select('tbody').selectAll('tr');

    table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(columnNames).enter()
        .append('th')
        .text((d) => { return d; })

}


// Update table
export function updateTable(currentlySelectedSongs, data){
    let songdata = [];
    let sortAscending = true;

    // Prepare song data
    for (const song in data.songs) 
        songdata.push({
            "track": data.songs[song].song_name, 
            "artist": data.songs[song].artists
        });
    
    // Initialize d3 stuff
    var table = d3.select('#songtable').select('table');
    var tbody = table.select('tbody');
    var rows = tbody.selectAll('tr')
        .data(songdata);

    // Make headers clickable for sorting
    var headers = table.select('thead')
        .selectAll('th')
        .on('click', (d) => {
            headers.attr('class', 'header');
            if (sortAscending) {
                rows.sort((a, b) => { return b[d] < a[d]; });
                sortAscending = false;
                //this.className = 'aes';
            }
            else {
                rows.sort((a, b) => { return b[d] > a[d]; });
                sortAscending = true;
                //this.className = 'des';
                
            }
        });
    
    // Prepare rows and fill with data
    var rowsEnter = rows.enter()
        .append('tr')
        .attr('class', 'clickable-row')
        .attr('id', (d) => {
            return 'row' + songdata.indexOf(d);
        });

    rowsEnter.append('td')
        .attr("class", "trackColumn")
        .text(function(d) {
            return d.id;
        });
    
    rowsEnter.append('td')
        .attr("class", "artistColumn")
        .text(function(d) {
            return d.id;
        });
    
    // Make rows clickable for usage in radarchart
    let allsongs = data
    rowsEnter.on('click', (d) => {
            // Handles connection with the radar chart
            for (var song in allsongs.songs) {
                if (allsongs.songs[song].song_name == d.track) {
                    currentlySelectedSongs.shift();
                    currentlySelectedSongs.push(allsongs.songs[song]);
                    drawRadarChart();
                    return;
                }
            }
        });

    // Put data in respective position
    d3.selectAll(".trackColumn").data(songdata).text(function(d) {
        return d.track;
    });

    d3.selectAll(".artistColumn").data(songdata).text(function(d) {
        return d.artist;
    });

    // Remove any old data
    rows.exit().remove();
}