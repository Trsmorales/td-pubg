// JavaScript Document
//Things you want to happen before the document is shown.
$('.register').hide();
// Once the document is shown.
$(document).ready(function() {
	"use strict";
	$('.reg-btn').change(function() {
    if(this.checked) {
        $('.register').show();
        $('.login').hide();
    }
	});
	$('.login-btn').change(function() {
		if(this.checked) {
			$('.login').show();
			$('.register').hide();
		}
	});
});
