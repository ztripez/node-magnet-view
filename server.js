var express = require('express'),
  ffmpeg = require('fluent-ffmpeg');
var torrentStream = require('torrent-stream');
var app = express();
app.use(express.static(__dirname + '/flowplayer'));
app.get('/', function (req, res) {
  res.send('index.html');
});
app.get('/video/:magnet', function (req, res, next) {
  var m = req.url.slice("/video/".length, req.url.length);
  var engine = torrentStream(m);
  engine.on('ready', function () {
    var file = engine.files[0];
    var stream = file.createReadStream();
    //console.log(stream);
    res.contentType('ogv');
    res.set({
      'Content-Length': file.length
    });
    //res.header('Content-Disposition: attachment; filename="logo.ogg"');
    var proc = ffmpeg(stream).format('ogg').on('end', function () {
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
app.listen(4000);
