
var TestingDriver = function() {
	var testingGroups, returnObj;
	
	function initialize() {
		$('.command').click(returnObj.executeTestGroup);
	}
	function performTest(labels, index, fnc) {
		try {
			fnc();
			labels.eq(index).addClass('success').text('OK');
			return true;
		} catch (e) {
			labels.eq(index).addClass('failure').text('FAIL');
			return false;
		}
	}
	
	testingGroups = {
		// these function names correspond to the h2 innerHTML. not sure if it's a good idea or not for maintenance reasons, but just trying new stuff here to see what happens.
		'the basics': function() {
			var labels = $(this.childNodes).filter('.status');
			
			// dsHistory initialized
			//performTest(function() { 
			if (dsHistory)
				labels.eq(0).addClass('success').text('OK');
			else {
				labels.eq(0).addClass('failure').text('FAIL');
				return false;
			}
			
			// addFunction
			try {
				dsHistory.addFunction(function() {}, {scopeTest: 'success'}, {objectArgTest: 'success'});
				
				labels.eq(1).addClass('success').text('OK');
			} catch (e) {
				labels.eq(1).addClass('failure').text('FAIL');
				return false;
			}
			
			// setQueryVars, removeQueryVars, bindQueryVars
			try {
				dsHistory.setQueryVar('keyValueTest \'#123%', 'success');
				dsHistory.bindQueryVars(function() {});
				dsHistory.removeQueryVar('keyValueTest \'#123%');
				dsHistory.bindQueryVars(function() {});
				
				labels.eq(2).addClass('success').text('OK');
			} catch (e) {
				labels.eq(2).addClass('failure').text('FAIL');
				return false;
			}
			
			// read QueryElements
			try {
				dsHistory.setQueryVars('keyValueTest \'#1234%', 'success');
				dsHistory.bindQueryVars(function() {});
				if (dsHistory.QueryElements['keyValueTest \'#1234%'] != 'success')
					throw 'error';
				
				dsHistory.removeQueryVar('keyValueTest \'#1234%');
				dsHistory.bindQueryVars(function() {});
				if (dsHistory.QueryElements != {})
					throw 'error';
				
				labels.eq(1).addClass('success').text('OK');
			} catch (e) {
				labels.eq(1).addClass('failure').text('FAIL');
				return false;
			}
		},
		'... and combinations thereof': function() {
			var labels = $(this.childNodes).filter('label');
		}
	};
	returnObj = {
		executeTestGroup: function(e) {
			var target = e.target || e.srcElement;
			var testingGroup = $(target).prev()[0].innerHTML;
			
			$(target.parentNode).next().slideDown('fast', testingGroups[testingGroup]);
		}
	};
	
	$(initialize);
	
	return returnObj;
}()