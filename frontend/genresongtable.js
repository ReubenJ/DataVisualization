import * as d3 from "https://cdn.skypack.dev/d3@7";
import {drawRadarChart} from "./index.js";

// Some data for updating the radarchart based on currently selected songs
let pushBack = false;

// Initializes the table
export function initTable(tableId, columnNames) {
    var table = d3.select(tableId).append("table");
    table.append("tbody");
    table.select("tbody").selectAll("tr");

    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(columnNames).enter()
        .append("th")
        .text((d) => { return d; })
}

export function getTopGenresRanking(data){
    let genreFrequency = {};
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
    let columns = ["Ranking", "Genre"];
    let table = d3.select("#genretable").select("table");
    let tbody = table.select("tbody");
    let rows = tbody.selectAll("tr")
        .data(genredata.filter(g => g.ranking !== undefined), d => `${d.ranking}${d.genre}`);

    // Remove any old data
    tbody.selectAll("tr")
        .data(genredata.filter(g => g.ranking !== undefined), d => `${d.ranking}${d.genre}`)
        .exit()
        .remove();

    // Put data in respective position   
    let rowsEnter = rows.enter()
        .append("tr")
        .attr("id", d => `genreRow-${d.genre.replace(" ", "-").replace("&", "")}`);


    rowsEnter.append("td")
        .attr("class", "rankingColumn")
        .text(d => d.ranking)
        .attr("rank", d => d.rank);
    
    rowsEnter.append("td")
        .attr("class", "genreColumn")
        .text(d => d.genre)
        .attr("id", d => d.genre);
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
    let table = d3.select("#songtable").select("table");
    let tbody = table.select("tbody");
    let rows = tbody.selectAll("tr")
        .data(songdata);
    
    // Remove any old data
    rows.exit().remove();
    
    // Make headers clickable for sorting
    let headers = table.select("thead")
        .selectAll("th")
        .on("click", (d) => {
            headers.attr("class", "header");
            if (sortAscending) {
                rows.sort((a, b) => { return b[d] < a[d]; });
                sortAscending = false;
            }
            else {
                rows.sort((a, b) => { return b[d] > a[d]; });
                sortAscending = true;          
            }
        });
    
    // Prepare rows and fill with data
    let rowsEnter = rows.enter()
        .append("tr")
        .attr("class", "clickable-row")
        .attr("id", (d) => {
            return "row" + songdata.indexOf(d);
        });

    rowsEnter.append("td")
        .attr("class", "trackColumn")
        .text(function(d) {
            return d.id;
        });
    
    rowsEnter.append("td")
        .attr("class", "artistColumn")
        .text(function(d) {
            return d.id;
        });
    
    // Make rows clickable for usage in radarchart
    rowsEnter.on("click", (d) => {
        let clickedSong = d.originalTarget.__data__.track;
        // Handles connection with the radar chart
        for (let song in data.songs) {
            if (data.songs[song].song_name == clickedSong) {
                if (pushBack) {
                    // arr[0] = new song
                    currentlySelectedSongs[0] = data.songs[song];
                    pushBack = false;
                }
                else {
                    // arr[1] = new song
                    currentlySelectedSongs[1] = data.songs[song];
                    pushBack = true;
                }
                // Update radar chart
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
        return d.artist.name;
    });
}