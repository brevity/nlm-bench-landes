#!/usr/bin/env node
var sources = {};

// Info for logging in to landes.

var argv      = require('minimist')(process.argv.slice(2)),
    fs        = require('fs'),
    async     = require('async'),
    request   = require('request'),
    util      = require('util'), 
    cheerio   = require('cheerio'),
    colors  = require('colors');

// bring in info about journals
var info      = require('./journal_info.js'),
    slugs     = info.slugs,
    issueless = info.issueless;

// Stuff to kick off a second node process
var sys = require('sys'),
    exec = require('child_process').exec;

// pipe second process' output to stdout
function puts(error, stdout, stderr) { sys.puts(stdout); }


var j = request.jar(),
    request = request.defaults( {jar: j} );


var url = 'http://www.landesbioscience.com/full_text/xml_reports/review_jqgrid/';
var src = 'landes';
function scrape(){
  var piis = [],
      issues = [];

  request(url, function(err, res, body){
    //var $ = cheerio.load(body);
    if(process.env.LANDES_USER == 'username' || process.env.LANDES_PASS == 'password' || process.env.LANDES_USER === undefined || process.env.LANDES_PASS === undefined){
      console.log("| Dude.....".blue);
      console.log("| You gotta use your actual username and password... ".red);
      console.log("| That oneliner in the README should've setup the environment variables,".red);
      console.log("| but you need to put in your actual landes credentials".red);
      process.exit();
    }
    var json = JSON.parse(body);
    json.rows.map(function(e, i){
      if(e.cell[10] == '-' && e.cell[8] == 'reviewing issue'){
        var msg = e.cell[11] || '',
            pii = e.cell[5],
            id;

        if(pii !== '-'){
          id = pii;
          piis.push(pii);
        } else {
          var slug = slugs.indexOf(e.cell[2]);
          id = e.cell[2] + ": " + slug + "/" + e.cell[3] + "/" + e.cell[4];
          issues.push(id);
        }
      }
    });
    var report = {
      piis: piis,
      issues: issues
    };
    console.log("[ issues ]".yellow, report.issues.join(' ').yellow);
    console.log("A report of articles and issues currently under review has been saved as", "underreview.json".green);
    console.log("Now we'll take a look at the loose articles under review");
    fs.writeFileSync('underreview.json', JSON.stringify(report));

  // Kick off scrape for issueless articles under review
  exec("node index.js --under", puts);

  });
}
function authenticate(){
  var authURL = 'http://www.landesbioscience.com/admin/',
      authForm = {
        admin_username : process.env.LANDES_USER || '',
        admin_password : process.env.LANDES_PASS || ''
      };
      r = request.post(authURL, function optionalCallback (err, httpResponse, bod) {
        if (err) {
          return console.error('login failed:', err);
        }
        scrape();
      });
  var form = r.form();
  for(var field in authForm){
    form.append(field, authForm[field]);
  }
}
authenticate();
