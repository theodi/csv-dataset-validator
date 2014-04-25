function handleValidationForURL(url) {
	$.getJSON("http://odinprac.theodi.org/CSV_Dataset_Validator/get_data.php?url="+url, function(json) {
		// Loading percentage
		console.log("hello");
		console.log(json);
		percent = Math.floor((json.completed / json.file_count) * 100);
		$('progress').attr('value',percent);
		if (json.completed < json.file_count) {
			setTimeout(function(){handleValidationForURL(url);},500);
		}
		processFileProblems(json);
	})
	.error(function() {
        	//console.log("error fetching data");
		setTimeout(function(){handleValidationForURL(url);},500);
   	});
}
function getDataFromURL(url) {
	$.getJSON(url, function(json) {
		$( "#dataset-title" ).html(json.title);
		$( "#dataset-description" ).html(json.notes);
		$( "#result" ).fadeIn("slow",function() {
			handleValidationForURL(url);
		});
	})
	.error(function() {
        	console.log("error fetching data");
		$( "#front-page" ).fadeIn("slow",function() {
		});
		//setTimeout(function(){handleValidationForURL(url);},2000);
   	});
	
}

function processFileProblems(json) {
	$( "#file-count" ).html(json.file_count);
	$( "#csv-yes" ).html(json.unix_file_match);
	$( "#csv-no" ).html(json.unix_file_mismatch);
	var open = false;
	for (var file_num in json.unix_file_mixmatches) {
		if (open) {
			$( "#invalid-csv-detail-text" ).append("<br/><hr/><br/>");		
		}
		file_mime = json.unix_file_mixmatches[file_num].mime;
		file_name = json.files[file_num]["filename"];
		file_description = json.files[file_num]["description"];
		$( "#invalid-csv-detail-text" ).append("Errors in file: <b>" + file_description + " (" + file_name + ")</b><br/><br/>");
		$( "#invalid-csv-detail-text" ).append("Although this file looks like a CSV file (by name) when attempting to open the <code>Content-Type</code> appears to be <code>"+file_mime+"</code><br/><br/>To fix this error you may need to re-upload the file or link to the correct CSV file.");
		open = true;
	}
}

$( document ).ready(function() {
	$.ajaxSetup({ cache: false });
	registerListeners();
	$( "#result" ).hide();
});

function registerListeners() {

	$( "#submit" ).click(function() {
  		url = $( "#input_url").val();
		$( "#front-page" ).fadeOut("slow",function() {
			getDataFromURL(url);
		});
	});

}
