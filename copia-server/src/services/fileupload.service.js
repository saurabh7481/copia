const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// _testing()

const encryptAES = (buffer, secretKey, iv) => {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex');
};

const decryptAES = (buffer, secretKey, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer);
  const decrpyted = Buffer.concat([data, decipher.final()]);
  return decrpyted;
}

const generateKeys = () => {
  if (fs.existsSync('private.pem') && fs.existsSync('public.pem')) return;

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: '',
    },
  });

  fs.writeFileSync('private.pem', privateKey);
  fs.writeFileSync('public.pem', publicKey);
};

const encryptRSA = (toEncrypt, pubkeyPath = 'public.pem') => {
  const absolutePath = path.resolve(pubkeyPath);
  const publicKey = fs.readFileSync(absolutePath, 'utf8');
  const buffer = Buffer.from(toEncrypt, 'utf8');
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString('base64');
}

const decryptRSA = (toDecrypt, privkeyPath = 'private.pem') => {
  const absolutePath = path.resolve(privkeyPath);
  const privateKey = fs.readFileSync(absolutePath, 'utf8');
  const buffer = Buffer.from(toDecrypt, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey.toString(),
      passphrase: '',
    },
    buffer
  );
  return decrypted.toString('utf8');
}

const uploadFileEncrypted = async (ipfs, file, ipfspath) => {
  try {
    const buff = fs.readFileSync(file);
    const key = crypto.randomBytes(16).toString('hex');
    const iv = crypto.randomBytes(8).toString('hex');
    const ekey = encryptRSA(key);
    const ebuff = encryptAES(buff, key, iv);

    const content = Buffer.concat([Buffer.from(ekey, 'utf8'), Buffer.from(iv, 'utf8'), Buffer.from(ebuff, 'utf8')]);

    await ipfs.files.write(ipfspath, content, { create: true, parents: true });

    console.log('ENCRYPTION --------');
    console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length);
    console.log('contents:', buff.length, 'encrypted:', ebuff.length);
    console.log(' ');
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const toArray = async (asyncIterator) => {
  const arr = [];
  for await (const i of asyncIterator) {
    arr.push(i);
  }
  return arr;
};

const downloadFileEncrypted = async (ipfs, ipfspath) => {
  try {
    const file_data = await ipfs.files.read(ipfspath);

    let edata = [];
    for await (const chunk of file_data) edata.push(chunk);
    edata = Buffer.concat(edata);

    const key = decryptRSA(edata.slice(0, 684).toString('utf8'));
    const iv = edata.slice(684, 700).toString('utf8');
    const econtent = edata.slice(700).toString('utf8');
    const ebuf = Buffer.from(econtent, 'hex');
    const content = decryptAES(ebuf, key, iv);

    console.log(' ');
    console.log('DECRYPTION --------');
    console.log('key:', key, 'iv:', iv);
    console.log('contents:', content.length, 'encrypted:', econtent.length);
    console.log('downloaded:', edata.length);

    return content;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getUploadedFiles = async (ipfs, ipfspath = '/encrypted/') => {
  let files = [];
  const arr = await toArray(ipfs.files.ls(ipfspath));
  for (const file of arr) {
    if (file.type === 'directory') {
      const inner = await getUploadedFiles(`${ipfspath + file.name}/`);
      files = files.concat(inner);
    } else {
      files.push({
        path: ipfspath + file.name,
        size: file.size,
        cid: file.cid.toString(),
      });
    }
  }
  return files;
};

async function _testing() {
  const file = 'package.json';
  const ipfspath = `/encrypted/data/${file}`;

  await uploadFileEncrypted(file, ipfspath);

  const dl = await downloadFileEncrypted(ipfspath);

  const buff = Buffer.from(dl, 'hex');

  const outfile = ipfspath.replace(/\//g, '_');
  console.log('writing:', outfile);
  fs.writeFile(outfile, buff, function (err) {
    if (err) throw err;
  });
}

module.exports = {
  uploadFileEncrypted,
  downloadFileEncrypted,
  getUploadedFiles,
  generateKeys,
};
