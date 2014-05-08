function CSVtoArray(text) {
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) {
        console.warn("CSVtoArray: Invalid csv text.\n\nSee http://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript for help.");
        console.warn(text);
        return null;
    }
    var a = [];                     // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function(m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
            else if (m3 !== undefined) a.push(m3);
            return ''; // Return empty string.
        });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push('');
    return a;
};

function handleValidationForURL(url) {
	$.getJSON("http://odinprac.theodi.org/CSV_Dataset_Validator/get_data.php?url="+url, function(json) {
		// Loading percentage
		console.log(json);
		percent = Math.floor((json.completed / json.file_count) * 100);
		$('progress').attr('value',percent);
		if (json.completed < json.file_count) {
			setTimeout(function(){handleValidationForURL(url);},500);
		}
		processFileProblems(json);
		processColumnTitles(json);
		processLineNumbers(json);
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
	$( "#invalid-csv-detail-text" ).html("");		
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

function processLineNumbers(json) {
	var data = [];
	var obj = {};
	obj.key = "Line Counts";
	var file_array = [];
	for (file_num in json.files) {
		var obj2 = {};
		obj2.series = 0;	
		file = json.files[file_num];
		shortName = file.description + " (" + file.filename + ")";
		lineCount = json.line_counts[file_num];
		obj2.x = file.description;
		obj2.xLong = shortName;
		obj2.y = lineCount;
		file_array.push(obj2);
	}
	obj.values = file_array;
	data.push(obj);
	updateChart(chart,data);
	
}

function processColumnTitles(json) {
	variations = Object.keys(json.column_titles).length;
	$('#invalid-column-detail-text').html('');
	$( "#column-title-variations").html(variations);
	if (variations > 4) {
                $('#column-title-variations').css('background-color', '#f2dede');
                $('#invalid-column-detail-text').css('background-color', '#f2dede');
        } else if (variations > 2) {
                $('#column-title-variations').css('background-color', 'orange');
                $('#invalid-column-detail-text').css('background-color', '#orange');
        } else {
                $('#column-title-variations').css('background-color', 'green');
                $('#invalid-column-detail-text').css('background-color', '#green');
        }
	open = false;
	for (var val in json.column_titles) {
        	if (open) {
			$('#invalid-column-detail-text').append('<hr/>');
		}
		array = CSVtoArray(val);
		html = '<table id="columns-table"><tr>';
		for (var item in array) {
			html += '<td>' + array[item] + '</td>';
		}
		html += '</tr>';
		html += '</table>';
		html += '<b>Files:</b><ul class="file_list">';
		
		files = json.column_titles[val];
		for (num in files) {
			file_num = files[num];
			file_name = json.files[file_num]["filename"];
			file_description = json.files[file_num]["description"];
			html+= "<li><b>" + file_description + " (" + file_name + ")</b></li>";
		}
		html += '</ul>';
        	$('#invalid-column-detail-text').append(html);
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
