#!/bin/sh 

# fix errors from pmc eval...
# Had to run another pass on this....
# http://www.cyberciti.biz/faq/unix-loop-through-files-in-a-directory/
cd /Users/itintern/code/pmc/xml
for name in *\ *.XML; do mv -v "$name" "${name// /_}"; done
for f in ./*.XML
do
  echo 'correcting '$f;

    #grep -iv 'fn-group' $f >./tmp;
    #mv ./tmp $f;
    
    #grep -iv '<issue>' $f >./tmp;
    #mv ./tmp $f;

    #cat $f | perl -p -e 's/ppub/collection/g' >tmp;
    #mv ./tmp $f;
    
    #awk '/collection\">/{for(x=NR+1;x<NR+3;x++)d[x];}{a[NR]=$0}END{for(i=1;i<=NR;i++)if(!(i in d))print a[i]}' $f >tmp
    #mv tmp $f

    #awk '/<related-article/{print "        Addendum to:"}1' $f >tmp
    #mv tmp $f

    #awk '/Previously published online:/{for(x=NR-2;x<NR+3;x++)d[x];}{a[NR]=$0}END{for(i=1;i<=NR;i++)if(!(i in d))print a[i]}' $f >tmp
    #mv tmp $f

    #cat $f | perl -p -e 's/<oasis:table/<oasis:table rowsep="1" colsep="1"/g' >perltmp;
    #mv ./perltmp $f;

    # [error]subject-group checking: <article-categories> must contain a <subj-group> with subj-group-type attribute 'heading'. (Tagging Guidelines)
    cat $f | perl -p -e 's/<subj-group subj-group-type="article_type"/<subj-group subj-group-type="heading"/g' >perltmp;
    mv ./perltmp $f;
    #cat $f | perl -p -e 's/<subj-group subj-group-type="article-type"/<subj-group subj-group-type="heading"/g' >perltmp;
    #mv ./perltmp $f;

    # This wouldn't normally be necessary....
    #awk '/<pub-date pub-type="ppub">/{for(x=NR;x<NR+5;x++)d[x];}{a[NR]=$0}END{for(i=1;i<=NR;i++)if(!(i in d))print a[i]}' $f >tmp
    #mv tmp $f

done

