const ipfsClient = require('ipfs-http-client');

const ipfsEndPoint = 'http://localhost:5001';
const ipfs = ipfsClient.create(ipfsEndPoint);

const fs = require('fs');
const path = require('path');

const { uploadFileEncrypted, downloadFileEncrypted, generateKeys } = require('../services/fileupload.service');

const uploadFile = async (req, res, next) => {
  try {
    generateKeys();
    const file = path.join(__dirname, '..', 'public', 'files', req.file.filename);
    const ipfspath = `/encrypted/data/${req.file.filename}`;

    await uploadFileEncrypted(ipfs, file, ipfspath);

    const dl = await downloadFileEncrypted(ipfs, ipfspath);

    const buff = Buffer.from(dl, 'hex');

    const outfile = ipfspath.replace(/\//g, '_');
    console.log('writing:', outfile);
    fs.writeFile(outfile, buff, function (err) {
      if (err) throw err;
    });
    // console.log(await getUploadedFiles());
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  uploadFile,
};
