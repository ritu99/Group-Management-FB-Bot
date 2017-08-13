var fb = require("facebook-chat-api");
var mongo = require("mongodb");
var MongoClient = require("mongodb").MongoClient;
var Promise = require("promise");
var url = "mongodb://localhost:27017/gmbot";

var commands = [
  "make [groupname] [tag people in group]",
  "delete [groupname]",
  "add [groupname] [tag people to add]",
  "remove [groupname] [tag people to remove]",
  "rename [groupname] [new groupname]",
  "list [groupname]",
  "listall",
  "count"
];

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
        var body = event.body.trim();
        var words = body.split(/\s+/g);
        // if(event.senderID == '100008605450624'){
        //   fbapi.sendMessage({body: "Aditya is dumb!"}, event.threadID);
        // }
        if(words[0] === '/gmbot' || words[0] === '@gmbot'){
          parseCommand(words, event);
        }else{
          db.collection("groups").find({threadID: event.threadID}).toArray((err, result) => {
            var people = [];
            for (var group of result)
            {
              var name = "@" + group['groupName'];
              if (~body.indexOf(name))
              {
                for (var person of group['people'])
                  if (!~people.indexOf(person))
                    people.push({tag: "Boop!", id: person, fromIndex: people.length * 6});
              }
            }
            if(people.length != 0)
              fbapi.sendMessage({body: "Boop! ".repeat(people.length), mentions: people}, event.threadID);
          });
        }
      }
    });
  });
}


function parseCommand(words, message){
  if (!words[1]) return invalidCommand(null, message);
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
      help(message);
      break;
    case "list":
      list(words, message);
      break;
    case "listall":
      listAll(message);
      break;
    case "count":
      count(message);
      break;
    default:
      invalidCommand(words[1], message);
      break;
  }
}

function invalidCommand(command, message){
  var response = "";
  if (command) response = `Invalid Command ${command}\n`;
  response += "Try @gmbot help for a list of commands";
  fbapi.sendMessage(response, message.threadID);
}

function makeGroup(words, message){
  console.log(message);
  if(words.indexOf("@me") != -1){
    message.mentions = [...message.mentions, message.senderID];
    message.mentions = message.mentions.filter((item, pos) => message.mentions.indexOf(item) == pos);
  }
  if(message.mentions.length < 1){
    return fbapi.sendMessage("You need to tag at least one person in order to make a group", message.threadID);
  }

  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(!result)
      db.collection("groups").insert({threadID: message.threadID, groupName: words[2], people: message.mentions}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " created successfully", message.threadID);
      });
    else
      fbapi.sendMessage("That group already exists!", message.threadID);
  });

  console.log("make");
}

function deleteGroup(words, message){
  db.collection("groups").deleteOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    fbapi.sendMessage("Group " + words[2] + " deleted", message.threadID);
  });
  console.log("delete");
}

function addToGroup(words, message){
  if(words.indexOf("@me") != -1){
    message.mentions = [...message.mentions, message.senderID];
    message.mentions = message.mentions.filter((item, pos) => message.mentions.indexOf(item) == pos);
  }
  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(result){
      var people = [...result['people'], ...message.mentions]
      people = people.filter((item, pos) => people.indexOf(item) == pos);
      db.collection("groups").updateOne({threadID: message.threadID, groupName: words[2]}, {$set: {people: people}}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " updated", message.threadID);
      });
    }
    else
      fbapi.sendMessage("Group " + words[2] + " does not exist", message.threadID);
  });
  console.log("add");
}

function removeFromGroup(words, message){
  if(words.indexOf("@me") != -1){
    message.mentions = [...message.mentions, message.senderID];
    message.mentions = message.mentions.filter((item, pos) => message.mentions.indexOf(item) == pos);
  }
  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(result){
      var people = result['people'];
      people = people.filter((item, pos) => message.mentions.indexOf(item) == -1);
      db.collection("groups").updateOne({threadID: message.threadID, groupName: words[2]}, {$set: {people: people}}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " updated", message.threadID);
      });
    }
    else
      fbapi.sendMessage("Group " + words[2] + " does not exist", message.threadID);
  });
  console.log("remove");
}

function renameGroup(words, message){
  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(result){
      db.collection("groups").updateOne({threadID: message.threadID, groupName: words[2]}, {$set: {groupName: words[3]}}, (err, result) => {
        if(err) throw err;
        fbapi.sendMessage("Group " + words[2] + " renamed to " + words[3], message.threadID);
      });
    }
    else
      fbapi.sendMessage("Group " + words[2] + " does not exist", message.threadID);
  });
  console.log("rename");
}

function help(message){
  var response = "To use gmbot type /gmbot or @gmbot followed by one of the following commands:";
  for (var command of commands)
    response += `\n - ${command}`;
  response += "\n\nGroup names must not contain any spaces";
  response += "\n\nTag a group by using @[groupname]";
  fbapi.sendMessage(response, message.threadID);
}

function list(words, message){
  db.collection("groups").findOne({threadID: message.threadID, groupName: words[2]}, (err, result) => {
    if(err) throw err;
    if(!result) return;
    fbapi.getUserInfo(result['people'], (err, dict) => {
      if(err) throw err;
      var names = "";
      console.log(dict);
      console.log(result['people']);
      for (var person of result['people']) names += dict[person].name + "\n";
      fbapi.sendMessage("@" + words[2] + " members:\n" + names, message.threadID);
    });
  });
}

function listAll(message){
  db.collection("groups").find({threadID: message.threadID}).toArray((err, result) => {
    if(err) throw err;
    var response = "";
    console.log(result);
    if(result.length == 0) response = "No groups for this conversation";
    else {
      response = "All groups:\n";
      for (var group of result){
        var count = group['people'].length;
        response += `@${group['groupName']} (${count} ${count-1 ? 'people' : 'person'})\n`;
      }
    }
    fbapi.sendMessage(response, message.threadID);
  });
}

function count(message)
{
  fbapi.getThreadInfo(message.threadID, (err, info) => {
    if(err) throw err;
    var num = info.messageCount;
    fbapi.sendMessage(`This chat has ${num} message${num-1 ? 's' : ''} (now ${num+1}!)`, message.threadID);
  });
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if(err) console.log(err);
    if (fbapi) fbapi.logout((err) => {
      if(err) console.log(err);
      else console.log("logged out");
      db.close();
      process.exit();
    });
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
