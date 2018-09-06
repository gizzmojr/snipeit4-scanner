'use strict';

// Configuration options.
var siteUrl = "http://snipeit.msec.local";
var apiPrefix = "/api/v1";
var apiToken = "";
var mainDomElement = "#scanner";
var tabsArray = ['Check-in', 'Checkout/Updating (User)', 'Checkout/Updating (Location)'];


// "Private" global variables. Do not touch.
var blankMsg = "\tEmpty value, skipping";

function checkBlank(assetTag, callback) {
    if (assetTag == "") {
        callback(blankMsg);
    } else {
        callback(null, assetTag);
    };
}

function checkIfDeployed(assetID, callback) {
    httpGet(apiPrefix + "/hardware/" + assetID, function(response, status_callback) {
        var statusMeta = response.status_label.status_meta;
        if (statusMeta == "deployed") {
            console.log("\tNeed to check in first");
            checkInAsset(assetID, function() {
                callback(null);
            });
        } else {
            callback(null);
        }
    });
}

function checkInAsset(assetID, callback) {
    var dataObj = {
    };
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkin", dataObj, function() {
        console.log("\tChecked in " + assetID);
        callback(null);
    });
}

function checkOutAsset(assetID, dataObj, callback) {
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkout", dataObj, function() {
        console.log("\tChecked out " + assetID);
        callback(null);
    });
}

function createAudit() {
    var auditDiv = document.createElement("div");
    auditDiv.className = "audit";
    var auditLabel = document.createElement("p");
    auditLabel.innerText = "Update audit date? (1yr)";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "audit";
    checkbox.checked = true;
    checkbox.id = "audit";

    auditDiv.appendChild(auditLabel);
    auditDiv.appendChild(checkbox);

    return auditDiv;
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
    var locationsDiv = document.createElement("div");
    locationsDiv.className = "locations";

    var locationLabel = document.createElement("p");
    locationLabel.innerText = "Check-out to the following";

    var locationList = document.createElement("select");
    locationList.id = "textLocation";
    locationList.name = "location";
    locationList.disabled = "true";

    locationsDiv.appendChild(locationLabel);
    locationsDiv.appendChild(locationList);

    return locationsDiv;

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
        if (tabsArray[tab] == "Checkout/Updating (Location)") {
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

function doAudit(dataObj, callback) {
    httpPost(apiPrefix + "/hardware/audit", dataObj, function() {
        console.log("\tAsset marked for audit at " + dataObj.next_audit_date);
        callback(null);
    });
}

function doCheckin(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag)
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            checkInAsset,
            function(callback) {
                callback(null, "Done");
            }
        ], function(error, result) {
            if (error === blankMsg) {
                // Just to break out of waterfall
                console.log(error);
                error = undefined;
            } else if (error) {
                console.log(error);
            } else {
                console.log(result);
            };
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            elem.querySelectorAll("textarea#inputarea")[0].value = "";
            console.log("Done everything, cleared inputs");
        }
    });
}

function doLocation(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    var locationObj = document.getElementById(tab).querySelectorAll("#textLocation")[0];
    var locationID = locationObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            function(assetID_callback, callback) {
                assetID = assetID_callback; // Update function variable
                callback(null, assetID);
            },
            checkIfDeployed,
            function(callback) {
                var dataObj = {
                    "id": assetID,
                    "checkout_to_type": "location",
                    "assigned_location": locationID
                };
                checkOutAsset(assetID, dataObj, callback);
            },
            function(callback) {
                if (document.getElementById(tab).querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd
                    };

                    if(mm<10) {
                        mm = '0'+mm
                    };

                    var dataObj = {
                        "asset_tag": assetTag,
                        "note": "",
                        "location_id": locationID,
                        "next_audit_date": nextyear + "-" + mm + "-" + dd
                    };
                    doAudit(dataObj, callback);
                } else {
                    callback(null)
                }
            },
            function(callback) {
                callback(null, "Done");
            }
        ], function(error, result) {
            if (error === blankMsg) {
                // Just to break out of waterfall
                console.log(error);
                error = undefined;
            } else if (error) {
                console.log(error);
            } else {
                console.log(result);
            };
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            elem.querySelectorAll("textarea#inputarea")[0].value = "";
            console.log("Done everything, cleared inputs");
        }
    });
}

function doUser(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    var userObj = document.getElementById(tab).querySelectorAll("#textUser")[0];
    var userID = userObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            function(assetID_callback, callback) {
                assetID = assetID_callback; // Update function variable
                callback(null, assetID);
            },
            checkIfDeployed,
            function(callback) {
                var dataObj = {
                    "id": assetID,
                    "checkout_to_type": "user",
                    "assigned_user": userID
                };
                checkOutAsset(assetID, dataObj, callback);
            },
            function(callback) {
                if (document.getElementById(tab).querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd
                    };

                    if(mm<10) {
                        mm = '0'+mm
                    };

                    var dataObj = {
                        "asset_tag": assetTag,
                        "note": "",
                        "next_audit_date": nextyear + "-" + mm + "-" + dd
                    };
                    doAudit(dataObj, callback);
                } else {
                    callback(null)
                }
            },
            function(callback) {
                callback(null, "Done");
            }
        ], function(error, result) {
            if (error === blankMsg) {
                // Just to break out of waterfall
                console.log(error);
                error = undefined;
            } else if (error) {
                console.log(error);
            } else {
                console.log(result);
            };
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            elem.querySelectorAll("textarea#inputarea")[0].value = "";
            console.log("Done everything, cleared inputs");
        }
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
    initLocation();
    initUser();
    initCheckIn();

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
        doCheckin(elem, tab);
    });

    elem.appendChild(submit);
}

function initLocation() {
    var tab = "Checkout/Updating (Location)";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createLocations());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doLocation(elem, tab);
    });

    elem.appendChild(submit);
}

function initUser() {
    var tab = "Checkout/Updating (User)";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doUser(elem, tab);
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
