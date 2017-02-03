// This file contains a miscellaneous assortment of functions and variables that greatly assist with various features of the game engine.

var direction = [
	"North",
	"South",
	"East",
	"West",
	"Up",
	"Down"
];

var dir_obj = [
	"to the north",
	"to the south",
	"to the east",
	"to the west",
	"above",
	"below"
];

var dir_char = "nsewud".split("");

// Attempts to find the direction index (0 - 6 -> north - down) from 'str'.
// In most of these functions get that get an index from a string, they will return -1 they can't find the string.
function getDirectionIndex(str) {
	for (var i = 0; i < 6; i++) {
		if (str == direction[i].toLowerCase() || str == dir_char[i]) return i;
	}
	return -1;
};

// Searches the list of combinations of the item in the inventory of index 'idx1' for
// the first one with the 'pair_item' field equal to the name of the item in the inventory of index 'idx2'
function findCombination(inv, idx1, idx2) {
	if (!inv[idx1].combinations) return -1;
	for (var i = 0; i < inv[idx1].combinations.length; i++) {
		if (inv[idx1].combinations[i].pair_item == inv[idx2].item_name) return i;
	}
	return -1;
};

// Searches for the index of an item in the player's inventory using the item's name
function getItemIndex(inv, item_name) {
	for (var i = 0; i < inv.length; i++) {
		if (inv[i] && inv[i].item_name.toLowerCase() == item_name.toLowerCase()) {
			return i;
		}
	}
	return -1;
}

/*
   Similar to 'getItemIndex', only it searches an array of words starting from the index 'offset'
   until it finds the name of an item in your inventory.
   Say for example you type the command "use tomato sauce". This gets split up into ["use", "tomato", "sauce"].
   By default, this function starts from offset 1 of the command array, which is "tomato" in this case.
   First, this function attempts to find "tomato" in your inventory. Failing that, it will then attempt to find "tomato sauce".
   One flaw you may have noticed with this logic is that if you have both a "tomato" item and a "tomato sauce" item in your inventory,
   it will always pick the "tomato" item even if you type "tomato sauce".
   This function returns an array of two elements, the first being the index of the found item and the second being the number of words in the item's name.
*/
function findItem(inv, args, offset) {
	var off = offset || 1;
	if (off < 0) off = 1;
	if (!inv || !args || args.length < off + 1) {
		return [-1, 0];
	}
	if (off >= args.length) off = args.length - 1;

	var n = "";
	var i = 0;
	while (off+i < args.length) {
		if (i > 0) n += " ";
		n += args[off+i];
		var idx = getItemIndex(inv, n);
		if (idx >= 0) return [idx, i+1];
		i++;
	}
	return [-1, 0];
};

// This function iterates over an array and removes elements that it deems empty
function cleanArray(array) {
	var sz = array.length;
	for (var i = 0; i < sz; i++) {
		if (!array[i]) {
			array.splice(i, 1);
			i--;
			sz--;
		}
	}
};

// This takes elements from an array of strings and concatenates them with a space in between.
// 'offset' is used to determine where to start concatenating strings from.
// 'size' specifies the number of elements to concatenate.
function squish(array, offset, size) {
	if (!array || isNaN(offset) || offset < 0 || offset >= array.length) return "";
	if (isNaN(size) || size > array.length - offset) size = array.length - offset;
	var i = 0;
	var str = "";
	while (i < size) {
		if (i > 0) str += " ";
		str += array[offset+i].toString();
		i++;
	}
	return str;
};

// Picks the best prefix for a string based on very simple logic
function getPrefix(str) {
	if (str == null) return " ";
	var s = str.split("");
	if (s[s.length - 1] == 's') return "some ";
	if (s[0] == 'a' || s[0] == 'e' || s[0] == 'i' || s[0] == 'o' || s[0] == 'u') return "an ";
	return "a ";
};

// Returns the pluralised version of a string. Note again how crude (and thus inaccurate in this case) this function is.
function getPlural(str) {
	if (str == null) return "";
	var s = str.split("");
	if (s[s.length - 1] == 's') return str;
	return str + "s";
};

// A room's ID is not necessarily the same thing as its index in the list of the dungeon's rooms.
// This function returns the proper room index from its ID.
function getRoomByID(ID) {
	for (var i = 0; i < rooms.length; i++) {
		if (rooms[i].id == ID) {
			return i;	
		}
	}
	return -1;
};

// This function is called by the 'compare' function inside the actor class, and is used when there is a difference in the new actor's attack and/or defence.
function attdef(new_actor, old_actor, diff, stat) {
	var str = "";
	var verb = "raised";
	if (diff < 0) {
		verb = "lowered";
		diff = -diff;
	}

	return (new_actor.is_player ? "Your " : "The " + new_actor.actor_name + "'s ") + stat + " has been " + verb + " by " + Math.round(diff*10) + "!<br/>";
};

// Pick a random number between 'low' inclusive and 'high' exclusive
function damageRange(low, high) {
	var diff = high - low;
	return low + Math.random() * diff;
};

// Returns a multiplier that is typically used with the 'damageRange' function
function damageBalance(attack, defence) {
	var d = Math.abs(defence);
	if (d < 0.5) d = Math.pow(25, d) / 10; // trust me on this one, it avoids divide by zero errors
	if (defence < 0) d = -d;
	defence = d;
	return attack / defence;
};

/*
   This is the standard function used to determine how much damage an actor will take.
   The value starts off as a random number between 'lowest' and 'highest', before it is
   multiplied by the result of the 'damageBalance' before being rounded to the nearest whole number.
*/
function damageCalc(lowest, highest, defence, attack) {
	var low = lowest || 1;
	var high = highest || 1;
	var def = defence || 1;
	var att = attack || 1;
	return Math.round(Math.floor(damageRange(low, high+1)) * damageBalance(att, def));
};

// This is used as the standard way to upgrade one of the player's stats. It uses the corresponding stat from the enemy actor
// (as well as 'factor') to determine the new value of the player's stat.
this.upgradeStat = function(to_actor, from_actor, stat, factor) {
	if (to_actor[stat] == undefined || from_actor[stat] == undefined) return;
	var s = from_actor[stat];
	factor = factor || 1;
	if (factor <= 0) factor = 1;
	to_actor[stat] += Math.round(s * 10 / factor) / 10;
};

// This runs most of the unique code that triggers when an enemy dies, such as ending the game if the enemy was the final boss
// or appropriately upgrading the player's stats and giving the player the item the enemy drops if it wasn't
function checkEnemy() {
	var l = player.location;
	if (!rooms[l] || !rooms[l].enemy || !rooms[l].enemy.actor) return "";

	var str = "";
	if (rooms[l].enemy.actor.rip) {
		str += (rooms[l].enemy.death || "") + "</br>";

		if (rooms[l].enemy.final_boss) {
			player["victory"] = true;
			str += " YOU WIN!";
		}
		else {
			var pl = player.actor.clone();
			upgradeStat(player.actor, rooms[l].enemy.actor, "max_hp", 4);
			upgradeStat(player.actor, rooms[l].enemy.actor, "attack", 4);
			upgradeStat(player.actor, rooms[l].enemy.actor, "defence", 4);
			player.actor.max_hp = Math.round(player.actor.max_hp);
			str += player.actor.compare(pl);
			str += player.add(rooms[l].enemy.item || null);
		}
		rooms[l].enemy.actor = null;
		rooms[l].enemy = null;
	}
	return str;
};
