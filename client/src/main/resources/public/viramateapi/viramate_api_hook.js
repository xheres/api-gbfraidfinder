/*  
    * Enable Web API in Viramate options *

    WHAT IT DOES:
        - Allows for join on click
            - Ensure that you have enough EP or nothing will happen if the raid is joinable

    TODO:
        - Possibly less resource intensive add/remove raid refresh

    LATEST UPDATE (28-Jul-17)
        - Now Hides the api.html page (which was secretly below the entire page)
*/ 



// -- Public Variables --
var columns = document.querySelector("div.gbfrf-columns");
var columnList = columns.children;
var raidList = [null];
var raidCode = null;



// -- Viramate API --
var apiUrl = "chrome-extension://fgpokpknehglcioijejfeebigdnbnokj/content/api.html"

var isApiLoaded = false;
var apiLoadedMessageShowned = false;
var apiHost = null;
var pendingRequests = {};
var nextRequestId = 1;

function loadApi()
{
    window.addEventListener("message", onMessage, false);
    tryLoadApi();
};

function tryLoadApi()
{
    console.log("Loading API");

    ifrmApiHost = document.createElement("iframe");
    ifrmApiHost.setAttribute("id", "api_host");
    ifrmApiHost.style.display = 'none';
    document.body.appendChild(ifrmApiHost);

    apiHost = document.querySelector("iframe#api_host");

    apiHost.addEventListener("load", onApiLoaded, false);
    apiHost.src = apiUrl;
	
	
};

function onApiLoaded()
{
    isApiLoaded = true;
    console.log("API Loaded");
    alert("API Loaded");

    document.title = '(API)Granblue Raid Finder';
}

function onMessage (evt)
{
    if(evt.data.type !== "result")
        return;

    if(evt.data.result && evt.data.result.error)
    {
        console.log("Request failed", evt.data.result.error);
        alert("Failed to connect to API: " + evt.data.result.error);
        return;
    }
    else
    {
        console.log("Request responded", evt.data)
        apiLoadedMessageShowned = true;
    }

    var callback = pendingRequests[evt.data.id];
    if(!callback)
        return;

    callback(evt.data.result)
};

function sendApiRequest (request, callback)
{
    if(!isApiLoaded)
    {
        console.log("API not loaded");
        callback({error: "api not loaded"});
        return;
    }

    console.log("Sending request". request);
    var id = nextRequestId++;
    request.id = id;
    pendingRequests[id] = callback;

    apiHost.contentWindow.postMessage
    (
        request,
        "*"
    );
};

function tryJoinRaid()
{
    sendApiRequest({type: "tryJoinRaid", raidCode: raidCode}, function(result)
    {
       console.log("Join Raid: " + raidCode);
    });
};

// -- Click to Join raid --
function refreshRaidList()
{
    // -- Apply to current raid list --
    raidList = [null];
    raidList.splice(0, 1);

    for(var i=0; i<columnList.length; i++)
    {
        raidList.push(columnList[i].children[0].children[2].children[0])
    }

    for(var i=0; i<columnList.length; i++)
    {
        for(var j=0; j<raidList[i].childElementCount; j++)
        {
            raidList[i].children[j].addEventListener("click", function(event)
            {
                raidCode = this.getAttribute("data-raidid");
                if(raidCode != null)
                    tryJoinRaid();
            });
        }
    }


    // -- Mutation Observer --
    // Apply to newly added raids
    var observerList = [];

    for(var i=0; i<columns.childElementCount; i++)
    {
        var observer = new MutationObserver(function(MutationRecord)
        {
            var newRaidAdded = MutationRecord[0].addedNodes;

            newRaidAdded[0].addEventListener("click", function()
            {
                raidCode = this.getAttribute("data-raidid");
                if(raidCode != null)
                    tryJoinRaid();
            });
        });

        observerList.push(observer);
    }

    var config ={ childList: true };

    for(var i=0; i<columns.childElementCount; i++)
        observerList[i].observe(raidList[i], config);
}



// -- Main --
// Load the API
loadApi();

// add sendApiRequest on click
refreshRaidList();

// Mutation Observer for new columns added/removed columns
var columnsObserver = new MutationObserver(function(MutationRecord)
{
   
   // Refresh the whole list (since removing/adding affects the array)
   refreshRaidList();
   console.log("List Refreshed");
});

var config = { childList: true };
columnsObserver.observe(columns, config);