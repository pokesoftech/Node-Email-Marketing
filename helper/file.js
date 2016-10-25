/**
 * Created by titu on 10/17/16.
 */

const mkdirp = require('mkdirp');
const path = require('path');
const config = require('../config');
const promise = require('bluebird');
const fs = promise.promisifyAll(require('fs'));
const _ = require('lodash');
const zipHelper = promise.promisifyAll(require('./zip'));

let ensureDirectoryExists = (directory) => {
    return new promise(function (resolve, reject) {
        mkdirp(directory, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });

    });
};

let prepareFiles = (directory) => {
    let allowedZipeTypes = config.settings.allowedZipeTypes;
    let allowedFileTypes = config.settings.allowedFileTypes;
    let allowedExtensions = _.union(allowedFileTypes, allowedZipeTypes);

    return ensureDirectoryExists(directory)
        .then(() => getFiles(directory, allowedExtensions))
        .then((files) => {
            let zippedFiles = files.filter((fileName) => _.includes(allowedZipeTypes, _.trimStart(path.extname(fileName), '.')));
            if (!files.length || !zippedFiles.length) {
                return files;
            }
            if (zippedFiles.length) {
                return extractZippedFiles(directory, zippedFiles)
                    .then(() => getFiles(directory, allowedFileTypes));
            }
            else {
                return files;
            }
        })
        .catch((e) => console.log(e));
};

let extractZippedFiles = (directory, zippedFiles) => {
    return promise.map(zippedFiles, function (zipFileName) {
        return zipHelper.unzip(directory, zipFileName);
    });
};

let getFiles = (directory, filterType) => {
    return fs.readdirAsync(directory)
        .filter((fileName) => {
            return fs.statAsync(path.join(directory, fileName))
                .then((stat) => stat.isFile() && _.includes(filterType, _.trimStart(path.extname(fileName), '.')));
        })
};

module.exports = {
    ensureDirectoryExists: ensureDirectoryExists,
    prepareFiles: prepareFiles
};
