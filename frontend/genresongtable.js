import {drawRadarChart} from "./index.js";

// Initializes the table
export function initTable(tableId, columnNames) {
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

export function getTopGenresRanking(data){
    let genreFrequency = {};
    console.log("genreRankings");
    for (const song in data.songs){
        for (const genre in data.songs[song].genres) {
            var currentGenre = data.songs[song].genres[genre];
            if (genreFrequency.hasOwnProperty(currentGenre)) {
                genreFrequency[currentGenre] += 1;
            } else {
                genreFrequency[currentGenre] = 1;
            }
        }
    }

    var result = Object.keys(genreFrequency).sort(function(a, b) {
        return genreFrequency - genreFrequency[a];
      })
    let genreRanking = [];
    for (const genre in result){
        let rank = parseInt(genre) + 1
        genreRanking.push({
            "genre": result[genre], 
            "ranking": rank
        });
    }
    return genreRanking;
}


export function topGenreTable(genredata) {
    // Initialize D3 stuff
    let columns = ["ranking", "genre"];
    let table = d3.select('#genretable').select('table');
    let tbody = table.select('tbody');
    var rows = tbody.selectAll('tr')
		  .data(genredata)
		  .enter()
		  .append('tr');
    
    // Remove any old data
    tbody.selectAll('tr').data(genredata).exit().remove();

    // Put data in respective position    
    rows.append('td')
        .attr("class", "rankingColumn")
        .text(function(d) {
            return d.id;
        });
    
    rows.append('td')
        .attr("class", "genreColumn")
        .text(function(d) {
            return d.id;
        });
    
    d3.selectAll(".rankingColumn").data(genredata).text(function(d) {
        return d.ranking;
    });

    d3.selectAll(".genreColumn").data(genredata).text(function(d) {
        return d.genre;
    });
}

// Update table
export function updateSongTable(currentlySelectedSongs, data) {
    let songdata = [];
    let sortAscending = true;

    // Prepare song data
    for (const song in data.songs) 
        songdata.push({
            "track": data.songs[song].song_name, 
            "artist": data.songs[song].artists
        });
    
    // Initialize d3 stuff
    let table = d3.select('#songtable').select('table');
    let tbody = table.select('tbody');
    let rows = tbody.selectAll('tr')
        .data(songdata);
    
    // Remove any old data
    rows.exit().remove();
    
    // Make headers clickable for sorting
    let headers = table.select('thead')
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
    let rowsEnter = rows.enter()
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
    rows.on('click', (d) => {
        // Handles connection with the radar chart
        for (let song in data.songs) {
            if (data.songs[song].song_name == d.track) {
                currentlySelectedSongs.shift();
                currentlySelectedSongs.push(data.songs[song]);
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
}