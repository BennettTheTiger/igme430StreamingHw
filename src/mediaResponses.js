const fs = require('fs');
const path = require('path');


const getStream = (request, response) => {
  // console.log(request.url);
  const requestData = request.url.split('.');// index 0 is the file 1 is the file type
  // console.log(requestData[0],requestData[1]);
  // load in the file
  const file = path.resolve(__dirname, `../client${request.url}`);// make a path to the file requested
  fs.stat(file, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);// not found
      }
      return response.end(err);
    }

    let { range } = request.headers;

    if (!range) {
      range = 'bytes=o-';// start at the beggining
    }

    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stat.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    const chunksize = (end - start) + 1;
    // handle mp4 files
    if (requestData[1] === 'mp4') {
      response.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
    }
    // handle mp3 requests
    else if (requestData[1] === 'mp3') {
      response.writeHead(206,
        {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        });
    }
    // throw an internal server error 500 or 501
    else {
      response.writeHead(500);
    }

    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};


module.exports.getStream = getStream;
