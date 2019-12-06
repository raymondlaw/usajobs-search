const fs = require("fs");
const url = require("url");
const http = require("http");
const https = require("https");

const usajobs_api = "https://data.usajobs.gov/api/search?Keyword=";
const credentials = require("./api/credentials.json");
const options = {headers: credentials};

const new_connection = function (req, res) {
    if (req.url === "/") {
        res.writeHead(200, {"Content-Type": "text/html"});
        fs.createReadStream("./html/index.html").pipe(res);
    }
    else if (req.url.startsWith("/search")) {
        let user_input = url.parse(req.url, true).query.title;
        https.get(`${usajobs_api}${user_input}`, options, function (usajobs_stream) {
            let job_data = "";
            usajobs_stream.on("data", (chunk) => job_data += chunk);
            usajobs_stream.on("end", function () {
                let job_json = JSON.parse(job_data);
                let all_jobs = job_json && job_json.SearchResult && job_json.SearchResult.SearchResultItems;
                let output = all_jobs.map(generate_job_description).join("");
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end(`<h1>Search Results:</h1><ul>${output}</ul>`);
            });
        });
    }
    else {
        res.writeHead(404);
        res.end();
    }
};

const generate_job_description = function (job) {
    let job_descriptor = job && job.MatchedObjectDescriptor;
    let job_title = job_descriptor && job_descriptor.PositionTitle;
    let job_url = job_descriptor && job_descriptor.PositionURI;
    let job_summary = job_descriptor && job_descriptor.QualificationSummary;
    return `<li><a href="${job_url}">${job_title}<a><p>${job_summary}</p></li>`;
};

let server = http.createServer(new_connection);
server.listen(3000, "localhost");
console.log("Now Listening on Port 3000");