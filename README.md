# Group Management FB Messenger Bot
The Group Manager Bot (or gmbot) provides extra functionality to group chats on Facebook Messenger. It uses a designated Facebook account to respond to commands given in the chat.
<br><br>
gmbot is built in node.js and relies on an [unofficial FB chat api](https://github.com/Schmavery/facebook-chat-api)

## Features
* Create tagging groups to tag multiple friends at one time

## Commands
Command | Usage
--- | ---
make [groupname] [tag people in group] | Create a new tagging group out of tagged people
delete [groupname] | Delete a tagging group
add [groupname] [tag people to add] | Add people to a tagging group
remove [groupname] [tag people to remove] | Remove people from a tagging group
rename [groupname] [new groupname] | Rename a tagging group
list [groupname] | List all of the people in a tagging group
listall | List the names of every tagging group
help | View help page containing every command
...@[groupname]... | @Mention a tagging group to ping all of its members
