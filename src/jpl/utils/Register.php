<?php 

$name     = $_GET["name"]; 
$phone    = $_GET["phone"]; 
$email    = $_GET["email"]; 
$username = $_GET["username"]; 
$desc     = $_GET["desc"]; 

$to       = "@@EMAIL";
$subject  = "@@TITLE User Account Registration Request";

$message = '
<html>
<body>
  <table border="0">
    <tr>
      <td colspan="2">
        <p style="text-align:justify">
        Almost all @@TITLE functionality and data are available to the general public without restriction or the need to register for an individual or group account.  However, requests to establish registered accounts will be considered for those users who can demonstrate a justifiable need to access the features not available to the general public.  These features include the ability to run lighting analyses and slope analyses.<br><br>If you believe your need for access to one or more of these additional features is justified, then please provide the following information for consideration:<br><br>
       </p>
      </td>
    </tr>
    <tr>
      <td align="right" width="180">
        <b>Name</b>:&nbsp;
      </td>
      <td>';
$message .= $name;
$message .= '
      </td>
    </tr>
    <tr>
      <td align="right" width="180">
        <b>Phone Number</b>:&nbsp;
      </td>
      <td>';
$message .= $phone;
$message .= '
        <input id="regphone" type="textbox" value="909-763-1607">
      </td>
    </tr>
    <tr>
      <td align="right" width="180">
        <b>Email</b>:&nbsp;
      </td>
      <td>';
$message .= $email;
$message .= '
        <input id="regemail" type="textbox" value="qvu2@yahoo.com">
      </td>
    </tr>
    <tr>
      <td align="right" width="180">
        <b>Preferred Username</b>:&nbsp;
      </td>
      <td>';
$message .= $username;
$message .= '
        <input id="regusername" type="textbox" value="qvu">
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <br>Brief Description of Need, Intended Use and Justification:
      </td>
    </tr>
    <tr>
      <td colspan="2">';
$message .= $desc;
$message .= '
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <br>Thank you for your interest in @@TITLE!<br><br>
      </td>
    </tr>
  </table>
</body>
</html>
'; 

$headers  = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
$headers .= 'From: @@EMAIL' . "\r\n";

//$message = str_replace("\n.", "\n..", $message);
//$message = wordwrap($message, 70, "\r\n");

mail($to, $subject, $message, $headers);

echo "Success";

?>

