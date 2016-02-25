// when app resume we have to check whether nfc is enabled or disabled
document.addEventListener("resume", function () {
    console.log("operation on resume.." + operation);
    checkNFCStatus(operation);
});

var readDone = true;
var writeDone = true;
var readListenerAdded = false;
var writeListenerAdded = false;
var readTemplate;
var operation;
var supportPage;
var tagRecords;
var serialNumber;
var app = {
    initialize: function () {
        this.bind();
    },
    bind: function () {
        var user = JSON.parse(localStorage.getItem("user"));
        if (user && user.role == "2") {
            $("#userPageTitle").html("User Homepage");
            $("#lockButton").css("display", "none");
            $("#unlockButton").css("display", "none");
            $("#writeButton").css("display", "none");
            $("#eraseDiv").css("display", "none");
            $("#previousTagContents").css("display", "none");
            $("#crossButtonImageForHis").css("display", "none");

        } else {
            $("#userPageTitle").html("Admin Homepage");
        }
        document.addEventListener('deviceready', this.deviceready, false);
    },
    deviceready: function () {
        registerListeners();

    }
}

// registering the nfc event listeners
function registerListeners() {
    try {
        nfc.addTagDiscoveredListener(function (nfcEvent) {
            eventCallback(nfcEvent);
        });
        nfc.addMimeTypeListener("text/pg", function (nfcEvent) {
            eventCallback(nfcEvent);
        });

        nfc.addNdefListener(function (nfcEvent) {
            eventCallback(nfcEvent);
        });
    } catch (e) {
        alert("error in registering.." + e);
    }
}

// function to check the nfc status and do the required action
function checkNFCStatus(op) {
    console.log("going to check the nfc status");
    nfc.enabled(function () {
        console.log("going to check the nfc enabled");
        $(".wrapperloading .loading.up").css({
            "border-top-color": "green",
            "border-bottom-color": "green",
            "border-left-color": "#000",
            "border-right-color": "#000"
        });
        $(".wrapperloading .loading.down").css({
            "border-left-color": "green",
            "border-right-color": "green",
            "border-top-color": "#000",
            "border-bottom-color": "#000"
        });
        if (op == "read") {
            $("#nfcStatus").html('NFC Status : <span style="color:green;font-weight:bold;">Enabled</span>');
            $("#readTagContents").append('<div id="readyToRead">Please place your phone on the NFC tag you want to read.</div>');
        } else if (op == "write") {
            $("#nfcStatus1").html('NFC Status : <span style="color:green;font-weight:bold;">Enabled</span>');
            $("#writeTagContents").append('<div id="readyToWrite"><button onclick="scanSerial1()">Write To Tag</button>.</div>');
        }

    }, function (error) {
        console.log("going to check the nfc error");
        $(".wrapperloading .loading.up").css({
            "border-top-color": "red",
            "border-bottom-color": "red",
            "border-left-color": "#000",
            "border-right-color": "#000"
        });
        $(".wrapperloading .loading.down").css({
            "border-left-color": "red",
            "border-right-color": "red",
            "border-top-color": "#000",
            "border-bottom-color": "#000"
        });
        $("#readyToRead").empty();
        $("#readyToWrite").empty();
        if (op == "read") {
            $("#nfcStatus").html('NFC Status : <span style="color:red;font-weight:bold;">' + error + '</span>');
        } else if (op == "write") {
            $("#nfcStatus1").html('NFC Status : <span style="color:red;font-weight:bold;">' + error + '</span>');
        }
    });
}

// function called when the user wants to read a tag.
function readTagNew() {
    $("#userPageTitle").html("NFC Reader");
    operation = "read";
    var html = '<div id="nfcStatus" style="margin-bottom:290px;margin-top:20px;text-align:center;">NFC Status </div>';
    html += '<div class="readSpinnerBody">'
    html += '<div class="wrapperloading" >';
    html += '<div class="loading up" > </div>';
    html += '<div class="loading down" > </div>';
    html += '</div></div>';
    $("#readTagContents").html(html);
    checkNFCStatus("read");
    $("#operationIcons").css("display", "none");
    $("#writeTagContents").css("display", "none");
    $("#lockTagContents").css("display", "none");
    $("#readTagContents").css("display", "block");
    $("#crossButtonImage").css("display", "block");
    $("#eraseTagContents").css("display", "none");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");
}

//event listeners for different nfc evnet like read , write, lock , unlock and erase.
function eventCallback(nfcEvent) {
    var tag = nfcEvent.tag;
    var records = tag.ndefMessage;
    var length = records ? records.length : 0;
    var array = [];
    for (var i = 0; i < length; i++) {
        array.push(decodePayload(records[i]));
    }
    console.log("array..." + JSON.stringify(array));
    if (operation == "read") {
        try {
            console.log("read alert");
            var newHtml = '';
            for (var i = 0; i < 4; i++) {
                newHtml += '<div class="record">';
                if (i == 0) {
                    newHtml += 'URI:' + array[i];
                } else if (i == 1) {
                    newHtml += 'Message:' + array[i];
                } else if (i == 2) {
                    newHtml += 'Userid:' + array[i];
                } else if (i == 3) {
                    newHtml += 'SerialNumber:' + array[i];
                }
                newHtml += '</div>';
            }
            newHtml += '<br/><div id="viewItemId"><div style="text-align:center;width:100%;margin-bottom:15px;"><button id="pageInfoButton" class="btn btn-danger text-center" onclick="pageInfo()">View Item</button></div></div><br/>';
            console.log("newHtml..." + newHtml);
            $("#readTagContents").html(newHtml);
            $("#readyToRead").hide();
            serialNumber = array[3];
        } catch (e) {
            console.log("error in reading..." + e);
        }
    } else if (operation == "write") {
        if (array[4] == "lock") {
            alert("Tag is Locked.");
        } else {
            var uri = supportPage;
            var message = $("#writePayloadMessage").val() || "";
            var userid = $("#writePayloadUserid").val();
            var message = [
                    ndef.uriRecord(uri),
                    ndef.textRecord(message),
                    ndef.textRecord(userid),
                    ndef.textRecord(serialNumber),
                    ndef.textRecord("unlock")
            ];
            nfc.write(
                message,
                function () {
                    alert("write successfull");
                },
                function (reason) {
                    alert("problem in writing.." + reason);
                }
            );
        }
    } else if (operation == "lock") {
        var password = $("#lockTagPassword").val();
        if (password) {
            if (length && length <= 3) {
                var html = '<input type="password" id="lockTagPassword">'
                html += '<br/><button onclick="lockTagInternal()">Lock Tag</button>'
                $("lockTagContents").html(html);
            }
            if (array[4] == "lock") {
                alert("Tag is already locked");
            } else {
                lockTagInternal(array);
            }
        } else {
            alert("Please enter password to lock");
        }
    } else if (operation == "unlock") {
        var password = $("#lockTagPassword").val();
        if (password) {
            if (array[4] == "unlock") {
                alert("Tag is already unlocked");
            } else if (array[5] != password) {
                alert("Wrong Password");
            } else {
                console.log("calling unlock tag internal");
                unlockTagInternal(array);
            }
        } else {
            alert("Please enter password to unlock");
        }
    } else if (operation == "erase") {
        if (array[4] == "lock") {
            alert("Tag is Locked.");
        } else {
            nfc.erase(function () {
                alert("Tag Data Erased");
            }, function () {
                alert("Error in Erasing Tag Data");
            });
        }
    }
}


// ideally some form of this can move to phonegap-nfc util
function decodePayload(record) {
    var recordType = nfc.bytesToString(record.type),
        payload;

    // TODO extract this out to decoders that live in NFC code
    // TODO add a method to ndefRecord so the helper 
    // TODO doesn't need to do this

    if (recordType === "T") {
        var langCodeLength = record.payload[0],
            text = record.payload.slice((1 + langCodeLength), record.payload.length);
        payload = nfc.bytesToString(text);

    } else if (recordType === "U") {
        var identifierCode = record.payload.shift(),
            uri = nfc.bytesToString(record.payload);

        if (identifierCode !== 0) {
            // TODO decode based on URI Record Type Definition
            console.log("WARNING: uri needs to be decoded");
        }
        //payload = "<a href='" + uri + "'>" + uri + "<\/a>";
        payload = uri;

    } else {

        // kludge assume we can treat as String
        payload = nfc.bytesToString(record.payload);
    }

    return payload;
}

// TODO move to phonegap-nfc util
function tnfToString(tnf) {
    var value = tnf;

    switch (tnf) {
        case ndef.TNF_EMPTY:
            value = "Empty";
            break;
        case ndef.TNF_WELL_KNOWN:
            value = "Well Known";
            break;
        case ndef.TNF_MIME_MEDIA:
            value = "Mime Media";
            break;
        case ndef.TNF_ABSOLUTE_URI:
            value = "Absolute URI";
            break;
        case ndef.TNF_EXTERNAL_TYPE:
            value = "External";
            break;
        case ndef.TNF_UNKNOWN:
            value = "Unknown";
            break;
        case ndef.TNF_UNCHANGED:
            value = "Unchanged";
            break;
        case ndef.TNF_RESERVED:
            value = "Reserved";
            break;
    }
    return value;
}

function crossButton() {
    $("#operationIcons").css("display", "block");
    $("#readTagContents").css("display", "none");
    $("#writeTagContents").css("display", "none");
    $("#crossButtonImage").css("display", "none");
    $("#eraseTagContents").css("display", "none");
    $("#lockTagContents").css("display", "none");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");
    var user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role == "2") {
        $("#userPageTitle").html("User Homepage");
    } else {
        $("#userPageTitle").html("Admin Homepage");
    }
}

// function to enter message while writing data on the tag.
function writeTagData() {
    $("readyToRead").hide();
    $("#userPageTitle").html("NFC Writer");
    operation = "write";
    writeDone = false;
    var html = 'UserId : <input  class="form-control" type="text" id="writePayloadUserid" disabled>';
    html += '<br/>';
    html += 'Uri : <input  class="form-control" type="text" id="writePayloadUri" disabled value=' + supportPage + '>';
    html += '<br/>';
    html += 'Message :<input  class="form-control" type="text" id="writePayloadMessage">';
    html += '<div id="readyToWrite">Please enter a small message you want to save to tag.Once complete lay down your phone on the tag you are writing too.</div>'
    $("#writeTagContents").html(html);
    var user = JSON.parse(localStorage.getItem("user"));
    $("#writePayloadUserid").val(user.id);
}


// function to search the  serial  number entered by the end user.
function searchSerialNumber() {
    serialNumber = $("#serialNumber").val();
    $.post(
        searchSerialNumberUrl, {
            "sn": serialNumber
        },
        function (response) {
            if (response.status == 1) {
                response = response.response;
                supportPage = response.supportPage;
                var html = '<div class="row"><div class="col-sm-6 text-center"><div><h2>Info for Item found.</h2></div>';
                html += '<div><img width="200px" src="images/png.png"></div><br>';
                html += '<button class="btn btn-danger" onclick="writeTagData()">Write to Tag. </button>';
                html += '</div></div>';
                $("#writeTagContents").html(html);
            } else {
                var htmlNotFound = '<div class="row"><div class="col-sm-6 text-center"><div><h2>Item Information Not found.</h2></div>';
                htmlNotFound += '<div><img src="images/crossBig.png"></div><br>';
                htmlNotFound += '<button class="btn btn-danger" onclick="scanSerial()">Return to Search</button>';
                htmlNotFound += '</div></div>';
                $("#writeTagContents").html(htmlNotFound);
            }
        });
}

// function called when the user clicks on the write button on the ui.
// first we have to check whether nfc is enabled or not.
// if enabled then the user should search for a serial number.
function scanSerial() {
    operation = "write";
    $("#userPageTitle").html("NFC Writer");
    var html = '<div id="nfcStatus1" style="margin-bottom:290px;margin-top:20px;text-align:center;">NFC Status </div>';
    html += '<div class="readSpinnerBody">'
    html += '<div class="wrapperloading" >';
    html += '<div class="loading up" > </div>';
    html += '<div class="loading down" > </div>';
    html += '</div></div>';
    $("#writeTagContents").html(html);
    checkNFCStatus("write");
    $("#operationIcons").css("display", "none");
    $("#writeTagContents").css("display", "block");
    $("#crossButtonImage").css("display", "block");
    $("#eraseTagContents").css("display", "none");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");
    $("#lockTagContents").css("display", "none");
}

// internal function called in the process of writing data to a tag.
function scanSerial1() {
    $("#userPageTitle").html("NFC Writer");
    var html = '<div class="col-sm-6 text-center">';
    html += '<div><p>Please enter in the textbox, the serial number of item that you require html link for:<p></div>';
    html += '<div><input class="form-control" type="text" id="serialNumber" /></div><br>';
    html += '<button class="btn btn-danger " onclick="searchSerialNumber()">Search</button>';
    html += '</div>';
    $("#writeTagContents").html(html);
}

// function called when  then user click on the lock button on the ui.
// if the tag is already locked then we alert a message that the tag is already locked otherwise the tag is locked
function lockTag() {
    operation = "lock";
    $("#userPageTitle").html("NFC Tag Lock");
    var html = '<div class="col-sm-6 ">'

    html += '<div><h4>Please enter the password you want</h4><h4> to lock the tag with in the box</h4><h4> provided.Once you have enter the </h4><h4>correct password place your phone on the</h4><h4>  tag. </h4></div>'
    html += '<div class="text-center " style="margin-top:15%">Password:<input type="password" id="lockTagPassword"></div>';
    html += '</div>'
    $("#lockTagContents").html(html);
    $("#operationIcons").css("display", "none");
    $("#lockTagContents").css("display", "block");
    $("#crossButtonImage").css("display", "block");
    $("#writeTagContents").css("display", "none");
    $("#readTagContents").css("display", "none");
    $("#eraseTagContents").css("display", "none");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");
}

// internal function called in the process of locking a tag.
function lockTagInternal(array) {
    var message = [
            ndef.uriRecord(array[0]),
            ndef.textRecord(array[1]),
            ndef.textRecord(array[2]),
            ndef.textRecord(array[3]),
            ndef.textRecord("lock"),
            ndef.textRecord($("#lockTagPassword").val())
        ];
    nfc.write(
        message,
        function () {
            alert("Tag Locked");
        },
        function (reason) {
            alert("problem in writing.." + reason);
        }
    );
}

// function called when  then user click on the unlock button on the ui.
// if the tag is  locked then we prompt the user to enter the password to unlock the tag.if correct password is entered then 
// the tag is unlocked and is ready for writing again.
function unlockTag() {
    operation = "unlock";
    $("#userPageTitle").html("NFC Tag Unlock");
    var html = '<div class="col-sm-6">'
    html += '<div><h4>Please enter the password that was</br> used to lock the tag into the box</br> provided.Once you have entered the</br> correct password place your phone</br> on the tag.</h4></div>'
    html += '<div class="text-center " style="margin-top:15%">Password:<input type="password" id="lockTagPassword"></div></div>';
    $("#lockTagContents").html(html);
    $("#operationIcons").css("display", "none");
    $("#lockTagContents").css("display", "block");
    $("#crossButtonImage").css("display", "block");
    $("#writeTagContents").css("display", "none");
    $("#readTagContents").css("display", "none");
    $("#eraseTagContents").css("display", "none");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");

}

// internal function called in the process of unlocking a tag.
function unlockTagInternal(array) {
    var message = [
            ndef.uriRecord(array[0]),
            ndef.textRecord(array[1]),
            ndef.textRecord(array[2]),
            ndef.textRecord(array[3]),
            ndef.textRecord("unlock")
        ];
    nfc.write(
        message,
        function () {
            alert("Tag Unlocked");
        },
        function (reason) {
            alert("problem in writing.." + reason);
        }
    );
}

// function called when  then user click on the erase button on the ui.
// if the tag is  locked then we prompt the user to enter the password to erase the tag.if correct password is entered then 
// the tag data is erased
function eraseTag() {
    $("#userPageTitle").html("NFC Erase Tag");
    operation = "erase";
    var html = '<div class="container" id="erasePage">'
    html += '<div id="confirmation_div" class="box">'
    html += '<p>Are you sure you want to delete the content of this tag?</p>'
    html += '<span style="float:left;"  class="red" onclick="NoErase()">No</span>'
    html += '<span class="green" onclick="yesErase()">Yes</span>'
    html += '</div> '
    html += '<button id="eraseButton" class = "btn-danger red" style ="padding:10px 20px;display:none;" > Erase Tag </button> </div >';

    $("#eraseTagContents").html(html);
    $("#operationIcons").css("display", "none");
    $("#lockTagContents").css("display", "none");
    $("#crossButtonImage").css("display", "block");
    $("#writeTagContents").css("display", "none");
    $("#readTagContents").css("display", "none");
    $("#eraseTagContents").css("display", "block");
    $("#previousTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");

}

function yesErase() {
    $("#confirmation_div").css("display", "none");
    $("#eraseTagContents").html('<div style="margin-top:120px;">Please place phone down on the tag to erase the tag(Note this can not be done if tag is locked with password) </div>');
}

function NoErase() {
    window.location.href = "admin_homepage.html"
}

// function to show the information related to the serial number stored on a tag.
function pageInfo() {
    $("#pageInfoButton").hide();
    $("#readyToRead").hide();
    $.post(
        "http://work.ayyazzafar.com/inventory_system/mobile/get_item", {
            "sn": serialNumber
        },
        function (response) {
            if (response.status == 1) {
                response.time = new Date();
                var user = JSON.parse(localStorage.getItem("user"));
                if (localStorage.getItem("previouslyViewedTags" + "-" + user.id)) {
                    var previous = JSON.parse(localStorage.getItem("previouslyViewedTags" + "-" + user.id));
                    previous[serialNumber].push(response);
                    localStorage.setItem(("previouslyViewedTags" + "-" + user.id), JSON.stringify(previous));
                } else {
                    var object = {};
                    object[serialNumber] = [response];
                    localStorage.setItem(("previouslyViewedTags" + "-" + user.id), JSON.stringify(object));
                }
                var html = '<div>'
                html += '<div><img src="' + response.response.imgPath + '" width="100%;"/></div>'
                html += '<ul class="list-group text-left">'
                html += '<li class="list-group-item">'
                html += '<strong> Status: </strong> <span id="status">' + response.status + '</span><br>'
                html += '    </li>'
                html += '    <li class="list-group-item">'
                html += '        <strong>Serial Number:</strong> <span id="sn">' + serialNumber + '</span><br>'
                html += '    </li>'
                html += '    <li class="list-group-item">'
                html += '      <strong>Make:</strong> <span id="make">' + response.response.make + '</span><br>'
                html += '   </li>'
                html += '    <li class="list-group-item">'
                html += '        <strong>Model:</strong> <span id="model">' + response.response.model + '</span><br>'
                html += '    </li>'
                html += '    <li class="list-group-item">'
                html += '                            <strong>Item Type:</strong> <span id="itemType">' + response.response.itemType + '</span><br>'
                html += '                            </li>'
                html += '                        <li class="list-group-item">'
                html += '                    <strong>Department:</strong> <span id="department">' + response.response.department + '</span><br>'
                html += '        </li>'
                html += '                <li class="list-group-item">'
                html += '                <strong>Building:</strong> <span id="building">' + response.response.building + '</span><br>'
                html += '        </li>'
                html += '        <li class="list-group-item">'
                html += '                                    <strong>Permanent:</strong> <span id="permanent">' + response.response.permanent + '</span><br>'
                html += '                            </li>'
                html += '                        <li class="list-group-item">'
                html += '                        <strong>Rented:</strong> <span id="rented">' + response.response.rented + '</span><br>'
                html += '                </li>'
                html += '            <li class="list-group-item">'
                html += '            <strong>Due Back:</strong> <span id="dueBack">-</span><br>'
                html += '    </li>'
                html += '                        <li class="list-group-item">'
                html += '                                <strong>Support Page:</strong> <a href="" target="_blank" id="supportPage">' + response.response.supportPage + '</a><br>'
                html += '                        </li>'
                html += '                         <li class="list-group-item">'
                html += '                            <strong>Technical Contact:</strong> <span id="technicalContact">' + response.response.technicalContact + '</span><br>'
                html += '                        </li>'

                html += '                            <li class="list-group-item">'
                html += '                        <strong>Email:</strong> <span id="email">' + response.response.email + '</span><br>'
                html += '            </li>'

                html += '                                    <li class="list-group-item">'
                html += '                                    <strong>Warranty Expiry:</strong> <span id="warrantyExpiry">-' + response.response.warrantyExpiry + '</span><br>'
                html += '                            </li>'

                html += ' <li class="list-group-item">'
                html += '                        <strong>Broken:</strong> <span id="broken">' + response.response.int_broken + '</span><br>'
                html += '            </li>'
                html += '</ul>'
                html += '</div>'
                $("#viewItemId").append(html);
            }
        });
}

// function called when the user clicks on view previous tags 
function previousTags() {
    $("#userPageTitle").html("Previous Viewed Items");
    var user = JSON.parse(localStorage.getItem("user"));
    var data = localStorage.getItem("previouslyViewedTags" + "-" + user.id);
    var html = '';
    if (data) {
        data = JSON.parse(data);
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[0];
            console.log(key);
            var changes = data[key];
            for (var j = 0; j < changes.length; j++) {
                var valueSn = "S No. :" + key;

                html += '<div style="margin-top:15px">';
                html += '<div class="data">';
                html += '<input style="border:0px;" type="text" value="' + valueSn + '" disabled/>';
                var obj = {
                    key: key,
                    index: j
                };
                html += '<span onclick="showTagInfo(\'' + key + '\',' + j + ')"> View Item </span>';
                html += '<input style="border:0px;" type="text" value="Date: ' + changes[j].time.split("T")[0] + '" disabled/>';
                html += '</div></div>';
            }
        }
        html += '<button style="margin-top:15px" type = "button" onclick="clearPreviousItems()" > Clear Previous History </button>';
    }
    console.log("html.." + html);
    $("#previousTagContents").html(html);
    $("#operationIcons").css("display", "none");
    $("#readTagContents").css("display", "none");
    $("#writeTagContents").css("display", "none");
    $("#crossButtonImage").css("display", "block");
    $("#previousTagContents").css("display", "block");
    $("#eraseTagContents").css("display", "none");
    $("#crossButtonImageForHis").css("display", "none");


}


function showTagInfo(serialNumber, index) {

    var user = JSON.parse(localStorage.getItem("user"));
    var data = localStorage.getItem("previouslyViewedTags" + "-" + user.id);
    data = JSON.parse(data);
    var changes = data[serialNumber];
    console.log("changes.." + JSON.stringify(changes[index]));
    var response = changes[index];
    var html = '<div>'
    html += '<div><img src="' + response.response.imgPath + '" width="100%"/></div>'
    html += '<ul class="list-group text-left">'
    html += '<li class="list-group-item">'
    html += '<strong> Status: </strong> <span id="status">' + response.status + '</span><br>'
    html += '    </li>'
    html += '    <li class="list-group-item">'
    html += '        <strong>Serial Number:</strong> <span id="sn">' + serialNumber + '</span><br>'
    html += '    </li>'
    html += '    <li class="list-group-item">'
    html += '      <strong>Make:</strong> <span id="make">' + response.response.make + '</span><br>'
    html += '   </li>'
    html += '    <li class="list-group-item">'
    html += '        <strong>Model:</strong> <span id="model">' + response.response.model + '</span><br>'
    html += '    </li>'
    html += '    <li class="list-group-item">'
    html += '                            <strong>Item Type:</strong> <span id="itemType">' + response.response.itemType + '</span><br>'
    html += '                            </li>'
    html += '                        <li class="list-group-item">'
    html += '                    <strong>Department:</strong> <span id="department">' + response.response.department + '</span><br>'
    html += '        </li>'
    html += '                <li class="list-group-item">'
    html += '                <strong>Building:</strong> <span id="building">' + response.response.building + '</span><br>'
    html += '        </li>'
    html += '        <li class="list-group-item">'
    html += '                                    <strong>Permanent:</strong> <span id="permanent">' + response.response.permanent + '</span><br>'
    html += '                            </li>'
    html += '                        <li class="list-group-item">'
    html += '                        <strong>Rented:</strong> <span id="rented">' + response.response.rented + '</span><br>'
    html += '                </li>'
    html += '            <li class="list-group-item">'
    html += '            <strong>Due Back:</strong> <span id="dueBack">-</span><br>'
    html += '    </li>'
    html += '                        <li class="list-group-item">'
    html += '                                <strong>Support Page:</strong> <a href="" target="_blank" id="supportPage">' + response.response.supportPage + '</a><br>'
    html += '                        </li>'
    html += '                         <li class="list-group-item">'
    html += '                            <strong>Technical Contact:</strong> <span id="technicalContact">' + response.response.technicalContact + '</span><br>'
    html += '                        </li>'

    html += '                            <li class="list-group-item">'
    html += '                        <strong>Email:</strong> <span id="email">' + response.response.email + '</span><br>'
    html += '            </li>'

    html += '                                    <li class="list-group-item">'
    html += '                                    <strong>Warranty Expiry:</strong> <span id="warrantyExpiry">-' + response.response.warrantyExpiry + '</span><br>'
    html += '                            </li>'

    html += ' <li class="list-group-item">'
    html += '                        <strong>Broken:</strong> <span id="broken">' + response.response.int_broken + '</span><br>'
    html += '            </li>'
    html += '</ul>'
    html += '</div>'
    $("#previousTagContents").html(html);
    $("#crossButtonImage").css("display", "none");
    $("#crossButtonImageForHis").css("display", "block");

}

function crossButtonHistory() {
    previousTags();
}

function clearPreviousItems() {
    var user = JSON.parse(localStorage.getItem("user"));
    localStorage.removeItem("previouslyViewedTags" + "-" + user.id);
    $("#previousTagContents").html("");
}
