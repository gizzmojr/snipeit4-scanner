/* jshint browser: true, devel: true, esversion: 6 */
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

function initScanner(callback) {

    var page = document.createElement("div");
    page.id = mainDomElement;

    async.parallel([
        loadAPIKey,
        initNav,
        initTabBody,
        initPage
    ],
    function(err, results) {
        console.log("Initialized Page");
    });

//
//    // Get the element with id="defaultOpen" and click on it
//    document.getElementById("defaultOpen").click();
}

function initTabBody(callback) {
    var tabDiv = document.createElement("div");
    tabDiv.id = "tabDiv";
    document.querySelector(mainDomElement).appendChild(tabDiv);

    callback();
}

function initNav(callback) {
    document.querySelector(mainDomElement).appendChild(createTabs());

    // TODO Handle the login button better
    var btnAuth = document.createElement("button");
    btnAuth.id = "btnAuth";
    btnAuth.innerText = "Login";
    btnAuth.type = "button";
    btnAuth.addEventListener("click", function() {
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
    document.querySelector("#nav").appendChild(btnAuth);

    callback();
}

function createTabs(){
    var tabs = document.createElement("div");
    tabs.id = "nav";

    for (var tab in tabsArray) {
        var btnDiv = document.createElement("div");
        btnDiv.id = tabsArray[tab];
        btnDiv.className = "tabcontent";

        var btn = document.createElement("button");
        btn.className = "tabbutton";
        btn.innerHTML = tabsArray[tab];
        btn.addEventListener("click", function(e) {
            openTab(e);
        });

        btnDiv.appendChild(btn);
        tabs.appendChild(btnDiv);
    }

    return tabs;
}

function initPage(callback){
    async.series([
        loadLocations,
        loadStaff,
        createLocationTab,
        // initCheckIn,
        // initLoadList
        createUserTab,
        createCheckIn,
        createLoadList
    ],
    function(err, result) {
        if (err) {
            console.log(err);
        }
    });
    callback();
}

function loadLocations(callback) {
    httpGet(apiPrefix + "/locations?order=asc&sort=name", function(response) {
        var locationNames = response.rows;
        locationNames.forEach(function(location) {
            var locationName = location.name;
            if (locationName === "") {
                return;
            }
            locations.add(locationName);
        });
        callback();
    });
}

function loadStaff(callback){
    httpGet(apiPrefix + "/users?limit=200&order=asc&sort=name", function(response) {
        var userNames = response.rows;
        userNames.forEach(function(user) {
            var usersName = user.name;
            if (usersName === "") {
                return;
            }
            staff.add(usersName);
        });
        callback();
    });
}

function createLocationTab(callback) {
    var tab = "Checkout/Updating (Location)";
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

function createSubmit() {
    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    // submit.addEventListener("click", function() {
    //     doLocation(tabBody, tab); // doTAB or something
    // });

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

    locations.forEach(function(elem) {
        var option = document.createElement("option");
        option.text = elem;
        locationList.appendChild(option);
    });
    locationList.disabled = false;

    locationsDiv.appendChild(locationLabel);
    locationsDiv.appendChild(locationList);

    return locationsDiv;
}

function createLocationTab(callback) {
    var tab = "Checkout/Updating (Location)";
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

function createUserTab(callback) {
    var tab = "Checkout/Updating (User)";
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createOpenUsers());
    elem.appendChild(createStaffList());
    elem.appendChild(createSubmit());

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

    staff.forEach(function(elem) {
        var option = document.createElement("option");
        option.text = elem;
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
    };
}

function checkIfDeployed(assetID, assignedID, callback) {
/*
    0 = not deployed
    1 = deployed, but needs updating
    2 = deployed, already assigned
*/
    httpGet(apiPrefix + "/hardware/" + assetID, function(response, status_callback) {
        if (response.status_label.status_meta == "deployed") {
            if (response.assigned_to.id == assignedID) {
                console.log("\tAlready assigned correctly");
                callback(null, 2);
            } else {
                console.log("\tAlready assigned, updating");
                callback(null, 1);
            };
        } else {
            callback(null, 0);
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

    var modalHeader = document.createElement("h4");
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
    elem.querySelectorAll("#selectList")[0].disabled = true;
    elem.querySelectorAll("#btnSubmit")[0].disabled = true;
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
        //disableInput(elem);
        elem.querySelectorAll("#btnSubmit")[0].disabled = true;
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag)
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            checkInAsset,
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
        elem.querySelectorAll("#btnSubmit")[0].disabled = false;
    });
}

function doLoadList(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    createModal(tab, "Save text as a CSV file");
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
                    if (document.getElementById(tab).querySelectorAll("#category")[0].checked) { itemCSV += "," + response.category.name };
                    if (document.getElementById(tab).querySelectorAll("#make")[0].checked) { itemCSV += "," + response.manufacturer.name };
                    if (document.getElementById(tab).querySelectorAll("#model")[0].checked) { itemCSV += "," + response.model_number };
                    itemCSV += "," + response.serial;
                    var modalContent = document.querySelector(mainDomElement).querySelectorAll("#textmodal")[0];
                    var text = document.createTextNode(itemCSV);
                    modalContent.appendChild(text);
                    modalContent.appendChild(document.createElement("br"));
                    var modal = document.getElementById("modal" + tab);
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
        //enableInput(elem);
    });
}

function doLocation(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    var locationObj = document.getElementById(tab).querySelectorAll("#selectList")[0];
    var locationID = locationObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        disableInput(elem);
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            function(assetID_callback, callback) {
                assetID = assetID_callback; // Update function variable
                callback(null, assetID, locationID);
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
                if (document.getElementById(tab).querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd
                    }

                    if(mm<10) {
                        mm = '0'+mm
                    }

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
        enableInput(elem);
    });
}

function doUser(elem, tab) {
    var assetArray = getAssetIDArray(elem.querySelectorAll("textarea#inputarea")[0].value);
    var userObj = document.getElementById(tab).querySelectorAll("#selectList")[0];
    var userID = userObj.value;
    var assetID = "";
    async.eachOfLimit(assetArray, 1, function(assetTag, index, assetArrayCallback) {
        disableInput(elem);
        async.waterfall([
            function(callback) {
                console.log("Trying asset tag " + assetTag);
                callback(null, assetTag);
            },
            checkBlank,
            getAssetID,
            function(assetID_callback, callback) {
                assetID = assetID_callback; // Update function variable
                callback(null, assetID, userID);
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
                if (document.getElementById(tab).querySelectorAll("#audit")[0].checked) {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    var nextyear = yyyy + 1;

                    if(dd<10) {
                        dd = '0'+dd
                    }

                    if(mm<10) {
                        mm = '0'+mm
                    }

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
                if (document.getElementById(tab).querySelectorAll("#userPage")[0].checked) {
                    window.open(siteUrl + "/users/" + userID + "/print", '_blank');
                }
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
        enableInput(elem);
    });
}

function enableInput(elem) {
    elem.querySelectorAll("#selectList")[0].disabled = false;
    elem.querySelectorAll("#btnSubmit")[0].disabled = false;
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
    var tab = "Check-in";
    var elem = document.createElement("div");
    elem.className = "tab_body";
    elem.id = tab;
    document.getElementById("tabDiv").appendChild(elem);

    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createSubmit());

    callback();
}

function createLoadList(callback) {
    var tab = "Load List";
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
    apiToken = localStorage.getItem("API_Token");
    callback();
}

function openTab(evt) {
    // Get all elements with class="tab_body" and hide them
    var allTabBody = document.getElementsByClassName("tab_body");
    for (let i of allTabBody) {
        i.style.display = "none";
    }

    var en = allTabBody.namedItem(evt.currentTarget.innerText);
    en.style.display = "block";
}

function saveAPIKey(key) {
    localStorage.setItem("API_Token", key.value);
    window.location.reload();
}
