#! /bin/sh

echo "--------- Looking for problems-----------";
cat *.XML | grep subj-group-type;
echo "--------- doing some nlMassage -------------";
perl -pi -e 's/subj-group-type="[^"]*/subj-group-type="heading/;' *.XML
cat *.XML | grep subj-group-type;
echo "----------- Is that Better? --------------";
