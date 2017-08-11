var fb = require("facebook-chat-api");
var mongo = require("mongodb");
var MongoClient = require("mongodb").MongoClient;
var Promise = require("promise");
var url = "mongodb://localhost:27017/gmbot";

var db;

MongoClient.connect(url, (err, d) => {
    if(err) throw err;
    db = d;
    db.collection("login").findOne({}, (err, result) => {
      if (err) throw err;
      login(result.username, result.password);
    });
});

var fbapi;
function login(username, password){
  fb({email: username, password: password}, (err, api) => {
    fbapi = api;
    api.listen((err, event) => {
      if(event.type === "message"){
        console.log(event.mentions);
        var body = event.body.trim();
        var words = body.split(/\s+/g);
        if(words[0] === '/gmbot' || words[0] === '@gmbot'){
          parseCommand(words, event);
        }
      }
    });
  });
}


function parseCommand(words, message){
  if (!words[1]) return help("Invalid Command - try one of these: ", message);
  switch (words[1].toLowerCase()){
    case "make":
      makeGroup(words, message);
      break;
    case "delete":
      deleteGroup(words, message);
      break;
    case "add":
      addToGroup(words, message);
      break;
    case "remove":
      removeFromGroup(words, message);
      break;
    case "rename":
      renameGroup(words, message);
      break;
    case "help":
      help("", message);
      break;
    default:
      help("Invalid Command " + words[1] +" - try one of these: ", message);
      break;
  }
}

function makeGroup(words, message){
  console.log(message);
  if(message.mentions.length < 2){
    return fbapi.sendMessage("You need to tag two or more people in order to make a group", message.threadID);
  }

  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(!result)
      db.collection("groups").insert({threadID: message.threadID, groupName: words[2], people: message.mentions}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " created successfully", message.threadID);
      });
    else
      fbapi.sendMessage("You need to tag two or more people in order to make a group", message.threadID);
  });

  console.log("make");
}

function deleteGroup(words, message){
  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(!result)
      db.collection("groups").insert({threadID: message.threadID, groupName: words[2], people: message.mentions}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " created successfully", message.threadID);
      });
    else
      fbapi.sendMessage("You need to tag two or more people in order to make a group", message.threadID);
  });
  console.log("delete");
}

function addToGroup(words, message){
  console.log("add");
}

function removeFromGroup(words, message){
  console.log("remove");
}

function renameGroup(words, message){
  console.log("rename");
}

function help(info, message){
  console.log("help" + " " + info);
  fbapi.sendMessage(info + "\n\nTo use gmbot simply type /gmbot or @gmbot followed by one of the following commands:"
                    + "\n - make [groupname] [tag people in group]"
                    + "\n - delete [groupname]"
                    + "\n - add [groupname] [tag people to add to group]"
                    + "\n - remove [groupname] [tag people to remove from group]"
                    + "\n - rename [groupname] [new groupname]"
                    + "\n\nGroup names must not contain any spaces", message.threadID)
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (fbapi) fbapi.logout((err) => {
      if(err) console.log(err);
      else console.log("logged out");
      process.exit();
    });
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
