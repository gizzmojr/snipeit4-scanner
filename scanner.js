'use strict';

// Configuration options.
var siteUrl = "http://snipeit";
var apiToken = "";
var tabsArray = ['Check-in', 'Checkout/Updating (User)', 'Checkout/Updating (Location)', 'Load List'];


// "Private" global variables. Do not touch.
var blankMsg = "\tEmpty value, skipping";
var apiPrefix = "/api/v1";
var mainDomElement = "#scanner";
var locations = new Set();
var staff = new Set();
var notifyUsers = [];
var version = "0.2"

function initScanner(callback) {

    var page = document.createElement("div");
    page.id = mainDomElement;

    async.series([
        loadAPIKey,
        initNav,
        checkAuth,
        initTabBody,
        initPage
    ],
    function(err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log("Initialized Page");
            // console.log(results);
        }
    });

//
//    // Get the element with id="defaultOpen" and click on it
//    document.getElementById("defaultOpen").click();
}

function initTabBody(callback) {
    var tabDiv = document.createElement("div");
    tabDiv.id = "tabDiv";
    document.querySelector(mainDomElement).appendChild(tabDiv);

    callback(null, "Initialized Body");
}

function initNav(callback) {
    document.querySelector(mainDomElement).appendChild(createTabs());
    callback(null, "Initialized Nav");
}

function checkAuth(callback) {
    httpGet(apiPrefix + "/hardware/1", function(response) {
        if (response.serial != '') {
            document.getElementById("login").innerHTML = "";
            callback(null, "Authenticated");
        }
    }, function(error) {
        document.getElementById("actions").innerHTML = "";
        callback("Not authorized");
    });
}

function createTabs() {
    var options = document.createElement("div");
    options.id = "cssmenu";
    var ulist = document.createElement("ul");

    // Home
    var home = document.createElement("li");
    home.id = "home";
    var link = document.createElement("a");
    link.href = "#";
    var span = document.createElement("span");
    span.innerText = "Home";
    link.addEventListener("click", function() {
        closeAction();
    });

    link.appendChild(span);
    home.appendChild(link);
    ulist.appendChild(home);

    // Actions Menu
    var actions = document.createElement("li");
    actions.id = "actions";
    actions.className = "has-sub";
    var actionUList = document.createElement("ul");
    link = document.createElement("a");
    link.href = "#";
    span = document.createElement("span");
    span.innerText = "Actions";

    link.appendChild(span);
    actions.appendChild(link);
    actions.appendChild(actionUList);
    ulist.appendChild(actions);

    // Action List
    for (var tab in tabsArray) {
        var actionLi = document.createElement("li");
        actionLi.id = tabsArray[tab];
        link = document.createElement("a");
        link.href = "#";
        span = document.createElement("span");
        span.innerText = tabsArray[tab];
        link.addEventListener("click", function(e) {
            openAction(e);
        });

        link.appendChild(span);
        actionLi.appendChild(link);
        actionUList.appendChild(actionLi);
    }

    // Settings
    // var settings = document.createElement("li");
    // settings.id = "settings";
    // link = document.createElement("a");
    // link.href = "#";
    // span = document.createElement("span");
    // span.innerText = "Settings";
    //
    // link.appendChild(span);
    // settings.appendChild(link);
    // ulist.appendChild(settings);

    // Login
    var login = document.createElement("li");
    login.id = "login";
    link = document.createElement("a");
    link.href = "#";
    span = document.createElement("span");
    span.innerText = "Login";
    link.addEventListener("click", function() {
        createModal("", "Store API Key");
        var modalContent = document.getElementById("textmodal");
        var inputAPI = document.createElement("textarea");
        inputAPI.id = "textAPI";
        inputAPI.cols = "50";
        inputAPI.rows = "10";

        var btnSave = document.createElement("button");
        btnSave.id = "btnSave";
        btnSave.innerText = "Save";
        btnSave.type = "button";
        btnSave.addEventListener("click", function() {
            saveAPIKey(document.getElementById("textAPI"));
        });

        modalContent.appendChild(inputAPI);
        modalContent.appendChild(btnSave);
    });

    link.appendChild(span);
    login.appendChild(link);
    ulist.appendChild(login);

    // End
    options.appendChild(ulist);

    return options;
}

function initPage(callback){
    async.series([
        loadLocations,
        loadStaff,
        createLocationTab,
        createUserTab,
        createCheckIn,
        createLoadList
    ],
    function(err, result) {
        if (err) {
            console.log(err);
        }
    });
    callback(null, "Done");
}

function loadLocations(callback) {
    httpGet(apiPrefix + "/locations?order=asc&sort=name", function(response) {
        var locationNames = response.rows;
        locationNames.forEach(function(location) {
            var option = new Set();
            if (option === "") {
                return;
            }
            option.text = location.name;
            option.value = location.id;
            locations.add(option);
        });
        callback();
    });
}

function loadStaff(callback){
    httpGet(apiPrefix + "/users?limit=200&order=asc&sort=name", function(response) {
        var userNames = response.rows;
        userNames.forEach(function(user) {
            var option = new Set();
            if (option === "") {
                return;
            }
            option.value = user.id;
            option.text = user.name;
            staff.add(option);
        });
        callback();
    });
}

function createLocationTab(callback) {
    var tab = tabsArray[3];
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createLocationsList());
    elem.appendChild(createSubmit());

    callback();
}

function createSubmit(tab) {
    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doTab(tab);
    });

    return submit;
}

function createLocationsList() {
    var locationsDiv = document.createElement("div");
    locationsDiv.className = "locations";

    var locationLabel = document.createElement("p");
    locationLabel.innerText = "Check-out to the following";

    var locationList = document.createElement("select");
    locationList.className = "selectList";
    locationList.disabled = true;

    locations.forEach(function(set) {
        var option = document.createElement("option");
        option.text = set.text;
        option.value = set.value;
        locationList.appendChild(option);
    });
    locationList.disabled = false;

    locationsDiv.appendChild(locationLabel);
    locationsDiv.appendChild(locationList);

    return locationsDiv;
}

function createLocationTab(callback) {
    var tab = tabsArray[2];
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createLocationsList());
    elem.appendChild(createSubmit(tab));

    callback();
}

function createUserTab(callback) {
    var tab = tabsArray[1];
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createOpenUsers());
    elem.appendChild(createStaffList());
    elem.appendChild(createSubmit(tab));

    callback();
}

function createOpenUsers() {
    var userPageDiv = document.createElement("div");
    userPageDiv.className = "userPage";
    var userPageLabel = document.createElement("p");
    userPageLabel.innerText = "Open users page?";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "userPage";
    checkbox.checked = true;
    checkbox.id = "userPage";

    userPageDiv.appendChild(userPageLabel);
    userPageDiv.appendChild(checkbox);

    return userPageDiv;
}

function createStaffList() {
    var usersDiv = document.createElement("div");
    usersDiv.className = "users";

    var userLabel = document.createElement("p");
    userLabel.innerText = "Check-out to the following";

    var userList = document.createElement("select");
    userList.className = "selectList";
    userList.disabled = true;

    staff.forEach(function(set) {
        var option = document.createElement("option");
        option.text = set.text;
        option.value = set.value;
        userList.appendChild(option);
    });
    userList.disabled = false;

    usersDiv.appendChild(userLabel);
    usersDiv.appendChild(userList);

    return usersDiv;
}

function checkBlank(assetTag, callback) {
    if (assetTag == "") {
        callback(blankMsg);
    } else {
        callback(null, assetTag);
    }
}

function checkIfDeployed(searchAssetCallback, compareID, callback) {
/*
    0 = not deployed
    1 = deployed, but needs updating
    2 = deployed, already assigned
*/
    if (searchAssetCallback.status_label.status_meta == "deployed") {
        if (searchAssetCallback.assigned_to.id == compareID) {
            console.log("\tAlready assigned correctly");
            callback(null, 2);
        } else {
            console.log("\tAlready assigned, updating");
            if (searchAssetCallback.assigned_to.type == "user") {
                notifyUsers.push(searchAssetCallback.assigned_to.id);
            }
            callback(null, 1);
        }
    } else {
        callback(null, 0);
    }
}

function checkInAsset(assetID, callback) {
    var dataObj = {
    };
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkin", dataObj, function(response) {
        if (response.status == "error") {
            callback(response.messages);
            return;
        }
        console.log("\tChecked in " + assetID);
        callback(null);
    });
}

function checkOutAsset(assetID, dataObj, callback) {
    httpPost(apiPrefix + "/hardware/" + assetID + "/checkout", dataObj, function(response) {
        if (response.status == "error") {
            callback(response.messages);
            return;
        }
        console.log("\tChecked out " + assetID);
        callback(null);
    });
}

function createAudit() {
    var auditDiv = document.createElement("div");
    auditDiv.className = "checkbox";
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

function createModal(name, textHeader) {
    var divModal = document.createElement("div");
    divModal.className = "modal";
    divModal.id = "modal" + name;

    var modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    var contentModal = document.createElement("div");
    contentModal.className = "modal-content";
    var contentText = document.createElement("p");
    contentText.id = "textmodal";

    modalHeader = document.createElement("h4");
    modalHeader.innerText = textHeader;

    contentModal.appendChild(modalHeader);
    contentModal.appendChild(contentText);

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.innerText = "Close";
    modalClose.addEventListener("click", function() {
        var modal = document.querySelector(".modal");
        if (modal !== null) {
            modal.remove();
        }
    });
    contentModal.appendChild(modalClose);
    divModal.appendChild(contentModal);
    divModal.style.display = "block";

    document.querySelector(mainDomElement).appendChild(divModal);
}

function disableInput(elem) {
    elem.querySelectorAll("select.selectList")[0].disabled = true;
    elem.querySelectorAll("button#btnSubmit")[0].disabled = true;
}

function doAudit(dataObj, callback) {
    httpPost(apiPrefix + "/hardware/audit", dataObj, function() {
        console.log("\tAsset marked for audit at " + dataObj.next_audit_date);
        callback(null);
    });
}

function doTab(tab) {
    switch (tab) {
        case tabsArray[0]:
            doCheckin(tab);
            break;
        case tabsArray[1]:
            doUser(tab);
            break;
        case tabsArray[2]:
            doLocation(tab);
            break;
        case tabsArray[3]:
            doLoadList(tab);
            break;
    }
}

function doCheckin(tab) {
    var currentTabElements;
    var assetID;
    var elems = document.getElementById("tabDiv").querySelectorAll(".tab_body");
    for (var i in elems) {
        if (elems[i].style.display != "none") { // Find the only active one
            currentTabElements = elems[i];
            break;
        }
    }
    var assetArray = getAssetIDArray(currentTabElements.querySelectorAll("textarea#inputarea")[0].value);
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        //disableInput(elem);
        currentTabElements.querySelectorAll("#btnSubmit")[0].disabled = true;
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            searchAsset,
            function(searchAssetCallback, callback) {
                assetID = searchAssetCallback.id;
                callback(null, searchAssetCallback, 0); // zero to force checkIfDeployed condition 1
            },
            checkIfDeployed,
            function(deployedState, callback) {
                if (deployedState > 0) {
                    callback(null, assetID);
                } else {
                    callback("OK");
                }
            },
            checkInAsset,
            function(callback) {
                if (currentTabElements.querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd;
                    }

                    if(mm<10) {
                        mm = '0'+mm;
                    }

                    var dataObj = {
                        "asset_tag": assetTag,
                        "note": "",
                        "next_audit_date": nextyear + "-" + mm + "-" + dd
                    };
                    doAudit(dataObj, callback);
                } else {
                    callback(null);
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
            } else if (error === "OK") {
                console.log("Asset already checked-in");
                error = undefined;
            } else if (error) {
                console.log(error);
            } else {
                console.log(result);
            }
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            // Clean up
            currentTabElements.querySelectorAll("textarea#inputarea")[0].value = "";
            printUserPages(currentTabElements);
            console.log("Done everything, cleared inputs");
        }
        currentTabElements.querySelectorAll("#btnSubmit")[0].disabled = false;
    });
}

function doLoadList(tab) {
    var currentTabElements;
    var elems = document.getElementById("tabDiv").querySelectorAll(".tab_body");
    for (var i in elems) {
        if (elems[i].style.display != "none") { // Find the only active one
            currentTabElements = elems[i];
            break;
        }
    }

    var assetArray = getAssetIDArray(currentTabElements.querySelectorAll("textarea#inputarea")[0].value);
    createModal(tabsArray[3], "Save text as a CSV file");
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        //disableInput(elem);
        async.waterfall([
            function(callback) {
                console.log("Reading asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            function(assetTag, callback) {
                httpGet(apiPrefix + "/hardware/bytag/" + assetTag, function(response) {
                    var itemCSV = assetTag;
                    if (currentTabElements.querySelectorAll("#category")[0].checked) { itemCSV += "," + response.category.name; }
                    if (currentTabElements.querySelectorAll("#make")[0].checked) { itemCSV += "," + response.manufacturer.name; }
                    if (currentTabElements.querySelectorAll("#model")[0].checked) { itemCSV += "," + response.model_number; }
                    itemCSV += "," + response.serial;
                    var modalContent = document.querySelector(mainDomElement).querySelectorAll("#textmodal")[0];
                    var text = document.createTextNode(itemCSV);
                    modalContent.appendChild(text);
                    modalContent.appendChild(document.createElement("br"));
                    var modal = document.getElementById("modal" + tabsArray[3]);
                    modal.style.display = "block";

                    callback(null);
                });
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
            }
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            currentTabElements.querySelectorAll("textarea#inputarea")[0].value = "";
            console.log("Done everything, cleared inputs");
        }
        //enableInput(elem);
    });
}

function doLocation(tab) {
    var currentTabElements;
    var elems = document.getElementById("tabDiv").querySelectorAll(".tab_body");
    for (var i in elems) {
        if (elems[i].style.display != "none") { // Find the only active one
            currentTabElements = elems[i];
            break;
        }
    }

    var assetArray = getAssetIDArray(currentTabElements.querySelectorAll("textarea#inputarea")[0].value);
    var locationObj = currentTabElements.querySelectorAll("select.selectList")[0];
    var locationID = locationObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        disableInput(currentTabElements);
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            searchAsset,
            function(searchAssetCallback, callback) {
                assetID = searchAssetCallback.id;
                callback(null, searchAssetCallback, locationID);
            },
            checkIfDeployed,
            function(deployedState, callback) {
                var dataObj = {
                    "id": assetID,
                    "checkout_to_type": "location",
                    "assigned_location": locationID
                };
                switch(deployedState) {
                    case 0:
                        checkOutAsset(assetID, dataObj, callback);
                        break;
                    case 1:
                        checkInAsset(assetID, function() {
                            checkOutAsset(assetID, dataObj, callback);
                        });
                        break;
                    case 2:
                        callback(null);
                }
            },
            function(callback) {
                if (currentTabElements.querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd;
                    }

                    if(mm<10) {
                        mm = '0'+mm;
                    }

                    var dataObj = {
                        "asset_tag": assetTag,
                        "note": "",
                        "location_id": locationID,
                        "next_audit_date": nextyear + "-" + mm + "-" + dd
                    };
                    doAudit(dataObj, callback);
                } else {
                    callback(null);
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
            }
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            // Clean up
            currentTabElements.querySelectorAll("textarea#inputarea")[0].value = "";
            console.log("Done everything, cleared inputs");
        }
        enableInput(currentTabElements);
    });
}

function doUser(tab) {
    var currentTabElements;
    var elems = document.getElementById("tabDiv").querySelectorAll(".tab_body");
    for (var i in elems) {
        if (elems[i].style.display != "none") { // Find the only active one
            currentTabElements = elems[i];
            break;
        }
    }

    var assetArray = getAssetIDArray(currentTabElements.querySelectorAll("textarea#inputarea")[0].value);
    var userObj = currentTabElements.querySelectorAll("select.selectList")[0];
    var userID = userObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        disableInput(currentTabElements);
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            searchAsset,
            function(searchAssetCallback, callback) {
                assetID = searchAssetCallback.id;
                callback(null, searchAssetCallback, userID);
            },
            checkIfDeployed,
            function(deployedState, callback) {
                var dataObj = {
                    "id": assetID,
                    "checkout_to_type": "user",
                    "assigned_user": userID
                };
                switch(deployedState) {
                    case 0:
                        checkOutAsset(assetID, dataObj, callback);
                        break;
                    case 1:
                        checkInAsset(assetID, function() {
                            checkOutAsset(assetID, dataObj, callback);
                        });
                        break;
                    case 2:
                        callback(null);
                }
            },
            function(callback) {
                if (currentTabElements.querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd;
                    }

                    if(mm<10) {
                        mm = '0'+mm;
                    }

                    var dataObj = {
                        "asset_tag": assetTag,
                        "note": "",
                        "next_audit_date": nextyear + "-" + mm + "-" + dd
                    };
                    doAudit(dataObj, callback);
                } else {
                    callback(null);
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
            }
            assetArrayCallback(error, result);
        });
    }, function(error, result) {
        if (error) {
            console.log("Fatal - Stopped checking");
            alert("Something went wrong\nCheck console for error");
        } else {
            // Clean up
            currentTabElements.querySelectorAll("textarea#inputarea")[0].value = "";
            notifyUsers.push(userID);
            printUserPages(currentTabElements);

            console.log("Done everything, cleared inputs");
        }
        enableInput(currentTabElements);
    });
}

function enableInput(elem) {
    elem.querySelectorAll("select.selectList")[0].disabled = false;
    elem.querySelectorAll("button#btnSubmit")[0].disabled = false;
}

function searchAsset(assetTag, callback) {
    httpGet(apiPrefix + "/hardware/bytag/" + assetTag, function(response) {
        if (response.id <= 0) {
            callback("Invalid tag " + assetTag);
        } else {
            callback(null, response);
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
                alert(msg);
                return;
            }

            var obj = JSON.parse(response);
            if (this.status == 200) {
                return successCallback(obj);
            } else if (this.status == 401) {
                alert(obj.error);
                if (errorCallback !== undefined) {
                    errorCallback(obj.error);
                }
                return;
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

function createCheckIn(callback) {
    var tab = tabsArray[0];
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createOpenUsers());
    elem.appendChild(createAudit());
    elem.appendChild(createSubmit(tab));

    callback();
}

function createLoadList(callback) {
    var tab = tabsArray[3];
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());

    var extraFieldsDiv = document.createElement("div");
    extraFieldsDiv.className = "outputfields";
    var extraFieldsLabel = document.createElement("p");
    extraFieldsLabel.innerText = "Add the following to the output?";
    extraFieldsDiv.appendChild(extraFieldsLabel);

    var addCategory = document.createElement("div");
    addCategory.className = "checkbox";
    var checkboxCategory = document.createElement("input");
    checkboxCategory.type = "checkbox";
    checkboxCategory.name = "category";
    checkboxCategory.checked = true;
    checkboxCategory.id = "category";
    var labelCategory = document.createElement("p");
    labelCategory.innerText = "Category";
    addCategory.appendChild(checkboxCategory);
    addCategory.appendChild(labelCategory);

    var addMake = document.createElement("div");
    addMake.className = "checkbox";
    var checkboxMake = document.createElement("input");
    checkboxMake.type = "checkbox";
    checkboxMake.name = "make";
    checkboxMake.checked = true;
    checkboxMake.id = "make";
    var labelMake = document.createElement("p");
    labelMake.innerText = "Make";
    addMake.appendChild(checkboxMake);
    addMake.appendChild(labelMake);

    var addModel = document.createElement("div");
    addModel.className = "checkbox";
    var checkboxModel = document.createElement("input");
    checkboxModel.type = "checkbox";
    checkboxModel.name = "model";
    checkboxModel.checked = true;
    checkboxModel.id = "model";
    var labelModel = document.createElement("p");
    labelModel.innerText = "Model";
    addModel.appendChild(checkboxModel);
    addModel.appendChild(labelModel);

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doLoadList(elem, tab);
    });

    elem.appendChild(extraFieldsDiv);
    elem.appendChild(addCategory);
    elem.appendChild(addMake);
    elem.appendChild(addModel);
    elem.appendChild(submit);

    callback();
}

function loadAPIKey(callback) {
    if (apiToken != "") {
        callback(null, "Load API Key");
    } else {
        apiToken = localStorage.getItem("API_Token");
        callback(null, "Load API Key");
    }
}

function openAction(evt) {
    // Get all elements with class="tab_body" and hide them
    var allTabBody = document.getElementsByClassName("tab_body");
    for (let i of allTabBody) {
        i.style.display = "none";
    }

    var en = allTabBody.namedItem(evt.currentTarget.innerText);
    en.style.display = "block";
}

function closeAction(evt) {
    // Get all elements with class="tab_body" and hide them
    var allTabBody = document.getElementsByClassName("tab_body");
    for (let i of allTabBody) {
        i.style.display = "none";
    }
}

function saveAPIKey(key) {
    localStorage.setItem("API_Token", key.value);
    window.location.reload();
}

function printUserPages(currentTabElements) {
    // Get list without duplicates
    var uniqueUserList = Array.from(new Set(notifyUsers));

    if (currentTabElements.querySelectorAll("#userPage")[0].checked) {
        if (uniqueUserList.length > 1) {
            window.alert("Opening user pages including whom the assets were assigned to");
        }
        uniqueUserList.forEach(function(user) {
            window.open(siteUrl + "/users/" + user + "/print", '_blank');
        });
    }
    notifyUsers = [];
}
