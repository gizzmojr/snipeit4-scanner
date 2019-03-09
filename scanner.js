'use strict';

// Configuration options.
var siteUrl = "http://snipeit";
var apiPrefix = "/api/v1";
var apiToken = "";
var mainDomElement = "#scanner";
var tabsArray = ['Check-in', 'Checkout/Updating (User)', 'Checkout/Updating (Location)', 'Load List'];


// "Private" global variables. Do not touch.
var blankMsg = "\tEmpty value, skipping";

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

function createLocations() {
    var locationsDiv = document.createElement("div");
    locationsDiv.className = "locations";

    var locationLabel = document.createElement("p");
    locationLabel.innerText = "Check-out to the following";

    var locationList = document.createElement("select");
    locationList.id = "selectList";
    locationList.name = "location";
    locationList.disabled = "true";

    locationsDiv.appendChild(locationLabel);
    locationsDiv.appendChild(locationList);

    return locationsDiv;

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
        btn.addEventListener("click", function(e) {
            openTab(e, this.innerHTML);
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
    userList.id = "selectList";
    userList.name = "user";
    userList.disabled = "true";

    usersDiv.appendChild(userLabel);
    usersDiv.appendChild(userList);

    return usersDiv;

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
                    var modalContent = document.getElementById(tab).querySelectorAll("#textmodal")[0];
                    var text = document.createTextNode(itemCSV);
                    modalContent.appendChild(text);
                    modalContent.appendChild(document.createElement("br"));
                    var modal = document.getElementById("csvmodal");
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
                };
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
                };
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
                if (document.getElementById(tab).querySelectorAll("#userPage")[0].checked) {
                    window.open(siteUrl + "/users/" + userID + "/print", '_blank');
                };
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

function getLocations(tab) {
    httpGet(apiPrefix + "/locations", function(response) {
        var locations = response.rows;
        var elemList = tab.querySelectorAll('#selectList');

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

function getUsers(tab) {
    httpGet(apiPrefix + "/users?limit=200", function(response) {
        var users = response.rows;
        var elemList = tab.querySelectorAll('#selectList');

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
            } else if (this.status == 401) {
                alert(obj.error);
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

function initScanner(callback) {
    createTabs();
    initLocation();
    initUser();
    initCheckIn();
    initLoadList();

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
}

function initCheckIn() {
    var tab = "Check-in";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createAudit());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doCheckin(elem, tab);
    });

    elem.appendChild(submit);
}

function initLoadList() {
    var tab = "Load List";
    var elem = document.getElementById(tab);
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

    var divModal = document.createElement("div");
    divModal.className = "modal";
    divModal.id = "csvmodal";


    var contentModal = document.createElement("div");
    contentModal.className = "modal-content";
    var contentText = document.createElement("p");
    contentText.id = "textmodal";
    contentModal.appendChild(contentText);
    divModal.appendChild(contentModal);

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.innerText = "Close";
    modalClose.addEventListener("click", function() {
        var modal = document.getElementById("csvmodal");
        modal.style.display = "none";
    });
    contentModal.appendChild(modalClose);

    elem.appendChild(extraFieldsDiv);
    elem.appendChild(addCategory);
    elem.appendChild(addMake);
    elem.appendChild(addModel);
    elem.appendChild(submit);
    elem.appendChild(divModal);
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
    getLocations(elem);
}

function initUser() {
    var tab = "Checkout/Updating (User)";
    var elem = document.getElementById(tab);
    elem.appendChild(createInput());
    elem.appendChild(createAudit());
    elem.appendChild(createOpenUsers());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        doUser(elem, tab);
    });

    elem.appendChild(submit);
    getUsers(elem);
}

function openTab(e, tabName) {
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
    e.currentTarget.className += " active";
}
