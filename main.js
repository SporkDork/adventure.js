var player = new Player("Player");
var rooms = [room_1, room_2, room_3];

var commandStr = "";
var commands = [
	"use",
	"combine",
	"items",
	"open",
	"drop",
	"discard",
	"punch",
	"exits",
	"look",
	"inspect",
	"go",
	"n", "north",
	"s", "south",
	"e", "east",
	"w", "west",
	"u", "up",
	"d", "down",
	"clear",
	"help"
];

var commandsInfo = [
	"use &lt;item&gt; - If an enemy is present, the item is used as a weapon, else it is used normally.<br/>" +
		"use &lt;item&gt; &lt;dir&gt; - Use the item on a wall in a particular direction.",
	"combine &lt;item 1&gt; &lt;item 2&gt; - If item 1 and item 2 are in your inventory and can be combined, they will produce a new item.",
	"items - Displays all items in your inventory",
	"open &lt;dir&gt; - If there is a chest accessible in the wall, you will open it and attempt to take the item inside.",
	"drop/discard &lt;item&gt; - Get rid of 1 x &lt;item&gt;.<br/>" +
		"drop/discard &lt;quantity&gt; &lt;item&gt; - Get rid of &lt;quantity&gt; x &lt;item&gt;.",
	"punch - A basic attack that deals some damage to all enemies.<br/>" +
		"punch &lt;dir&gt; - Can be used to break certain types of walls.",
	"exits - Displays all exits to the current room.",
	"look - Look at the room around you.<br/>" +
		"look &lt;dir&gt; - Inspect a wall.<br/>" +
		"look all - Inspect every wall all at once.",
	"inspect - Inspect the enemy in the room, if present.<br/>" +
		"inspect &lt;item&gt; - Speaks for itself, really.",
	"go &lt;dir&gt; - Go to the room in a certain direction.",
	"clear - Clears the text.",
	"help - Displays all commands.<br/>" +
		"help &lt;command&gt; - Displays info about a certain command."
];

// All commands do something, but not all of them are unique, thus this array helps match a command with what it actually does.
var commandsInfoIndex = [0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 11];

function help(args) {
	var str;
	if (args.length < 2) {
		str = "Available commands:<br/>";
		var i;
		for (i = 0; i < commands.length; i++) {
			str += commands[i];
			if (i < commands.length - 1) str += ", ";
			if ((i+1) % 8 == 0) str += "<br/>";
		}
		if (i % 8 != 0) str += "<br/>";
		return str + "For more info on a particular command, type \"help &lt;command&gt;\"";
	}

	if (args[1] == "<command>") {
		return "Replace the word <command> with the name of the actual command you want to know about.";
	}

	var cmd = commands.indexOf(args[1]);
	if (cmd < 0) {
		return "\"" + args[1] + "\" is not a valid command";
	}
	return commandsInfo[commandsInfoIndex[cmd]];
};

function doCommand(commandText, outputArea) {
	if (player.actor.rip) {
		outputArea.innerHTML = "GAME OVER!";
		return;
	}
	else if (player.victory) {
		outputArea.innerHTML = "YOU WIN!";
		return;
	}

	var args = commandText.split(" ");
	var cmd = commands.indexOf(args[0]);
	if (cmd < 0) {
		outputArea.innerHTML = player.invalid_cmd();
		return;
	}
	switch (cmd) {
		case 0: // use
			outputArea.innerHTML = player.use(args) + player.combat();
			break;
		case 1: // combine
			outputArea.innerHTML = player.combine(args) + "<br/>" + player.combat();
			break;
		case 2: // items
			outputArea.innerHTML = player.listItems();
			break;
		case 3: // open
			outputArea.innerHTML = player.openChest(args) + player.combat();
			break;
		case 4: // drop
		case 5: // discard
			outputArea.innerHTML = player.drop(args) + player.combat();
			break;
		case 6: // punch
			outputArea.innerHTML = player.punch(args) + player.combat();
			break;
		case 7: // exits
			outputArea.innerHTML = player.lookForExits();
			break;
		case 8: // look
			outputArea.innerHTML = player.look(args);
			break;
		case 9: // inspect
			outputArea.innerHTML = player.inspect(args) + player.combat();
			break;
		case 10: // go
			if (args.length > 1) outputArea.innerHTML = player.go(args[1]) + player.combat();
			else outputArea.innerHTML = "You need to pick a direction to go in.";
			break;
		case 11: // n
		case 12: // north
		case 13: // s
		case 14: // south
		case 15: // e
		case 16: // east
		case 17: // w
		case 18: // west
		case 19: // u
		case 20: // up
		case 21: // d
		case 22: // down
			outputArea.innerHTML = player.go(args[0]) + player.combat();
			break;
		case 23: // clear
			outputArea.innerHTML = "";
			break;
		case 24: // help
			outputArea.innerHTML = help(args);
			break;
		default:
			outputArea.innerHTML = "Invalid command.";
	}
};

var done = false;

/*
This function is called whenever you press a key in the textbox.
The most important thing it does is send all text in the textbox to the main program when you hit the return key.
It also contains some logic to make entering commands more user-friendly,
such as keeping the last command until you hit a printing character and setting the colour of the previous command to grey.
*/
function keyPress(e) {
	var commandArea = document.getElementById("commandArea");
	var outputArea = document.getElementById("outputArea");

	var key = e.which || e.keyCode || 0;
	if (key == 13) { // If the return key was pressed, do the command
		commandStr = commandArea.value.trim().toLowerCase();
		commandArea.style.color = "rgb(100, 100, 100)";
		doCommand(commandStr, outputArea);
		getStatus();
		done = true;
	}
	// this is some pretty dumb code right here
	else {
		if (key == 8 || (key >= 37 && key <= 40)) { // If the backspace or arrow keys were pressed, allow editing of the previous command
			commandArea.style.color = "black";
			done = false;
		}
		else if (done || key == 46) { // Else erase all characters if the command is old or the delete key was pressed
			commandArea.style.color = "black";
			commandArea.value = "";
			done = false;
		}
	}
	//alert(key);
};

// Gets the status of the player actor and the enemy actor (if present) and places the returned strings in their respective display boxes.
function getStatus() {
	var pl_box = document.getElementById("playerStatus");
	var en_box = document.getElementById("enemyStatus");

	if (player.actor && !player.actor.rip) {
		pl_box.innerHTML = player.actor.getStatus();
	}
	else {
		pl_box.innerHTML = "";
	}

	var l = player.location;
	if (rooms[l] && rooms[l].enemy && rooms[l].enemy.actor) {
		en_box.innerHTML = rooms[l].enemy.actor.getStatus();
	}
	else {
		en_box.innerHTML = "";
	}
};
