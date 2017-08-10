var fb = require("facebook-chat-api");
var db = require("mongodb");


fb({email: "EMAIL", password: "PASSWORD"}, (err, api) => {
  api.listen((err, event) => {
    if(event.type === "message"){
      var body = event.body.trim();
      var words = body.split(/\s+/g);
      if(words[0] === '/gmbot' || words[0] === '@gmbot'){

      }
    }
  });
});


function parseCommand(words, message){
  if (!words[1]) return help("Invalid Command - try one of these:");

  switch words[1].toLowerCase(){
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
      help();
      break;
    default:
      help("Invalid Command - try one of these:");
      break;
  }
}
