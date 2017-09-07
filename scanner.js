'use strict';

// Configuration options.
var siteUrl = "http://snipeit.msec.local:8000";
var apiToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjY5NDFmMTQ1MTk2ZTQ4M2JiM2Q5N2ViZWRhNTAwZWEzMGY4ZGFmODEwMTU5ZjUwMzYzZWI2ZWI2OWY0YzQ4MGMyZmJkYmNjNDM0ZTFlMmUzIn0.eyJhdWQiOiIzIiwianRpIjoiNjk0MWYxNDUxOTZlNDgzYmIzZDk3ZWJlZGE1MDBlYTMwZjhkYWY4MTAxNTlmNTAzNjNlYjZlYjY5ZjRjNDgwYzJmYmRiY2M0MzRlMWUyZTMiLCJpYXQiOjE0OTkxMzc0OTIsIm5iZiI6MTQ5OTEzNzQ5MiwiZXhwIjoxODE0NjcwMjkyLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.nXL-hqofJOdcYh6xuj3Iu0hw_PLgdHaIyS8xmgAy0I-QYgylNXHv2_NQ2gD-NfYMwSpzmixZWzcfnCSHNNSXZYEJK0AU_07-TCrpfOptMxvrgepDOLzAOBJN4JYUW3C20m6Wv88heDetxkMsIO-dW0EwpZubxQnGUi_3jAUROF674MrLZkQcW9mA7f29aBpZ9GSOjg4b3IYNAwq3zmkTTZIxf6lnlx-Mv0QXbtbSkv4XqCNjAOVhWkEqPKggQKGZ0b2Rg5pkdoPXH0VbpTkRzL1bmct3saM514-14NUMWDnkwuUS7wAbf3J49m_A7mjJmZoU0lsiW7Za3iJHUKIJGoj3EaKbp9YEQZepxjqhbPFBHghvAd9G7h8ybOD4CgcDIxsTC73Yb2RRpLa7bipxioDwN-edXps-qyVk34D38icIL7YE2BNpGP5wze3QmrtZX6pkX-QQYhJzPzxnEGfso24MFA_LFSdBaV2DIgx8cWOZqkC7vCXYo60rqR2O7pxK7MhqhnbjOTfTkks4j-dabiq8zpWEjHnwk3xuM5_iOTnwors8uha2xoC6Uzj8EwnQAEhB1CGnpb5AlIJhx0Du7jYH77mlAc6GiC5V-mLjFywwHVtGR1E_Zwbf7h0_DJaKo0mk4l1ZYivPKkwgRR8qp1wRDgnlxc1eUkgn3fHtB2A";
var mainDomElement = "#scanner";

// "Private" global variables. Do not touch.

function initScanner(callback) {
    createTabs();
    initUpdating();
    initCheckIn();
    initCheckOut();

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
}

function initCheckOut() {
    var elem = document.getElementById("Check-out");
    elem.appendChild(createInput());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        getAssetID(elem.querySelectorAll("textarea#inputarea")[0].value, function(callback) {
            checkOutAsset(callback, "Check-out");
        });
    });

    elem.appendChild(submit);
}

function initCheckIn() {
    var elem = document.getElementById("Check-in");
    elem.appendChild(createInput());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        getAssetID(elem.querySelectorAll("textarea#inputarea")[0].value, function(callback) {
            checkInAsset(callback);
        });
    });

    elem.appendChild(submit);
}

function initUpdating() {
    var elem = document.getElementById("Updating");
    elem.appendChild(createInput());
    elem.appendChild(createUsers());

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        getAssetID(elem.querySelectorAll("textarea#inputarea")[0].value, function(callback) {
            checkInAsset(callback);
            checkOutAsset(callback, "Updating");
        });
    });

    elem.appendChild(submit);
}

function createInput() {
    var inputDiv = document.createElement("div");
    inputDiv.className = "input";

    var inputLabel = document.createElement("p");
    inputLabel.innerText = "Barcodes here\nOne per line";

    var inputArea = document.createElement("textarea");
    inputArea.id = "inputarea";
    inputArea.cols = "10";

    inputDiv.appendChild(inputLabel);
    inputDiv.appendChild(inputArea);

    return inputDiv;
}

function createTabs() {
    var tab = "";
    var tabs = ['Check-in', 'Check-out', 'Updating'];

    var tabsDiv = document.createElement("div");
    tabsDiv.className = "tab";

    document.querySelector(mainDomElement).appendChild(tabsDiv);

    for (tab in tabs) {
        var btnDiv = document.createElement("div");
        btnDiv.id = tabs[tab];
        btnDiv.className = "tabcontent";

        var btn = document.createElement("button");
        btn.className = "tablinks";
        btn.innerHTML = tabs[tab];
        btn.addEventListener("click", function() {
            openTab(event, this.innerHTML);
        });
        if (tabs[tab] == "Updating") {
            btn.id = "defaultOpen";
        }

        tabsDiv.appendChild(btn);
        document.querySelector(mainDomElement).appendChild(btnDiv);
    }
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

function getAssetID(inputList, callback) {
    var inputArray = inputList.split('\n');
    var inputID = "";
    if (inputList == "") {
        alert("Need inputs");
        return;
    }
    for (inputID in inputArray) {
        if (inputArray[inputID] == "") {
            continue;
        }
        httpGet("/api/v1/hardware?limit=25&search=" + inputArray[inputID], function(response) {
            if (response.total == 0) {
                console.log("Asset not found");
                continue;
            } else if (response.total > 1) {
                console.log("Too many results, skipping");
                continue;
            }
            var assetID = response.rows[0].id;
            callback(assetID);
        }, function(error) {
            console.log(error.message);
        });
    }
}

function checkInAsset(assetID) {
    var dataObj = {
    };
    httpPost("/api/v1/hardware/" + assetID + "/checkin", dataObj, function(response) {
        console.log(response.messages);
    });
}

function checkOutAsset(assetID, tab) {
    var dataObj = {
        "user_id": document.getElementById(tab).querySelectorAll("#textUser")[0].value
    };
    httpPost("/api/v1/hardware/" + assetID + "/checkout", dataObj, function(response) {
        console.log(response.messages);
    });
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

    getUsers();

    return usersDiv;

}

function getUsers() {
    httpGet("/api/v1/users", function(response) {
        var users = response.rows;
        var elemList = document.querySelectorAll('#textUser');

        elemList.forEach(function(elem) {
            elem.disabled = false;
            users.forEach(function(user) {
                var option = document.createElement("option");
                option.value = user.id;
                option.text = user.name;
                elem.appendChild(option);
            });
            //TODO Sort the list reverse alphabetical
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
