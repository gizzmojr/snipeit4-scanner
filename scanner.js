'use strict';

// Configuration options.
var siteUrl = "http://snipeit.msec.local:8000";
var apiToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjY5NDFmMTQ1MTk2ZTQ4M2JiM2Q5N2ViZWRhNTAwZWEzMGY4ZGFmODEwMTU5ZjUwMzYzZWI2ZWI2OWY0YzQ4MGMyZmJkYmNjNDM0ZTFlMmUzIn0.eyJhdWQiOiIzIiwianRpIjoiNjk0MWYxNDUxOTZlNDgzYmIzZDk3ZWJlZGE1MDBlYTMwZjhkYWY4MTAxNTlmNTAzNjNlYjZlYjY5ZjRjNDgwYzJmYmRiY2M0MzRlMWUyZTMiLCJpYXQiOjE0OTkxMzc0OTIsIm5iZiI6MTQ5OTEzNzQ5MiwiZXhwIjoxODE0NjcwMjkyLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.nXL-hqofJOdcYh6xuj3Iu0hw_PLgdHaIyS8xmgAy0I-QYgylNXHv2_NQ2gD-NfYMwSpzmixZWzcfnCSHNNSXZYEJK0AU_07-TCrpfOptMxvrgepDOLzAOBJN4JYUW3C20m6Wv88heDetxkMsIO-dW0EwpZubxQnGUi_3jAUROF674MrLZkQcW9mA7f29aBpZ9GSOjg4b3IYNAwq3zmkTTZIxf6lnlx-Mv0QXbtbSkv4XqCNjAOVhWkEqPKggQKGZ0b2Rg5pkdoPXH0VbpTkRzL1bmct3saM514-14NUMWDnkwuUS7wAbf3J49m_A7mjJmZoU0lsiW7Za3iJHUKIJGoj3EaKbp9YEQZepxjqhbPFBHghvAd9G7h8ybOD4CgcDIxsTC73Yb2RRpLa7bipxioDwN-edXps-qyVk34D38icIL7YE2BNpGP5wze3QmrtZX6pkX-QQYhJzPzxnEGfso24MFA_LFSdBaV2DIgx8cWOZqkC7vCXYo60rqR2O7pxK7MhqhnbjOTfTkks4j-dabiq8zpWEjHnwk3xuM5_iOTnwors8uha2xoC6Uzj8EwnQAEhB1CGnpb5AlIJhx0Du7jYH77mlAc6GiC5V-mLjFywwHVtGR1E_Zwbf7h0_DJaKo0mk4l1ZYivPKkwgRR8qp1wRDgnlxc1eUkgn3fHtB2A";
var mainDomElement = "#scanner";

// "Private" global variables. Do not touch.

function initScanner() {
    initPage();
}

function initPage(callback) {

    var inputs = document.createElement("div");
    inputs.className = "options";
    document.querySelector(mainDomElement).appendChild(inputs);

    var locationLabel = document.createElement("label");
    locationLabel.innerText = "Locations";

    var locationList = document.createElement("select");
    locationList.id = "textLocation";
    locationList.name = "location";
    locationList.disabled = "true";

    locationLabel.appendChild(locationList);

    var userLabel = document.createElement("label");
    userLabel.innerText = "Users";

    var userList = document.createElement("select");
    userList.id = "textUser";
    userList.name = "user";
    userList.disabled = "true";

    userLabel.appendChild(userList);

    var submit = document.createElement("button");
    submit.id = "btnSubmit";
    submit.innerText = "Submit";
    submit.type = "button";
    submit.addEventListener("click", function() {
        getAssetID("A-0001", function(callback) {
        checkInAsset(callback);
        checkOutAsset(callback);
        });
    });

    inputs.appendChild(locationLabel);
    inputs.appendChild(userLabel);
    inputs.appendChild(submit);

    loadLocations();
    loadUsers();
}

function getAssetID(textSearch, callback) {
    httpGet("/api/v1/hardware?search=" + textSearch, function(response) {
        var assetID = response.rows[0].id;
        callback(assetID);
    }, function(error) {
        alert(error.message);
    });
}

function checkInAsset(assetID) {
    var dataObj = {
    };
    httpPost("/api/v1/hardware/" + assetID + "/checkin", dataObj, function(response) {
        console.log(response.messages);
    });
}

function checkOutAsset(assetID) {
    var dataObj = {
        "user_id": document.getElementById("textUser").value
    };
    httpPost("/api/v1/hardware/" + assetID + "/checkout", dataObj, function(response) {
        console.log(response.messages);
    });
}

function loadLocations(callback) {
    httpGet("/api/v1/locations", function(response) {
        //document.getElementById("textLocation").disabled = false;
        var locations = response.rows;

        locations.forEach(function(location) {
            var option = document.createElement("option");
            option.value = location.name;
            option.text = location.name;
            document.getElementById("textLocation").appendChild(option);
        });
    });
}

function loadUsers(callback) {
    httpGet("/api/v1/users", function(response) {
        document.getElementById("textUser").disabled = false;
        var users = response.rows;

        users.forEach(function(user) {
            var option = document.createElement("option");
            option.value = user.id;
            option.text = user.id + "-" + user.name;
            document.getElementById("textUser").appendChild(option);
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
