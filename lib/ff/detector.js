var Ci = require("chrome").Ci;

require("sdk/system/events").on("http-on-modify-request",  onModifyRequest);
require("sdk/system/events").on("http-on-examine-response", onExamineResponse);

var pageMod = require("sdk/page-mod");
pageMod.PageMod({
    
    include: "*", // All DOM windows (ie. all pages + all iframes)
    
    contentScriptWhen: "start", // page starts loading, at this point you have
                                // the head of the document and no more
    attachTo: 'top',
    onAttach: function onAttach(worker) {
        
            if (worker.tab.url == worker.url) {// test if at top level (!iframe)
                
                console.log("NEW-PAGE: "+worker.tab.url);
            }
                
            // cleanup the attached worker
            worker.destroy();
        }
    }
);



function onModifyRequest(event) {

	var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel), 
       url = httpChannel.URI.spec, origUrl = httpChannel.originalURI.spec;

	if (isAdnWorker(event)) {
		
		require("./abpcomp").Component.parser.visitor.beforeLoad(httpChannel, event.subject, url, origUrl);
	}
}

function onExamineResponse(event) {
	
	var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel), 
        url = httpChannel.URI.spec, origUrl = httpChannel.originalURI.spec;
	
	if (isAdnWorker(event))  {
		 
		require("./abpcomp").Component.parser.visitor.afterLoad(httpChannel, event.subject, url, origUrl);
	}
}

function isAdnWorker(event) {

    var cHandler, win = windowForRequest(event.subject);
	
	if (win) cHandler = win.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShell)
		.chromeEventHandler;
		
	return (cHandler && cHandler.hasAttribute("ADN"));
}

function windowForRequest(request) {

	if (request instanceof Ci.nsIRequest) {
		try {
			if (request.notificationCallbacks) {
				return request.notificationCallbacks.getInterface
					(Ci.nsILoadContext).associatedWindow;
			}
		} catch(e) {}

		try {
			if (request.loadGroup && request.loadGroup.notificationCallbacks) {
				return request.loadGroup.notificationCallbacks.getInterface
					(Ci.nsILoadContext).associatedWindow;
			}
		} catch(e) {}
	}
	else {
		
		console.warn("request !instanceof Ci.nsIRequest!");
	}

	return null;
}
