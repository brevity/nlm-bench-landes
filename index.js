#!/usr/local/bin/node

var argv = require('minimist')(process.argv.slice(2)),
    util = require('util'),
    request = require('request'),
    fs = require('fs'),
    colors = require('colors'),
    xslt = require('node_xslt'),
    cheerio = require('cheerio'),
    spawn = require('child_process').spawn,
    readline = require('readline'),
    exec = require('child_process').exec,
    ProgressBar = require('progress');

   
report = {};
var requests = {};
var fileNames = [];

progress = {
  todo: 0,
  doneLast: 0,
  done: 0
};

var j = request.jar(),
    request = request.defaults( {jar: j} );

function authenticate(passVar, cb){
  var authURL = 'http://www.landesbioscience.com/admin/';
  var r = request.post(authURL, function optionalCallback (err, httpResponse, bod) {
    if (err) {
      return console.error('login failed:', err);
    }
    cb(passVar);
    // Do some stuff
  });
  var form = r.form(),
      usr = process.env.LANDES_USER || '',
      pwd = process.env.LANDES_PASS || '';

  form.append('admin_username', usr);
  form.append('admin_password', pwd);
}

function getXML(pii){
  var xmlurl = 'http://www.landesbioscience.com/admin/article/' + pii + '/download_xml';
  request.get(xmlurl, function(req, resp){
    var fileName = resp.headers['content-disposition'].split('=')[1].replace (/"/g,'');
    fileNames[pii] = fileName;
    xslStuff(pii, resp.body);
    fs.writeFileSync('./xml/' + fileName, resp.body);
    dtdStuff(pii, fileName);
  });
}

function dtdStuff(pii, fileName){


  var rd = readline.createInterface({
    input: fs.createReadStream('xml/' + fileName),
    output: process.stdout,
    terminal: false
  });

  rd.on('line', function(line) {
    if(line.indexOf('DOCTYPE') > -1){

      var snip = line.split(' ');
      snip = snip[snip.length -1];
      snip = snip.split('.');
      snip = snip[0];

      var dtd = snip.substr(1);
      lintIt(pii, fileName, dtd);
    }
  });
}
function lintIt(pii, fileName, dtd){
  var r = report[pii] = {};
  r.errs = [];
  r.warns = [];
  var dtdSwitch = exec('');
  var xmllint = spawn('xmllint', ['--noout', '--path', 'dtd/' + dtd, '--dtdvalid', dtd + '.dtd', 'xml/' + fileName]);
  //console.log(xmllint);
  xmllint.stderr.on('error', function(err) {
    console.log(err);
    throw err;
  });
  xmllint.stdout.on('close', function() {
    progress.doneLast++;
  });
  xmllint.stderr.on('data', function(data) {
    data = data.toString().split('\n');
    data.slice(0,(data.length - 2)).map(function(e,i){
      r.errs.push(e);
    });
  });
}

function xslStuff(pii, xml){
  if(String(pii).indexOf('X' !== -1)){
    
    $ = cheerio.load(xml.toString());
    var fileName = pii;
    $('article-id').is(function(i){
      if($(this).attr('pub-id-type') == 'pii'){
        pii = $(this).text();
      }
    });
  }
  
  if(xml === ''){
    xmlError(pii, '[error] Entire XML file seems to be missing');
  } else {
    var s = xslt.readXsltFile('./xsl/nlm-stylechecker.xsl');
    var s2 = xslt.readXsltFile('./xsl/style-reporter.xsl');
    var doc;
    try{
      doc = xslt.readXmlString(xml);
    } catch (e) {
      xmlError(pii, fileNames[pii], '[error] XML failed to parse.. ');
    }
    if (doc !== undefined){
      var result = xslt.transform(s, doc, []);
      result = xslt.readXmlString(result);
      result = xslt.transform(s2,result,[]);
      xslOutputToJSON(pii, result);
    }
  }
}

function xmlError(pii, errString){
  var r = report[pii] = {};
  r.errs = [errString];
  r.warns = [];
  progress.doneLast++;
}

function xslOutputToJSON(pii, xml){
  var $ = cheerio.load(xml),
      r = report[pii] = {};

  r.errs = [];
  r.warns = [];

  $('ol p').each(function(i, element){
    var el = $(element);
    var color = el.find('b font').attr('color');
    if(color == 'red'){
     r.errs.push(el.text());
    } else if (color == '#FF8D00'){
      el.find('a').remove();
      var text = el.text();
      if(text != '[warning]xref checking: target of <xref> is not in this document. '){
        r.warns.push(text);
      }
    }
  });
  progress.doneLast++;
}
watcher = {};
function stopWatcher(){
  clearInterval(watcher);
}
function setWatcher(){
  watcher = setInterval(function watcher(){
    var r = report,
        done = progress.done,
        doneLast = progress.doneLast,
        todo = progress.todo * 2,
        bar = new ProgressBar(':bar', { total: todo * 2 });
   bar.tick(doneLast * 2);
   done = done + doneLast;
    if(done == todo){
      stopWatcher();
      cleanup();
    }
  }, 1000);
  return watcher;
}
function cleanup(){
  clean = [];
  for(var pii in report){
    r = report[pii];
    if(r.errs.length === 0 && r.warns.length === 0){
      clean.push(pii);
      delete report[pii];
    } else{
     // if(r.errs.length === 0 ){delete r.errs;}
     // if(r.warns.length === 0 ){delete r.warns;}
    }
  }
  if(!argv.local){removeClean(clean);}
  printReport(clean);
}
//var r;
function printReport(){
  var cleanReport;
  if(clean.length > 0){ 
    cleanReport = "[ Clean ] " + String(clean);
  } else {
    cleanReport = "[ Clean ] NONE";
  }
  var piiToFileString = "";
  for(var p in fileNames){
    piiToFileString = piiToFileString + "\n" + p + "      " + fileNames[p];
  }

  fs.writeFileSync('xml/piiToFile.txt', piiToFileString);
  console.log(cleanReport.green);
  for( var pii in report){
    r = report[pii];
    var errs = r.errs.concat(r.warns),
        errorCount = "[ " + pii + " ] " + "[ " + fileNames[pii] + " ] " + errs.length + " Error(s)",
        moreThanTen = '';
    if(errs.length > 9){moreThanTen = "showing first 10";}
    
    console.log(errorCount.blue, moreThanTen);
    for(i = 0; i < 9 && i < errs.length; i++){
      console.log(errs[i].yellow);
    }
    console.log("-----------------------------------------");
  }
  console.log("valid xml has been reomved.".green, " xml with errors can be found in the xml/ directory".red);
}
function reportOnPiis(piis){
  progress.todo = piis.length;
  piis.map(function(pii){
    authenticate(pii, getXML);
  });
  setWatcher();
}
function getPiis(id){
  var issueurl = 'http://www.landesbioscience.com/admin/issue/' + id ;
  request(issueurl, function(req, resp){
    var $ = cheerio.load(resp.body),
        piis = [];

    $('li[article_id]').each(function(i,e){
      piis.push($(e).attr('article_id'));});
    reportOnPiis(piis);
  });
}

function reportOnIssue(id){
    authenticate(id, getPiis);
}

function reportOnLocal(){
  console.log("Looks like you want to check all the nlm files localy. We'll look in the xml dir".blue);
  var dir = fs.readdir('xml', function getLocalXML(err, files){
    files = files.filter(function(file){
      if(file.substr(-3).toLowerCase() == 'xml'){
        return true;
      } else {
        return false;
      }
    });
    if(files.length === 0){console.log("no xml files found.".red);process.exit();}
    progress.todo = files.length;
    setWatcher();
    files.map(function(f, i, a){
      var xml = fs.readFileSync('xml/' + f);

      xslStuff(f, xml);
      dtdStuff(f, f);
    });
  });
}

function removeClean(clean){
  clean.map(function(e,i){
    var path = './xml/' + fileNames[e];
    if(fs.statSync(path).isFile()){
      fs.unlinkSync(path);
    }
  });
}
if(process.env.LANDES_USER == 'username' || process.env.LANDES_PASS == 'password' || process.env.LANDES_USER === undefined || process.env.LANDES_PASS === undefined){
  console.log("| Dude.....".blue);
  console.log("| You gotta use your actual username and password... ".red);
  console.log("| That oneliner in the README should've setup the environment variables,".red);
  console.log("| but you need to put in your actual landes credentials".red);
  process.exit();
}
if(argv.issue){
  console.log("Looks like you want to check all the nlm files of isse", argv.issue.blue);
  reportOnIssue(argv.issue);
} else if (argv.local){
  reportOnLocal();
} else if (argv.under){
  var piis = JSON.parse(fs.readFileSync('./underreview.json', {encoding:'utf8'})).piis;
  reportOnPiis(piis);
}else if (argv._.length > 0){
  reportOnPiis(argv._);
}
