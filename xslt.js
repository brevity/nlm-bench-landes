var xslt = require('node_xslt'),
    cheerio = require('cheerio'),
    fs = require('fs');

var s = xslt.readXsltFile('./xsl/nlm-stylechecker.xsl');
var s2 = xslt.readXsltFile('./xsl/style-reporter.xsl');
var doc = xslt.readXmlFile('./test.xml');

var result = xslt.transform(s, doc, []);
var result = xslt.readXmlString(result);
var result = xslt.transform(s2,result,[]);
fs.writeFileSync('./results.html', result);

console.log(result);

//xsltproc nlm-stylechecker.xsl test.xml >midway.xml; xsltproc style-reporter.xsl midway.xml >report.html;open report.html
