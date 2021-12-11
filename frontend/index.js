import { createTable } from "./genresongtable.js";
import { createRadarChart } from "./radar-chart.js";

// Test data (for radar chart)
var testdata = [
    [//iPhone
    {axis:"Battery Life",value:0.22},
    {axis:"Brand",value:0.28},
    {axis:"Contract Cost",value:0.29},
    {axis:"Design And Quality",value:0.17},
    {axis:"Have Internet Connectivity",value:0.22},
    {axis:"Large Screen",value:0.02},
    {axis:"Price Of Device",value:0.21},
    {axis:"To Be A Smartphone",value:0.50}			
    ],[//Samsung
    {axis:"Battery Life",value:0.27},
    {axis:"Brand",value:0.16},
    {axis:"Contract Cost",value:0.35},
    {axis:"Design And Quality",value:0.13},
    {axis:"Have Internet Connectivity",value:0.20},
    {axis:"Large Screen",value:0.13},
    {axis:"Price Of Device",value:0.35},
    {axis:"To Be A Smartphone",value:0.38}
    ],[//Nokia Smartphone
    {axis:"Battery Life",value:0.26},
    {axis:"Brand",value:0.10},
    {axis:"Contract Cost",value:0.30},
    {axis:"Design And Quality",value:0.14},
    {axis:"Have Internet Connectivity",value:0.22},
    {axis:"Large Screen",value:0.04},
    {axis:"Price Of Device",value:0.41},
    {axis:"To Be A Smartphone",value:0.30}
    ]
  ];

// Common data that is used by the graphs
var currentPlaylist;

var currentSongs = [];
var currentSongs2 = [];

var currentlySelectedSongs;

function setData1() {
    currentlySelectedSongs = currentSongs;
    var songsStats = extractStatistics(currentlySelectedSongs);
    createRadarChart(songsStats);
}

function setData2() {
    currentlySelectedSongs = currentSongs2;
    var songsStats = extractStatistics(currentlySelectedSongs);
    createRadarChart(songsStats);
}

function extractStatistics(songs) {
    var stats = [];

    // Data format must be:
    // {
    //     axis: "statname", value: "value"
    // }
    for (var song in songs) {
        stats.push([
            {axis: "energy", value: songs[song].statistics.energy },
            {axis: "valence", value: songs[song].statistics.valence },
            {axis: "liveness", value: songs[song].statistics.liveness },
            {axis: "danceability", value: songs[song].statistics.danceability },
            {axis: "speechiness", value: songs[song].statistics.speechiness }
        ]);
    }

    return stats;
}

function main() {
    // Structure json data 
    $.getJSON("../backend/playlists_data.json", (json) => {
        var playlistOne = json[0];
        currentPlaylist = playlistOne;

        // Some testing stuff
        currentSongs.push(currentPlaylist.songs[0]);
        currentSongs.push(currentPlaylist.songs[1]);
        
        currentSongs2.push(currentPlaylist.songs[2]);
        currentSongs2.push(currentPlaylist.songs[3]);

        document.getElementById('b1').onclick = setData1;
        document.getElementById('b2').onclick = setData2;
        
        currentlySelectedSongs = currentSongs;

        // Draw the table (NOT YET IMPLEMENTED)
        createTable(playlistOne); 

        // Draw the radar chart based on selected items 
        var songsStats = extractStatistics(currentlySelectedSongs);
        createRadarChart(songsStats);
    });
}

main();




