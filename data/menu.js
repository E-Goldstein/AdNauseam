if (false && typeof self.port === 'undefined') { // for testing w'out cfx
	console.log("NO SELF FOUND");
	
	$(document).ready(function() {
		
		console.log("NO SELF FOUND2");

		initHandlers();
		
		var testAdFile = "../lib/test/lots-of-ads.json";
		var testPageUrl = "http://www.nytimes.com/";
		
		$.getJSON(testAdFile, function(json) {
			
			console.warn("Menu.js :: Test Ad-data...");
		    layoutAds(processAdData(testGetAds(json), testPageUrl));
		    
		}).fail(function(e) { console.warn( "error:", e); });
		
		function testGetAds(adlookup, filter) { 
		
			var all = [], keys = Object.keys(adlookup);
			for (var i = 0, j = keys.length; i < j; i++) {
		
				var ads = adlookup[keys[i]];
				for (var k=0; k < ads.length; k++) {
					
					if (!filter || filter(ads[k])) 
						all.push(ads[k]);
				}
			}
			return all;
		}
		
// 		
		// $('#log-button').unbind().click(function() {
// 
			// window.location.href = 'log.html';
		// });

	});
	
	// console.log("removing handler");
	// $('#log-button').off("click");
// 	
	// $('#vault-button').click(function() {
// 
		// alert("show-vault");
	// });
}
/*if (typeof self.port === 'undefined') { // for testing w'out cfx

	console.warn("---------------- TESTING ----------------");

	var testAdFile = "../lib/test/lots-of-ads.json";
	//var testAdFile = "../lib/test/test-ad-data.json";
	var testPageUrl = "http://www.nytimes.com/";
	
	$(document).ready(function() {
		
		initHandlers();
		
		$.getJSON(testAdFile, function(json) {
			
			console.warn("Menu.js :: Test Ad-data...");
		    layoutAds(processAdData(testGetAds(json), testPageUrl));
		    
		}).fail(function(e) { console.warn( "error:", e); });
	});
	
	function testGetAds(adlookup, filter) { 
	
		var all = [], keys = Object.keys(adlookup);
		for (var i = 0, j = keys.length; i < j; i++) {
	
			var ads = adlookup[keys[i]];
			for (var k=0; k < ads.length; k++) {
				
				if (!filter || filter(ads[k])) 
					all.push(ads[k]);
			}
		}
		return all;
	}
}
else {
	initHandlers(); 
}*/


	
self.port && self.port.on('refresh-ads', layoutAds);

self.port && self.port.on('refresh-panel', function(opts) {

	var img = 'img/adn_active.png', label = 'Pause AdNauseam';

	$('#pause-button').removeClass('disabled');

	if (!opts.enabled) {

		img = 'img/adn_disabled.png';
		label = 'Start AdNauseam';
		$('#pause-button').addClass('disabled');
	}

	$('#toggle-button').css('background-image', 'url('+img+')');
	$('#pause-button').text(label);
});

self.port && self.port.on("close-panel", function() {
	//console.log("popup.close-panel: ");
});

self.port && self.port.on("open-panel", function() {
	console.log("popup.open-panel: ");
});

self.port && self.port.on("load-advault", function() {
	console.log("popup.load-advault: ");
});

function processAdData(ads, pageUrl) {

	console.warn("processAdData: "+ads.length+", "+pageUrl);

	var ad, unique=0, onpage=[], soFar, hash = {};

	// set hidden val for each ad
	for (var i=0, j = ads.length; i<j; i++) {

		ad = ads[i];

		if (!ad.contentData) continue;

		soFar = hash[ad.contentData];
		if (!soFar) {

			// new: add a hash entry
			hash[ad.contentData] = 1;
			ad.hidden = false;

			// update count on this page
			if (pageUrl === ads[i].pageUrl || 
				(typeof testPageUrl != 'undefined' && 
					testPageUrl === ads[i].pageUrl))  // for testing
			{
				// TODO: don't count old ads from same url
				onpage.push(ads[i]);
			}

			// update total (unique) count
			unique++;
		}
		else {

			// dup: update the count
			hash[ad.contentData]++;
			ad.hidden = true;
		}
	}

	// update the count for each ad from hash
	for (var i=0, j = ads.length; i<j; i++) {

		ad = ads[i];
		ad.count = hash[ad.contentData];
	}

	return { ads: ads, uniqueCount: unique, onpage: onpage };
}

function layoutAds(data) { //ads, onpage, uniqueCount) {

		console.log('Menu: objects=' + data.ads.length
			+', unique=' + data.uniqueCount
			+', onpage=' + data.onpage.length);
	
		var visitedCount = 0;
		for (var i=0, j = data.onpage.length; i<j; i++) {
			if (!data.onpage[i].hidden && data.onpage[i].visitedTs > 0)
				visitedCount++;
		}

		$('#ad-list-items').html(createHtml(data.onpage));
		setCounts(data.onpage.length, visitedCount, data.ads.length);
}

function setCounts(found, visited, total) {
	
	$('#found-count').text(found+' ads found');
	$('#visited-count').text(visited+' ads visited');
	$('#vault-count').text(total);
}

function createHtml(ads) {

	var html = '';

	for (var i=0, j = ads.length; i<j; i++) {

		//console.log(i+") "+ads[i].contentType);

		if (ads[i].contentType === 'img') {

			html += '<li class="ad-item"><a target="new" href="' + ads[i].targetUrl;
			html += '"><span class="thumb"><img src="' + ads[i].contentData;
			html += '" class="ad-item-img' + visitedState(ads[i]);
			html += '" onError="this.onerror=null; this.src=\'img/blank.png\';"';
			html += '" alt="ad thumb"></span><span class="title">'; 
			html +=  ads[i].title ? ads[i].title  : "#"+ads[i].id;
			html += '</span><cite>'+targetDomain(ads[i].targetUrl)+'</cite></a></li>\n\n';
		}
		else if (ads[i].contentType === 'text') {

			html += '<li class="ad-item-text';
			html += visitedState(ads[i]) + '""><span class="thumb">';
			html += 'Text Ad</span><h3><a target="new" href="' + ads[i].targetUrl + '">';
			html += ads[i].title + '</a></h3><cite>' + targetDomain(ads[i].targetUrl);
			html += '</cite><div class="ads-creative">' + ads[i].contentData +'</div></li>\n\n';
		}
	}

	//console.log("\nHTML\n"+html+"\n\n");

	return html;
}

function visitedState(ad) {

	return ad.visitedTs > 0 ? '-visited' : (ad.visitedTs < 0 ? '-errored' : '');  
}


function targetDomain(text) {

	var doms = extractDomains(text);
	var dom = doms[doms.length-1];
	return new URL(dom).hostname;
}

function extractDomains(text) {

	var result = [], matches, 
		regexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

	while (matches = regexp.exec(text))
	    result.push(matches[0]);

	return result;
}

function initHandlers() {
		
	console.log('initHandlers');		

	$('#log-button').click(function(e) {
		console.log('#log-button.click');

		self.port && self.port.emit("show-log");
	});
	
	$('#vault-button').click(function() {
		console.log('#vault-button.click');

		self.port && self.port.emit("show-vault");
	});

	$('#clear-ads').click(function(e) {
		
		e.preventDefault(); // no click
		
		// remove all visible ads from menu
		$('.ad-item').remove();
		$('.ad-item-text').remove();
		setCounts(0, 0, 0);
		
		// trigger closing of settings
		$("#settings-close").trigger( "click" );
		
		// call addon to clear simple-storage
		self.port && self.port.emit("clear-ads");
	});

	$('#pause-button').click(function() {
		//console.log('#pause-button.click');
		self.port && self.port.emit('disable');
	});

	$('#settings-close').click(function() {

		//console.log('#settings-close.click');

		$('.page').toggleClass('hide');
		$('.settings').toggleClass('hide');

		self.port && self.port.emit('hide-settings');
	});

	$('#settings-open').click(function() {

		//console.log('#settings-open.click');

		$('.page').toggleClass('hide');
		$('.settings').toggleClass('hide');

		self.port && self.port.emit('show-settings');
	});

	$('#about-button').click(function() {
		//console.log('#about-button.click');
		self.port && self.port.emit('show-about');
	});

	$('#cmn-toggle-1').click(function() {
		
		var val = $(this).prop('checked'); 
		
		//console.log('#disable-logs.click: '+val);
		self.port && self.port.emit('disable-logs', { 'value' : val });
	}); 
}

initHandlers();