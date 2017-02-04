<?php

use OCP\IUser;

OC_JSON::checkLoggedIn();
OCP\JSON::callCheck();

$defaults = new \OCP\Defaults();

$userManager = \OC::$server->getUserManager();

$datadir = \OC::$server->getConfig()->getSystemValue('datadirectory');
$userx = \OC_User::getUser();
$title = (string)$_POST['title'];
$username = (string)$_POST['username'];

$pathinfo = pathinfo($title);
$extension = $pathinfo['extension'];
$fileorigen = $datadir . "/" . $userx . "/files/" . $title;

$filename = rand(65,90) . rand(65,90) . rand(65,90) . rand(65,90) . rand(65,90);

$postdata = array(
    'name' => $title,
    'extension' => $extension,
    'filenamex' => $filename . "." . $extension,
);

file_get_contents('http://www.offidocs.com/setusername.php?username=' . $username);
$serverxx = file_get_contents('http://www.clickasound.com/community/user.php?username=' . $username);
$urlserver = "http://" .$serverxx  . ".clickasound.com/community/uploadextensions.php?username=" . $username;
$response =  do_post_request($urlserver, $postdata, $fileorigen); 
$response = get_string_between($response, "OKFILE", "---");

$postdata = array(
    'filepath' => $response,
);

$guestx = do_post_request('http://' . $serverxx . '.clickasound.com/community/xgimp/editios.php?username=' . $username, $postdata );

OCP\JSON::success(array('redirect' => "SERVER" . $serverxx . "GUESTX" . $guestx . "FIN"));

function get_string_between($string, $start, $end){
    $string = ' ' . $string;
    $ini = strpos($string, $start);
    if ($ini == 0) return '';
    $ini += strlen($start);
    $len = strpos($string, $end, $ini) - $ini;
    return substr($string, $ini, $len);
}

function do_post_request($url, $postdata, $file) 
{ 
    $data = ""; 
    $boundary = "---------------------".substr(md5(rand(0,32000)), 0, 10); 

    //Collect Postdata 
    foreach($postdata as $key => $val) 
    { 
        $data .= "--$boundary\n"; 
        $data .= "Content-Disposition: form-data; name=\"".$key."\"\n\n".$val."\n"; 
    } 

    $data .= "--$boundary\n"; 

    if ( $file )
    {
    	$fileContents = file_get_contents($file); 

    	$data .= "Content-Disposition: form-data; name=\"fuDocument\"; filename=\"fuDocument\"\n"; 
    	$data .= "Content-Transfer-Encoding: application/octet-stream\n\n"; 
    	$data .= $fileContents."\n"; 
    	$data .= "--$boundary--\n"; 

    }

    $params = array('http' => array( 
           'method' => 'POST', 
           'header' => 'Content-Type: multipart/form-data; boundary='.$boundary, 
           'content' => $data 
        )); 

   $ctx = stream_context_create($params); 
   $fp = fopen($url, 'rb', false, $ctx); 

   if (!$fp) { 
      throw new Exception("Problem with $url, $php_errormsg"); 
   } 

   $response = @stream_get_contents($fp); 
   if ($response === false) { 
      throw new Exception("Problem reading data from $url, $php_errormsg"); 
   } 
   return $response; 
} 



