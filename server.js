var express = require('express'),
  ffmpeg = require('fluent-ffmpeg');
var torrentStream = require('torrent-stream');
var app = express();
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.send('index.html');
});
app.get('/video/:magnet', function (req, res, next) {
  var m = req.url.slice("/video/".length, req.url.length);
  var engine = torrentStream(m);
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
    console.log('Browser requested bytes from ' + start + ' to ' + end + ' of file ' + file);
    var date = new Date();
    /*res.writeHead(206, { // NOTE: a partial http response
      // 'Date':date.toUTCString(),
      //'Connection': 'close',
      // 'Cache-Control':'private',
      // 'Content-Type':'video/webm',

      ,
      // 'Server':'CustomStreamer/0.0.1',
      //'Transfer-Encoding': 'chunked'
    });
    */
    res.setHeader('Content-Length', end - start);
    res.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + file.length);
    res.setHeader('Accept-Ranges', 'bytes')
    res.contentType('ogv');
    var stream = file.createReadStream({
      start: start,
      end: end
    });
    ffmpeg.ffprobe(file.createReadStream(), function (err, metadata) {
      console.dir(err);
      console.dir(metadata);
    });
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
