var
    request = require('request'),
    JSZip = require("jszip"),
    Q = require("q"),
    iconv = require('iconv-lite'),
    _ = require("underscore"),
    cheerio = require('cheerio');

/**
 * Scrape Zip data from Modulotech
 * @param yearmonth
 * @param username
 * @param password
 * @param requestForFake Override the request module; for use in unit tests
 * @returns {Promise} Empty promise
 * @todo return promise for zip instead
 */
module.exports = function scrapeAsync(yearmonth, username, password, requestForFake) {
    var request = requestForFake ? requestForFake : require("request");
    var zipUrl = "https://cmisrvm1.epfl.ch/cmi/v1.5/copernic_2/";
    var argsForEveryPost = {
        url: zipUrl,
        headers: {
            Authorization: "Basic " + new Buffer(username + ":" + password).toString("base64"),
            'User-Agent': 'Super Agent/0.0.1',
            // 'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Length': Buffer.byteLength(post_data)
        },
        encoding: null,
    };
    return Q.nfcall(request.post, _.extend({}, argsForEveryPost, {
        form: {
            yearmonth: yearmonth,
            displaylabbut: 1
        }
    })).then(function (results) {
        var response = results[0];  // request.post callback takes more than one argument in the success case

        var $ = cheerio.load(response.body);
        var labos = [];

        $('#Labo option').filter(function () {
            var data = $(this);
            labos.push(data.text());
        });

        return labos;
    }).then(function (labNames) {
        return Q.nfcall(request.post, _.extend({}, argsForEveryPost, {
            form: {
                yearmonth: yearmonth,
                "Labo[]": labNames,
                loadcsvbut: 1
            }
        }));
    }).then(function (results) {
        console.log("request done");
        var response = results[0];
        if (response.headers["content-type"] != "application/zip") {
            throw new Error("Bad content-type: " + response.headers["content-type"]);
        }
        return response.body;
    }).then(function (zipData) {
        return new JSZip.loadAsync(zipData);
    }).then(function (zip) {
        // TODO: return zip to caller here; caller should call readBilling() in a .then()
        var promises = [];
        zip.forEach(function (path, file) {
            promises.push(file.async("binarystring").then(function (csvContentsBinary) {
                var csvContents = iconv.decode(csvContentsBinary, "iso-8859-1");
                return "file " + path + " is " + csvContents.length + " bytes, " +
                    csvContents.split(/\r\n|\r|\n/).length +
                    " lines long\n";
                // TODO: rather, return parsed contents as a promise
            }));
        });
        return Q.all(promises);
    }).then(function (descriptions) {
        console.log(descriptions.join(""));
        // TODO: return the info as final value of the promise chain
    });

};