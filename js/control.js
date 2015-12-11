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

function getMedian(values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
	return values[half-1];
//        return (values[half-1] + values[half]) / 2.0;
}

function handleValidationForURL(url) {
	$.getJSON("http://odinprac.theodi.org/CSV_Dataset_Validator/get_data.php?url="+url, function(json) {
		// Loading percentage
		console.log(json);
		$( "#dataset-title" ).html(json.title);
		$( "#dataset-description" ).html(json.notes);
		percent = Math.floor((json.completed / json.file_count) * 100);
		$('progress').attr('value',percent);
		if (json.completed < json.file_count) {
			setTimeout(function(){handleValidationForURL(url);},500);
		}
		processFileProblems(json);
		processColumnTitles(json);
		processCSVLintResult(json);
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
		$( "#result" ).fadeIn("slow",function() {
			handleValidationForURL(url);
		});
		//$( "#front-page" ).fadeIn("slow",function() {
		//});
		//setTimeout(function(){handleValidationForURL(url);},2000);
   	});
	
}

function processCSVLintResult(json) {
	invalid_count = 0;	
	$("#invalid-csvlint-detail-table").html('<tr><th>File</th><th class="csvlint-error">Errors</th><th class="csvlint-warning">Warnings</th><th class="csvlint-info">Info</th><th>Status</th></tr>');
	for (var file_num in json.csvlintData) {
		current = json.csvlintData[file_num];
		if (current.state == "invalid") {
			invalid_count += 1;
			$("#csvlint-file-count").html(invalid_count);
		}
		if (invalid_count > 0) {
                	$('#csvlint-file-count').css('background-color', '#f2dede');
		}
		file_description = json.files[file_num]["description"];
		result = "<tr><td class='csvlint-ok'><a href='"+current.url+"' target='_blank'>" + file_description + "</a></td>";
		if (current.error_count > 0) { aclass="csvlint-error"; } else { aclass="csvlint-ok"; }
		result += "<td class='"+aclass+"'>" + current.error_count + "</td>";  
		if (current.warning_count > 0) { aclass="csvlint-warning"; } else { aclass="csvlint-ok"; }
		result += "<td class='"+aclass+"'>" + current.warning_count + "</td>";  
		if (current.info_count > 0) { aclass="csvlint-info"; } else { aclass="csvlint-ok"; }
		result += "<td class='"+aclass+"'>" + current.info_count + "</td>";
		result += "<td><img src='" + current.badge.png + "' alt='"+current.state+"'/></td>";
		$("#invalid-csvlint-detail-table").append(result);
	}
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
	var lengths = [];
	for (file_num in json.files) {
		var obj2 = {};
		obj2.series = 0;	
		file = json.files[file_num];
		shortName = file.description + " (" + file.filename + ")";
		lineCount = json.line_counts[file_num];
		obj2.x = file.description;
		obj2.xLong = shortName;
		obj2.y = lineCount;
		lengths.push(lineCount);
		file_array.push(obj2);
	}
	obj.values = file_array;
	data.push(obj);
	median = getMedian(lengths);
	console.log(lengths);
	console.log(median);
	$('#median-row-count').html(median);
    	lengths.sort( function(a,b) {return a - b;} );
	$('#shortest-row').html(lengths[0]);
    	lengths.sort( function(a,b) {return b - a;} );
	$('#longest-row').html(lengths[0]);
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

function expandSection(section) {
	$('#'+section).fadeIn();
	$('#'+section + "-control").html("&#9660;");	
}

function collapseSection(section) {
	$('#'+section).fadeOut();
	$('#'+section + "-control").html("&#9654;");	
}
	
file_validation_open = false;
csvlint_validation_open = false;
column_title_validation_open = false;
row_count_table_open = false;

function registerListeners() {
			
	collapseSection("invalid-csv-detail");
	collapseSection("invalid-csvlint-detail");
	collapseSection("invalid-column-detail");
	collapseSection("row-count-detail");

	$( "#submit" ).click(function() {
  		url = $( "#input_url").val();
		$( "#front-page" ).fadeOut("slow",function() {
			getDataFromURL(url);
		});
	});

	$( "#file-problems").click(function() {
		if (file_validation_open) {
			collapseSection("invalid-csv-detail");
			file_validation_open = false;
		} else {
			expandSection("invalid-csv-detail");
			file_validation_open = true;

		}
	});
	
	$( "#csvlint-problems").click(function() {
		if (csvlint_validation_open) {
			collapseSection("invalid-csvlint-detail");
			csvlint_validation_open = false;
		} else {
			expandSection("invalid-csvlint-detail");
			csvlint_validation_open = true;

		}
	});
	
	$( "#column-titles").click(function() {
		if (column_title_validation_open) {
			collapseSection("invalid-column-detail");
			column_title_validation_open = false;
		} else {
			expandSection("invalid-column-detail");
			column_title_validation_open = true;

		}
	});
	
	$( "#lines-per-file").click(function() {
		if (row_count_table_open) {
			collapseSection("row-count-detail");
			row_count_table_open = false;
		} else {
			expandSection("row-count-detail");
			row_count_table_open = true;

		}
	});

}
