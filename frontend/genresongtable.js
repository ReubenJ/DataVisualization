// If you read this then you can remove this I was just trying stuff out

// function maketable(data) {
//     let sortAscending = true;

//     let table = d3.select('songtable').append('table');
//     var titles = d3.keys(headers);
//     var headers = table.append('thead').append('tr')
//                        .selectAll('th')
//                        .data(titles).enter()
//                        .append('th')
//                        .text((d) => { return d; })
//                        .on('click', (d) => {
//                            headers.attr('class', 'header');
//                            if (sortAscending) {
//                                rows.sort((a, b) => { return b[d] < a[d]; });
//                                sortAscending = false;
//                                this.className = 'aes';
//                            }
//                            else {
//                                rows.sort((a, b) => { return b[d] > a[d]; });
//                                sortAscending = true;
//                                this.className = 'des';
//                            }
//                        });
    
//     var rows = table.append('tbody').selectAll('tr')
//                     .data(data).enter()
//                     .append('tr');
    
//     rows.selectAll('td')
//         .data((d) => {
//             return titles.map((k) => {
//                 return {'value': d[k], 'name': k };
//             });
//         })
//         .enter()
//         .append('td')
//         .attr('data-th', (d) => { return d.name; })
//         .text((d) => { return d.value; });
// }


// export function createTable(data) {
//     // Incoming data as JSON 

//     /*
//     Data must be in CSV like format:
//     row0: header1, header2, header3, ...                   } headers
//     row1: data.item1, data.item2, dataitem3, ...           } 1 data item
//     row2: ...
//     */

//     let headers = ["track-name", "artist"];
//     let songdata = [];
    
//     for (const song in data.songs) 
//         songdata.push([data.songs[song].song_name, data.songs[song].artists]);
    
//     console.log(headers);
//     console.log(songdata);
//     //console.log(data);

//     maketable(data.songs);
// }