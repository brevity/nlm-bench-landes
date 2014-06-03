# These are the xsl files that generate error reports regarding pmc submissions.
they can be run on an individual xml file to generate an html report like this.

```
xsltproc nlm-stylechecker.xsl test.xml >trashme.xml; xsltproc
style-reporter.xsl trashme.xml >report.html;open report.html
```
