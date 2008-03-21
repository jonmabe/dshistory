
var TestingDriver = function() {
	var testingGroups, returnObj;
	
	function initialize() {
		$('.command').click(returnObj.executeTestGroup);
	}
	
	testingGroups = {
		// these function names correspond to the h2 innerHTML. not sure if it's a good idea or not for maintenance reasons, but just trying new stuff here to see what happens.
		'the basics': function() {
			var labels = $(this.childNodes).filter('.status');
			
			if (dsHistory)
				labels.eq(0).addClass('success').text('OK');
			else {
				labels.eq(0).addClass('failure').text('FAIL');
				return false;
			}
			
			try {
				dsHistory.addFunction(
			} catch (e) {
			}
				labels.eq(0).addClass('success').text('OK');
			else {
				labels.eq(0).addClass('failure').text('FAIL');
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