
// functions shared between various views

function tagCurrentAd(currentAd) {
    
    //console.log('tagCurrentAd('+currentAd.id+')');
    
    sel = '#ad' + currentAd.id;
    
    if ($(sel).length) {
        
        //console.log("SET CURRENT-AD: ",  $(sel)[0].classList);
        
        //if ($(sel).hasClass('pending')); // need to check its not already visited?
        $(sel).addClass('current-ad').siblings().removeClass('current-ad');
    }
    //else console.log("FAIL ON CURRENT-AD: ",  'No match for: '+sel);
}

function showAlert(msg) {
    
    if (msg) {
        
        $("#alert").removeClass('hide');
        $("#alert p").text(msg);
    }
    else {
        
        $("#alert").addClass('hide');
    }
}

function processAdData(adhash, pageUrl) {

    var ads = toAdArray(adhash), onpage=[],
        ad, unique=0, soFar, hash = {};

    // set hidden val for each ad
    for (var i=0, j = ads.length; i<j; i++) {

        ad = ads[i];
        
        key = hashKey(ad); 
        
        if (!key) {
            
            console.log("*** shared.js::ignore->no key!!!",ad);
            continue;
        }
        
        soFar = hash[key];
        if (!soFar) {

            // new: add a hash entry
            hash[key] = 1;
            ad.hidden = false;

            // update count on this page
            if (pageUrl === ads[i].pageUrl ||
                (typeof testPageUrl != 'undefined' && testPageUrl===ads[i].pageUrl))  // testing
            {
                // TODO: don't count old ads from same url
                // TODO: need to check pageview hash?
                // WORKING HERE ***
                onpage.push(ads[i]);
            }

            // update total (unique) count
            unique++;
        }
        else {
            
            //console.log('processAdData: dup: '+key);

            // dup: update the count
            hash[key]++;
            ad.hidden = true;
        }
    }

    // update the count for each ad from hash
    for (var i=0, j = ads.length; i<j; i++) {

        ad = ads[i];
        ad.count = hash[hashKey(ad)]; // backwards-compat.
 
        // console.log("ad#"+ad.id+" "+ad.count);
    }

    return { ads: ads, onpage: onpage, unique: unique };
}

function hashKey(ad) { // a backwards-compatible hash-key 
    
    if (ad.hashKey) return ad.hashKey; // if we have one, use it
    
    var res = ad.contentData.src || ad.contentData; // otherwise, use what we can
    
    console.warn("[WARN] Deprecated hashKey found for ad#"+ad.id+"\n\t\t"+res);
    
    return res;
}

function toAdArray(adhash, filter) { 

    var all = [], keys = Object.keys(adhash);
    for (var i = 0, j = keys.length; i < j; i++) {

        var ads = adhash[keys[i]];
        for (var k=0; k < ads.length; k++) {

            if (!filter || filter(ads[k]))
                all.push(ads[k]);
        }
    }

    return all;
}

function log(m) { console.log(m); }

