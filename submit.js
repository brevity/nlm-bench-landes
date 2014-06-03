var request = require('request').defaults({jar: true}),
    async   = require('async'),
    _       = require('underscore'),
    colors  = require('colors');

//var request = request.defaults({jar: true});
function authorize(cb){

  var authurl = 'http://www.landesbioscience.com/admin/';
  var r = request.post(authurl, function authenticateRequest (err, res, body) {
  if (err) {
    return console.error('auth failed:', err);
  } else {
    var cookies = res.headers['set-cookie'];
    var authCookie = cookies.filter(function findAuthCookie(e,i){
      if(e.substr(0,13) == 'authchallenge'){
        return true;
      }
    });
    if(authCookie.length > 0){
      console.log('[ success ] Authorization Complete!'.green);
      cb(null, {authenicated:true});
    } else {
      console.log('[ error ] Authorization failed!'.red);
    }
  }
  }).form({
      admin_username : process.env.LANDES_USER || '',
      admin_password : process.env.LANDES_PASS || ''
  });
}

function getReview(cb){
  // bring in info about journals
  var info      = require('./journal_info.js'),
      slugs     = info.slugs,
      issueless = info.issueless;

  var piis = [],
      issues = [];

  //setup request to xml_reports.
  var url = 'http://www.landesbioscience.com/full_text/xml_reports/review_jqgrid/';
  request(url, function pushGoRequest(err, res, body){
    var json = JSON.parse(body);
    json.rows.map(function(e, i){
      var keys = ['jgridID','mysteryInt', 'slug', 'volume', 'issue', 'pii', 'editor', 'it', 'status', 'days', 'completed', 'notes'];
      if(e.cell[10] == '-' && e.cell[8] == 'reviewing issue'){
        var article = {};
        keys.map(function(k, ii){
          article[k] = e.cell[ii];
        });
        if(article.pii !== '-'){
          piis.push(article);
        } else {
          var issue = article;
          issue.path = slugs.indexOf(issue.slug) + '/' + issue.volume + '/' + issue.issue;
          issues.push(issue);
        }
      }
    });
    var report = {
      piis: piis,
      issues: issues
    };
   // console.log(report);
    //fs.writeFileSync('underreview.json', JSON.stringify(report));
    cb(null, {piis:piis, issues:issues});
  });
}

function cleanup(err, resp){
  console.log(resp);
}

function examineArticles(err, resp){
  var piis = resp[1].piis;
  piis.map(function lookAtNotes(e,i){
    console.log(e.notes);
  });
  async.series([
    
  ], cleanup);
  //cleanupconsole.log(resp[1].issues);
  
}

function start(){
  async.series([
    authorize,
    getReview,
  ], examineArticles);
}
start();
console.log('-------------------------------------------------------------------------------------------------------------------------'.blue);
