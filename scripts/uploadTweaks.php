#!/usr/bin/php -q
<?php

echo "Whatever dude\n";

    function format_xml($xml_string, $final = false){
        //$xml_string = preg_replace('/&(?!(amp;|#)|lt;|gt;)/', '&amp;', $xml_string);
        //error_log(print_r($xml_string, 1)); die;

        //replace all the inline-supp tags with external link tags
        //$xml_string = str_replace('<inline-supplementary-material', '<ext-link ext-link-type="uri"', $xml_string);
        //$xml_string = str_replace('/inline-supplementary-material', '/ext-link', $xml_string);

        $xml_string = str_replace('http://www.example.com/namespaces/oasis/exchange-table-model', 'http://docs.oasis-open.org/ns/oasis-exchange/table', $xml_string);
        $xml_string = preg_replace('/(<sec>\s*(<title>\s*<\/title>\s*)?|<notes>)\s*<p\s*\/>\s*(<\/notes>|<\/sec>)/sm', '', $xml_string);
        $xml_string = str_replace('related-article-type="Addendum to:"', 'related-article-type="addendum"', $xml_string);
        $xml_string = str_replace('related-article-type="Comment to:"', 'related-article-type="commentary-article"', $xml_string);
        //$xml_string = str_replace('related-article-type=""', 'related-article-type="commentary"', $xml_string);
        $xml_string = preg_replace('/related-article-type="(Punctum\sto|Extra\sView\sto):"/i', 'related-article-type="article-reference"', $xml_string);
        $xml_string = str_replace('<year>In press</year>', '<comment>In press</comment>', $xml_string);      
        $xml_string= str_replace(array('[REMOVED HYPERLINK FIELD]', '<article-id pub-id-type="pii"/>', 'http://dx.doi.org/'), '', $xml_string);
        $xml_string = preg_replace('/<sup>\s*<\/sup>/ms', '', $xml_string);

        //get rid of html tags within a label
        if(preg_match_all('/<label>\s*(<(bold|sup|italic)>([^<]+)<\/(bold|sup|italic)>)\s*<\/label>\s*(<bold>|<p>|<caption>\s*<p>|<caption>\s*<title>)?/smi', $xml_string, $match)) {
            foreach($match[0] as $index => $label) {
                $new_string = $match[5][$index].$match[1][$index].' ';
                if(preg_match('/bold/', $match[5][$index])) $new_string = $match[5][$index].$match[3][$index].' ';
                $xml_string = str_replace($match[0][$index], $new_string, $xml_string);
            }
        }

        //get rid of encoding to preserve special characters
        $xml_string = preg_replace('/<\?xml[^\?]*\?>/i', "<?xml version=\"1.0\" ?>", $xml_string);

        //fix open access tag            
        //change tag for xml parser
        $xml_string = preg_replace('/<\?\s*release-delay\s*([0-9|]*)\s*\?>/', "<release-delay>$1</release-delay>", $xml_string);
        if($final){
            //change tag back to proper format for xml submission
            $xml_string = preg_replace('/\s*<release-delay>\s*([0-9|]*)\s*<\/release-delay>\s*/sm', "<?release-delay $1 ?>", $xml_string);
        }
        //file_put_contents(EEE_SITE_DIR.'test.xml', $xml_string); die;

        //if($final) {error_log(print_r($xml_string, 1)); die;}

        //fix spacing
        //if(!$final){
        $dom = new DOMDocument();
        $dom->formatOutput = true;
        $dom->preserveWhiteSpace = false;
        @$dom->loadXML($xml_string);
        $xml_string = $dom->saveXML();
        //}
        //error_log(print_r($xml_string, 1)); die;
        $xml_string = preg_replace('/<title\/>/sm', "<title> </title>", $xml_string);

        //remove empty paragraphs
        $xml_string = preg_replace('/(<p\/>|<p>\s*<\/p>)/sm', '', $xml_string);

        //fix line endings for proper comparison in filemerge
        $xml_string = preg_replace('/\n/sm', "\r\n", $xml_string);

        //replace oasis: if that was part of the original xml
        if(preg_match('/tgroup\scols=/', $xml_string)){
            $oasis = array('tgroup', 'colspec', 'thead', 'table>', 'trow', 'entry', 'row', 'tbody');
            foreach($oasis as $o){
                $xml_string = str_replace("<$o", "<oasis:$o", $xml_string);
                $xml_string = str_replace("</$o", "</oasis:$o", $xml_string);
            }
            if(preg_match_all('/(<oasis:(\w+)[^>]*)\/>/i', $xml_string, $match)){
                foreach($match[0] as $k => $v){
                    if($match[2][$k] != 'colspec') $xml_string = str_replace($v, $match[1][$k].'></oasis:'.$match[2][$k].'>', $xml_string);
                }
            }
        }

        //fix etal tag


        $xml_string = preg_replace('/\shref/', ' xlink:href', $xml_string );
        $xml_string = preg_replace('/([.]tif|eps|pdf|mov){2,}/', "\\1", $xml_string);

        //error_log(print_r($xml_string, 1)); die;
        return $xml_string;
    }

$file = file_get_contents("php://stdin", "r");
echo $file;
