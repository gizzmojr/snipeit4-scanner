'use strict';

// Configuration options.
var siteUrl = "http://snipeit.msec.local";
var apiPrefix = "/api/v1";
var apiToken = "";
var mainDomElement = "#scanner";
var tabsArray = ['Check-in', 'Check-out', 'Updating (User)', 'Updating (Location)'];


// "Private" global variables. Do not touch.

function checkInAsset(assetID, callback) {
    var dataObj = {
    };
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkin", dataObj, function(response) {
        callback(null);
    });
}

function checkOutAsset(assetID, dataObj, callback) {
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkout", dataObj, function(response) {
        callback(null);
    });
}

function createInput() {
    var inputDiv = document.createElement("div");
    inputDiv.className = "input";

    var inputLabel = document.createElement("p");
    inputLabel.innerText = "Barcodes here\nOne per line";

    var inputArea = document.createElement("textarea");
    inputArea.id = "inputarea";
    inputArea.cols = "10";
    inputArea.rows = "10";

    inputDiv.appendChild(inputLabel);
    inputDiv.appendChild(inputArea);

    return inputDiv;
}

function createLocations() {
    var usersDiv = document.createElement("div");
    usersDiv.className = "locations";

    var userLabel = document.createElement("p");
    userLabel.innerText = "Check-out to the following";

    var userList = document.createElement("select");
    userList.id = "textLocation";
    userList.name = "location";
    userList.disabled = "true";

    usersDiv.appendChild(userLabel);
    usersDiv.appendChild(userList);

    return usersDiv;

}

function createTabs() {
    var tabsDiv = document.createElement("div");
    tabsDiv.className = "tab";

    document.querySelector(mainDomElement).appendChild(tabsDiv);

    for (var tab in tabsArray) {
        var btnDiv = document.createElement("div");
        btnDiv.id = tabsArray[tab];
        btnDiv.className = "tabcontent";

        var btn = document.createElement("button");
        btn.className = "tablinks";
        btn.innerHTML = tabsArray[tab];
        btn.addEventListener("click", function() {
            openTab(event, this.innerHTML);
        });
        if (tabsArray[tab] == "Updating (Location)") {
            btn.id = "defaultOpen";
        }

        tabsDiv.appendChild(btn);
        document.querySelector(mainDomElement).appendChild(btnDiv);
    }

}

function createUsers() {
    var usersDiv = document.createElement("div");
    usersDiv.className = "users";

    var userLabel = document.createElement("p");
    userLabel.innerText = "Check-out to the following";

    var userList = document.createElement("select");
    userList.id = "textUser";
    userList.name = "user";
    userList.disabled = "true";

    usersDiv.appendChild(userLabel);
    usersDiv.appendChild(userList);

    return usersDiv;

}

function doCheckin(assetID, callback) {
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkin", function(response) {
        callback(null);
    });
}

function getAssetID(assetTag, callback) {
    httpGet(apiPrefix + "/hardware?search=" + assetTag, function(response) {
        if (response.total == 0 || response.total > 1) {
            callback("Invalid tag " + assetTag);
        } else {
            callback(null, response.rows[0].id);
        }
    });
}

function getAssetIDArray(inputList) {
    var inputArray = inputList.split('\n');
    if (inputList == "") {
        alert("Need inputs");
        return;
    } else {
        return inputArray;
    }
}

function getLocations() {
    httpGet(apiPrefix + "/locations", function(response) {
        var locations = response.rows;
        var elemList = document.querySelectorAll('#textLocation');

        locations.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });

        elemList.forEach(function(elem) {
            elem.disabled = false;
            locations.forEach(function(loc) {
                var option = document.createElement("option");
                option.value = loc.id;
                option.text = loc.name;
                elem.appendChild(option);
            });
        });
    });
}

function getUsers() {
    httpGet(apiPrefix + "/users", function(response) {
        var users = response.rows;
        var elemList = document.querySelectorAll('#textUser');

        users.sort();
        users.reverse();

        elemList.forEach(function(elem) {
            elem.disabled = false;
            users.forEach(function(user) {
                var option = document.createElement("option");
                option.value = user.id;
                option.text = user.name;
                elem.appendChild(option);
            });
        });
    });
}

function httpGet(url, successCallback, errorCallback) {
    httpRequest("GET", url, "", successCallback, errorCallback);
}

function httpPost(url, dataObj, successCallback, errorCallback) {
    httpRequest("Post", url, dataObj, successCallback, errorCallback);
}

function httpPatch(url, dataObj, successCallback, errorCallback) {
    httpRequest("Patch", url, dataObj, successCallback, errorCallback);
}

function httpRequest(method, url, dataObj, successCallback, errorCallback) {
    var payload = false;
    if (dataObj !== "") {
        payload = dataObj;
    }
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.onreadystatechange = function() {
        if (this.readyState == this.DONE) {
            var response = this.responseText;
            if (response === "") {
                var msg = "No response for request " + url;
                console.warn(msg);
                return;
            }

            var obj = JSON.parse(response);
            if (this.status == 200) {
                return successCallback(obj);
            }

            if (obj.error !== null) {
                console.error(obj.message);

                if (errorCallback !== undefined) {
                    errorCallback(obj);
                } else {
                    alert(obj.message);
                }
            }
        }
    };

    xhr.open(method, siteUrl + url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", 'Bearer ' + apiToken);
    xhr.send(JSON.stringify(payload));
}
function initScanner(callback) {
    createTabs();
    initUpdatingLocation();
    initUpdatingUser();
    initCheckIn();
    initCheckOut();

    getLocations();
    getUsers();

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
}

function initCheckIn() {
    var tab = "Check-in";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
        for (var asset in assetArray) {
            var assetTag = assetArray[asset];
            if (assetTag == "") { continue };
            async.waterfall([
                function(callback) {
                    console.log("Trying asset tag " + assetTag)
                    callback(null, assetTag);
                },
                getAssetID,
                checkInAsset,
                function(callback) {
                    elem.querySelectorAll("textarea#inputarea")[0].value = "";
                }
            ], function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        }
    });

    elem.appendChild(submit);
}

function initCheckOut() {
    var tab = "Check-out";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
        for (var asset in assetArray) {
            var assetTag = assetArray[asset];
            if (assetTag == "") { continue };
            async.waterfall([
                function(callback) {
                    console.log("Trying asset tag " + assetTag)
                    callback(null, assetTag);
                },
                getAssetID,
                function(assetID, callback) {
                    var dataObj = {
                        "user_id": document.getElementById(tab).querySelectorAll("#textUser")[0].value
                    };
                    callback(null, assetID, dataObj);
                },
                checkOutAsset,
                function(callback) {
                }
            ], function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        }
        elem.querySelectorAll("textarea#inputarea")[0].value = "";
    });

    elem.appendChild(submit);
}

function initUpdatingLocation() {
    var tab = "Updating (Location)";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createLocations());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
        var locationObj = document.getElementById(tab).querySelectorAll("#textLocation")[0];
        var locationID = locationObj.value;
        var assetID = "";
        var assetTag = "";
        for (var asset in assetArray) {
            assetTag = assetArray[asset];
            if (assetTag == "") { continue };
            async.waterfall([
                // Console message
                function(callback) {
                    console.log("Trying asset tag " + assetTag);
                    console.log("Using location " + locationObj[locationObj.selectedIndex].text);
                    callback(null, assetTag);
                },
                // Retrieve the asset ID
                getAssetID,
                // Check if item is already 'deployed'
                function checkCheckout(assetIDcallback, callback) {
                    assetID = assetIDcallback; // update function global var
                    httpGet(apiPrefix + "/hardware/" + assetID, function(response) {
                        callback(null, response);
                    });
                },
                // What to do based on response of deployed state
                function(response, callback) {
                    var statusMeta = response.status_label.status_meta;
                    if (statusMeta == "deployed") {
                        console.log("Need to check in");
                        checkInAsset(assetID, function() {
                            callback(null);
                        });
                    } else {
                        console.log("Already checked out");
                        callback(null);
                    }
                },
                // checkout for location based
                function(callback) {
                    var dataObj = {
                        "id": assetID,
                        "checkout_to_type": "location",
                        "assigned_location": locationID
                    };
                    checkOutAsset(assetID, dataObj, callback);
                },
                function(callback) {
                    callback(null, 'All done with ' + assetTag);
                }
            ], function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        }
        elem.querySelectorAll("textarea#inputarea")[0].value = "";
    });

    elem.appendChild(submit);
}

function initUpdatingUser() {
    var tab = "Updating (User)";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
        for (var asset in assetArray) {
            var assetTag = assetArray[asset];
            if (assetTag == "") { continue };
            async.waterfall([
                function(callback) {
                    console.log("Trying asset tag " + assetTag)
                    callback(null, assetTag);
                },
                getAssetID,
                checkInAsset,
                function(assetID, callback) {
                    var dataObj = {
                        "user_id": document.getElementById(tab).querySelectorAll("#textUser")[0].value
                    };
                    callback(null, assetID, dataObj);
                },
                checkOutAsset,
                function(callback) {
                    elem.querySelectorAll("textarea#inputarea")[0].value = "";
                }
            ], function(error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        }
    });

    elem.appendChild(submit);
}

function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}
