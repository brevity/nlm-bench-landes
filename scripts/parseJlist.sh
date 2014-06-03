#!/bin/bash

`wget -O jlist.csv  http://www.ncbi.nlm.nih.gov/pmc/journals/?format=csv`

    grep -v 'Landes Bioscience' jlist.csv >tmp
    mv tmp jlist.csv


