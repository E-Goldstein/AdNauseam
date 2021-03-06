var TEST_APPEND_IDS = true;

self.port && self.port.on('layout-ads', layoutAds); // refresh all
self.port && self.port.on('update-ads', updateAds); // update some
self.port && self.port.on('refresh-panel', refreshPanel); // set-state

function layoutAds(obj) {

	var adhash = obj.data, currentAd = obj.currentAd;

    //console.log('Menu::layoutAds: '+currentAd ? currentAd.id : 'none');
    	
	var page = typeof TEST_MODE != 'undefined'
		&& TEST_MODE ? TEST_PAGE : obj.page;
	   
	var data = processAdData(adhash, page);

	//console.log('Menu: ads.total=' + data.ads.length 
	   //+ ' ads.duplicates='+(data.ads.length-data.unique));
		//', ads.onpage=' + data.onpage.length+", page="+page);

	$('#ad-list-items').html(createHtml(data));

    currentAd && tagCurrentAd(currentAd);

	setCounts(data.onpage.length, visitedCount(data.onpage), data.ads.length);
}

function updateAds(obj) {

    var sel, td, onpage,
        adhash = obj.data, 
        currentAd = obj.currentAd,
        updates = obj.updates, 
        page = obj.page;

    //console.log('Menu::updateAds: ', currentAd);
    
    // change class, {title, (visitedTs) resolved}
    for (var i=0, j = updates.length; i<j; i++) {

        // update the title
        sel = '#ad' + updates[i].id + ' .title';
        $(sel).text(updates[i].title);

        if (updates[i].contentType !== 'text') {
            
            // update the url    
            sel = '#ad' + updates[i].id + ' cite';
            td = targetDomain(updates[i]);
            if (td) $(sel).text(td);
        }

        // update the class
        sel = '#ad' + updates[i].id;
        $(sel).addClass(updates[i].visitedTs > 0 ? 'visited' : 'failed')
            .removeClass('just-visited').addClass('just-visited');
        
        //console.log("UPDATE-CLASSES: "+$(sel)[0].classList);
    }

    currentAd && tagCurrentAd(currentAd);
    
    onpage = processAdData(adhash, page).onpage; 
    
    $('#visited-count').text(visitedCount(onpage)+' ads visited');
    
    animateIcon(500);
}

function refreshPanel(opts) {

    //console.log('refreshPanel: opts: ',opts);

    var img = 'img/adn_active.png', label = 'Pause AdNauseam';

    $('#pause-button').removeClass('disabled');

    if (!opts.enabled) {

        img = 'img/adn_disabled.png';
        label = 'Start AdNauseam';
        $('#pause-button').addClass('disabled');
    }
    
    $('#version-disp').text('v'+opts.version);
    $('#cmn-toggle-1').prop('checked', opts.disableLogs); 
    $('#cmn-toggle-2').prop('checked', opts.disableOutgoingReferer);

    $('#toggle-button').css('background-image', 'url('+img+')');
    $('#pause-button').text(label);
    
}

function animateIcon(ms) {
    
    var down = 'img/adn_visited.png', up = 'img/adn_active.png';
    $('#toggle-button').css('background-image', 'url('+down+')');
    
    setTimeout(function() {
        
        $('#toggle-button').css('background-image', 'url('+up+')');
        
    }, ms);
}

function setCounts(found, visited, total) {

	$('#found-count').text(found+' ads detected');
	$('#visited-count').text('clicked '+visited);
	$('#vault-count').text(total);
}

function visitedCount(arr) {

	var visitedCount = 0;
	for (var i=0, j = arr.length; i<j; i++) {
		if (!arr[i].hidden && arr[i].visitedTs > 0)
			visitedCount++;
	}
	return visitedCount;
}

function getRecentAds(ads, num) {
    
    ads.sort(byField('visitedTs'));
    var recent = [];
    
    for (var i=0; recent.length < num && i < ads.length; i++) {
      if (ads[i].visitedTs == 0)
        recent.push(ads[i]);
    }
    
    for (var i=0; recent.length < num && i < ads.length; i++) 
        recent.push(ads[i]);
        
    // TODO: make sure currently-being-attempted ad is first

    return recent;
}
        
function createHtml(data) { // { fields: ads, onpage, unique };

	var html = '', ads = data && data.onpage;
	
	showAlert(false);
	$('#ad-list-items').removeClass();
	
	if (!ads || !ads.length) { // no-ads on this page, show 5 recent instead
	    
        ads = getRecentAds(data.ads.slice(), 5);
        
        var msg = 'no ads found on this page';
        if (ads && ads.length) msg += ' (showing recent)';
        showAlert(msg);
        
        $('#ad-list-items').addClass('recent-ads');
        
        console.log('Handle case: no-ads on page *** '+ads.length+' recent ads');
    }

	for (var i=0, j = ads.length; i<j; i++) {

		//console.log(i+") "+ads[i].contentType);

		if (ads[i].contentType === 'img') {

			html += '<li id="ad' + ads[i].id +'" class="ad-item' + visitedClass(ads[i]);
			html += '"><a target="new" href="' + ads[i].targetUrl;
			html += '"><span class="thumb"><img src="' + (ads[i].contentData.src || ads[i].contentData);
			html += '" class="ad-item-img"';// + visitedState(ads[i]);
			html += ' onError="this.onerror=null; this.src=\'img/blank.png\';"';
			html += '" alt="ad thumb"></span><span class="title">';
			html +=  ads[i].title ? ads[i].title  : "#" + ads[i].id;
			html += '</span><cite>' + targetDomain(ads[i]) + '</cite></a></li>\n\n';
		}
		else if (ads[i].contentType === 'text') {

			html += '<li id="ad' + ads[i].id +'" class="ad-item-text' + visitedClass(ads[i]);
			html += '""><span class="thumb">Text Ad</span><h3><a target="new" class="title" href="'
			html += ads[i].targetUrl + '">' + ads[i].title + '</a></h3><cite>' + ads[i].contentData.site;
			 if (TEST_APPEND_IDS) html += ' (#'+ads[i].id+')';
			html += '</cite><div class="ads-creative">' + ads[i].contentData.text +'</div></li>\n\n';
		}
	}
	
//console.log("\nHTML\n"+html+"\n\n");

	return html;
}

function byField(prop) {
    var sortOrder = 1;
    if(prop[0] === "-") {
        sortOrder = -1;
        prop = prop.substr(1);
    }
    return function (a,b) {
        var result = (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
        return result * sortOrder;
    }
}

function visitedClass(ad) {

	return ad.visitedTs > 0 ? ' visited' :
		(ad.visitedTs < 0 ? ' failed' : '');
}

/*
 * Start with resolvedTargetUrl if available, else use targetUrl
 * Then extract the last domain from the (possibly complex) url
 */
function targetDomain(ad) {

	var result, url = ad.resolvedTargetUrl || ad.targetUrl;
        domains = extractDomains(url);
	
	if (domains.length)  
	   result = new URL(domains.pop()).hostname;
	else
	   console.warn("ERROR: " + ad.targetUrl, url);
	
	if (result && TEST_APPEND_IDS)
	   result += ' (#'+ad.id+')';
	   
    return result;
}

function extractDomains(fullUrl) {

	var result = [], matches,
		regexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

	while (matches = regexp.exec(fullUrl))
	    result.push(matches[0]);

	return result;
}

function param(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function attachTests() {
    
    //console.log('attachTests()');
    
    function assert(test, exp, msg) {
        msg = msg || 'expecting "' + exp + '", but got';
        console.log((test == exp) ? 'OK' : 'FAIL: ' + msg, test);
    }

	$('#log-button').off('click').click(function() {
		window.location.href = "log.html"
	});

	$('#vault-button').off('click').click(function() {
		window.location.href = "vault.html"
	});

	$('#about-button').off('click').click(function() {
		window.location.href = "https://github.com/dhowe/AdNauseam/wiki/Help"
	});

	$.getJSON(TEST_ADS, function(jsonObj) {

		console.warn("Menu.js :: Loading test-ads: "+TEST_ADS);
	    layoutAds({ data : jsonObj, page : TEST_PAGE });

	}).fail(function(e) { console.warn( "error:", e); });
}

(function() {

	//console.log('Ready: INIT_MENU_HANDLERS');

	$('#log-button').click(function(e) {
		//console.log('#log-button.click');

		self.port && self.port.emit("show-log");
	});

	$('#vault-button').click(function() {
		//console.log('#vault-button.click');

		self.port && self.port.emit("show-vault");
	});

	$('#clear-ads').click(function(e) {

		e.preventDefault(); // no click

		// remove all visible ads from menu
		$('.ad-item').remove();
		$('.ad-item-text').remove();
		
		setCounts(0, 0, 0);

		// trigger closing of settings
		$("#settings-close").trigger("click");

		// call addon to clear simple-storage
		self.port && self.port.emit("clear-ads");
		
		createHtml();
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

		console.log('#settings-open.click');

		$('.page').toggleClass('hide');
		$('.settings').toggleClass('hide');

		self.port && self.port.emit('show-settings');
	});

	$('#about-button').click(function() {

		//console.log('#about-button.click');
		self.port && self.port.emit('show-about');
	});

	$('#cmn-toggle-1').click(function() { // logging

		var val = $(this).prop('checked');

		//console.log('#disable-logs.click: '+val);
		self.port && self.port.emit('disable-logs', { 'value' : val });
	});
	
    $('#cmn-toggle-2').click(function() { // referer

        var val = $(this).prop('checked');

        //console.log('#disable-logs.click: '+val);
        self.port && self.port.emit('disable-referer', { 'value' : val });
    });

})();
