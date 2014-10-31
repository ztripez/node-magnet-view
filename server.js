var express = require('express'),
  ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var torrentStream = require('torrent-stream');
var app = express();
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.send('index.html');
});
app.get('/video/:video', function (req, res, next) {
  var m = req.url.slice("/video/".length, req.url.length);
  //var engine = torrentStream("magnet:?xt=urn:btih:adcea78f34706e4b20e48d0622adef5a9f7cb96c&dn=Arrow+S03E04+720p+HDTV+X264-DIMENSION+%5Beztv%5D&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337");
  var engine = torrentStream(
    "magnet:?xt=urn:btih:978b8c7e3b8947eb926690ac9b15ef732084d004&dn=The+Walking+Dead+S05E03+720p+HDTV+x264-KILLERS+%5Beztv%5D&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337");
  engine.on('ready', function () {
    var file = engine.files[0];
    var start = 0;
    var end = 0;
    var range = req.header('Range');
    if (range != null) {
      start = parseInt(range.slice(range.indexOf('bytes=') + 6, range.indexOf('-')));
      end = parseInt(range.slice(range.indexOf('-') + 1, range.length));
    }
    if (isNaN(end) || end == 0) end = file.length - 1;
    if (start > end) return;
    var stream = file.createReadStream();
    var probesize = 10000000;
    var probeStream = file.createReadStream({
      start: 0,
      end: probesize
    });
    var probedest = fs.createWriteStream('probe.dat');
    probeStream.pipe(probedest);
    probeStream.on('end', function () {
      ffmpeg.ffprobe('probe.dat', function (err, metadata) {
        //console.dir(err);
        console.dir(metadata);
        var duration = metadata.format.duration; // * metadata.format.bit_rate;
        //start = start / metadata.format.bit_rate;
        console.log('Browser requested bytes from ' + start + ' to ' + end + ' of file ' + file);
        var date = new Date();
        res.setHeader('Content-Length', (end - start) - 1);
        res.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + end);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('X-Content-Duration', duration);
        res.setHeader('Content-Duration', duration);
        res.contentType('webm');
        var proc = ffmpeg(stream).format('webm').on('end', function () {
            console.log('file has been converted succesfully');
          }).on('error', function (err) {
            console.log('an error happened: ' + err.message);
          })
          // save to stream
          .pipe(res, {
            end: true
          });
      });
    });
  });
});
app.listen(4000);
/*var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var torrentStream = require('torrent-stream');
var engine = torrentStream("magnet:?xt=urn:btih:adcea78f34706e4b20e48d0622adef5a9f7cb96c&dn=Arrow+S03E04+720p+HDTV+X264-DIMENSION+%5Beztv%5D&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337");
engine.on('ready', function () {
  var file = engine.files[0];
  var probesize = 5000000;
  var probeStream = file.createReadStream({
    start: 0,
    end: probesize
  });
  var probedest = fs.createWriteStream('probe.dat');
  probeStream.pipe(probedest);
  probeStream.on('end', function () {
    ffmpeg.ffprobe('probe.dat', function (err, metadata) {
      //console.dir(metadata);
      console.log(metadata.format.duration);
    });
  });
});
*/
