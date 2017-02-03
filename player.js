// As you can see by the file size, this is where the bulk of the game's logic resides.
// The functions linked to all of the commands are all found within this Player class, for better or worse.

var Player = function(player_name) {
	this.actor = new Actor(100, 1, 1, player_name);
	this.actor["is_player"] = true;
	this.location = 0;
	this.inventory = [];
	this.n_items = 0;

	// These are the list of randomly selected phrases that are returned when you enter an invalid command.
	// In hindsight, perhaps insulting the player for something as innocent as a typo may not have been the best way to retain their interest.
	this.inv_cmd_list = [
		"Nice command you typed there. Too bad it doesn't do anything.",
		"If you're just using this textbox to mash the keyboard, there's no point in playing this game.",
		"Look, this is a pretty simple game. It knows less words than a parrot. Try typing \"help\" if you're desperate.",
		"blah blah blah words words words<br/>Try dumbing it down a little.",
		"What is this strange command you have typed? What does it mean?",
		"Hey, guess what? Invalid command.",
		"The only problem with your command? It's undefined."
	];

	this.invalid_cmd = function() {
		var idx = Math.floor(Math.random() * this.inv_cmd_list.length);
		return this.inv_cmd_list[idx];
	};

	// This function adds an item to your inventory. Sadly, it is not a command that allows you get any item you want.
	// It is instead called when either you get an item out of chest, or you get an item drop after defeating an enemy.
	this.add = function(item, drop) {
		if (!item) return "";

		var idx = getItemIndex(this.inventory, item.item_name);
		if (idx < 0) {
			if (this.inventory.length >= 10) {
				return "You don't have any space left in your inventory.";
			}

			if (!item.quantity) item["quantity"] = 1;
			this.inventory.push(item);

			var str = drop ? "The enemy dropped " : "You pick up ";
			if (item.quantity > 1) {
				return str + item.quantity + " " + item.item_name + "s.";
			}
			str += getPrefix(item.item_name) + item.item_name + "!";
			if (drop) str += "That'll come in handy!";
			return str;
		}
		else {
			this.inventory[idx].quantity += item.quantity;
			var str = drop ? "The enemy dropped " : "You add another ";
			if (item.quantity > 1) {
				str += item.quantity + " " + item.item_name + "s";
			}
			else {
				str += item.item_name;
			}

			if (drop) str += "! You add " + item.quantity > 1 ? "them" : "it" + " to your collection!";
			else str += " to your inventory.";

			return str;
		}
	};

	// This function drops a certain amount of a certain item from your inventory. It is used by the 'drop/discard', 'combine' and 'use' functions.
	// If the amount being dropped is greater than or equal to the quantity you already have have of that item, the item is completely removed from your inventory.
	// Else, it will simply subtract that amount from the quantity of the item.
	// If the item is to removed from the inventory completely:
	// If 'shuffle' is true delete the item so that other items can fill the space, reducing the number of items by one.
	// Else, replace the item with a null so that it doesn't affect the indices of the other items.
	// Note that this function ignores the 'durable' attribute of the given item.
	this.discard = function(idx, amount, shuffle) {
		var sh = shuffle == undefined ? true : false;
		if (idx < 0) return;
		if (!this.inventory[idx]) {
			if (sh) this.inventory.splice(idx, 1);
			return;
		}

		if (this.inventory[idx].quantity) {
			this.inventory[idx].quantity -= amount;
			if (this.inventory[idx].quantity < 0) this.inventory[idx].quantity = 0;
		}
		if (!this.inventory[idx].quantity) {
			if (sh) this.inventory.splice(idx, 1);
			else this.inventory[idx] = null;
		}
	};

	// This function is invoked by the 'drop/discard' command. It allows dropping more than one of a particular item.
	// When dropping an item, it checks to see if it was taken from a chest.
	// If so, it puts the item in the chest the item was retrieved from, regardless of what room you're currently in.
	this.drop = function(args) {
		if (args.length < 2) {
			return "What is it that you wish to " + args[0] + "?";
		}
		var neg_str = "";
		var amount = 1;
		var offset = 1;
		if (!isNaN(args[1])) {
			amount = parseInt(args[1]);
			if (amount < 0) { // If the amount entered was negative, you would have ended up with more items than you started with!
				neg_str = "Nice try!<br/>";
				amount = 0; // Let's just not drop anything, just to be safe.
			}
			offset = 2;
		}

		var item = findItem(this.inventory, args, offset);
		if (item[0] < 0) { // If the item can't be found
			var fail = true;
			if (offset == 2) {
				fail = false;
				var last = args[args.length-1].split("");
				if (last[last.length-1] == 's') last.pop();
				args[args.length-1] = last.join("");
				item = findItem(this.inventory, args, offset);
				if (item[0] < 0) fail = true;
			}
			if (fail) {
				var name = squish(args, offset);
				return "You can't seem to be able to find " + getPrefix(name) + name + " in your inventory.";
			}
		}

		var idx = item[0];
		var item_name = this.inventory[idx].item_name;

		var quantity = 1;
		if (!this.inventory[idx].quantity) this.inventory[idx]["quantity"] = 1;
		else quantity = this.inventory[idx].quantity;

		var l = this.inventory[idx].loc;
		var w = this.inventory[idx].wall;
		if (amount > 0 && l != undefined && w != undefined && rooms[l].wall[w].chest) {
			if (!rooms[l].wall[w].chest.item) {
				rooms[l].wall[w].chest.item = {};
				for (var attr in this.inventory[idx]) {
					rooms[l].wall[w].chest.item[attr] = this.inventory[idx][attr];
				}
				rooms[l].wall[w].chest.item.quantity = 0;
			}
			rooms[l].wall[w].chest.item.quantity += amount;
		}

		this.discard(idx, amount, true);

		if (amount > quantity) {
			return "You don't even have " + amount + " " + getPlural(item_name) + "! Whatever, they're all gone.<br/>";
		}

		var str = neg_str + "You remove ";
		if (amount == 1) str += getPrefix(item_name) + item_name;
		else str += amount + " " + getPlural(item_name);
		return str + " from your inventory.";
	};

	// If you only have one of a certain item and that item can only be used once, this function returns true, else it returns false.
	this.willPerish = function(idx) {
		if (this.inventory[idx] && !this.inventory[idx].durable && this.inventory[idx].quantity <= 1) return true;
		return false;
	};
/*
	this.discardAll = function(idx) {
		if (this.inventory[idx].durable) return;
		this.inventory.splice(idx, 1);
	};
*/

	// This function is called by the 'use item' command.
	// If given the direction of a wall, it will attempt to use the item on the wall.
	// The way it does this is by checking if the given item name is in your inventory and if the 'opened_by' attribute wall in the specified direction is the same as the given item name.
	// Else, if there is a function associated with the given item (and you have at least one in your inventory), call that function, then check to see if the player and enemy actors have changed.
	// If the given item is durable, don't subtract it from your inventory.
	this.use = function(args) {
		if (args.length < 2) {
			return "Which item do you wish to use?";
		}

		var item = findItem(this.inventory, args);
		if (item[0] == -1) {
			var fake = args;
			fake.shift();
			var f = fake.join(" ");
			return "You can't seem to be able to find " + getPrefix(f) + f + " in your inventory.";
		}
		var dir = "";
		if (item[1] < args.length-1) dir = args[item[1] + 1];

		var l = this.location;
		if (rooms[l] == null) return "error: invalid room";

		var used = false;
		var name = this.inventory[item[0]].item_name.toLowerCase();
		var str = "You use the " + name + ".<br/>";

		if (dir.length > 0) {
			var w = getDirectionIndex(dir);
			if (w == -1) {
				return dir + " is not a direction you can use an item in.";
			}

			if (!rooms[l].wall[w]) {
				return "Good luck trying to use an item on a wall that doesn't exist.";
			}
			if (rooms[l].wall[w].is_open) {
				return "This wall is already open!";
			}
			if (name != rooms[l].wall[w].opened_by) {
				return "You attempt to you open the wall " + dir_obj[w] + " with a " + name + ", but nothing happens.";
			}

			rooms[l].wall[w].is_open = true;
			used = true;

			if (rooms[l].wall[w].open_text) str += rooms[l].wall[w].open_text + " ";
			str += "The wall has been uncovered!<br/>";
		}

		else if (this.inventory[item[0]].use_func) {
			var pl = this.actor.clone();
			var en;
			var c = false;
			if (rooms[l].enemy && rooms[l].enemy.actor) {
				en = rooms[l].enemy.actor.clone();
				c = true;
			}

			var s = this.inventory[item[0]].use_func();
			if (typeof s == "string") str += s;
			used = true;

			if (c) str += rooms[l].enemy.actor.compare(en);
			str += this.actor.compare(pl);

			if (c) str += rooms[l].enemy.actor.update();
			str += this.actor.update();

			if (c) str += checkEnemy();
		}

		if (used && !this.inventory[item[0]].durable) this.discard(item[0], 1, true);
		if (!used) str += "Nothing happens.";

		return str;
	};

	// This is called by the 'combine' command, which combines two items.
	// It checks to see if you have both items in your inventory, before checking if the items can be combined.
	// This is done by checking if one item has a 'combination' and that the 'pair_item' field of that combination is the same as the name of the second item.
	// If this process fails, it tries again, only this checks to see if the second item can combine with the first, not vice versa.
	// If an item can be created from the combining the two items, it will use the 'discard' function to discard both items (if they aren't durable)
	// before adding the item created from the combination to the inventory.
	this.combine = function(args) {
		if (args.length < 3) {
			return "Surprisingly, in order combine two items you'll need two items.";
		}

		var idx1 = findItem(this.inventory, args);
		if (idx1[0] == -1) {
			return "You can't find the item beginning with " + args[1] + ".";
		}

		var s_off = idx1[1] + 1;
		if (s_off >= args.length) {
			return "Surprisingly, in order combine two items you'll need two items.";
		}

		var idx2 = findItem(this.inventory, args, s_off);
		if (idx2[0] == -1) {
			var second = squish(args, s_off);
			return "You can't seem to be able to find " + getPrefix(second) + second + " in your inventory.";
		}

		var name1 = this.inventory[idx1[0]].item_name;
		var name2 = this.inventory[idx2[0]].item_name;

		var comb = findCombination(this.inventory, idx1[0], idx2[0]);
		if (comb < 0) {
			comb = findCombination(this.inventory, idx2[0], idx1[0]);
			if (comb >= 0) {
				var temp = idx2[0];
				idx2[0] = idx1[0];
				idx1[0] = temp;
			}
			else {
				var str = "You can't seem to be able to pair " + getPrefix(name1) + name1 + " with " + getPrefix(name2) + name2 + ".";
				if (name1 == name2) str += "<br/>What a surprise!";
				return str;
			}
		}

		var item = this.inventory[idx1[0]].combinations[comb].result;
		if (this.inventory.length >= 10 && this.willPerish(idx1[0]) && this.willPerish(idx2[0])) {
			return "You don't have enough room for the new item.";
		}

		var creation_text = this.inventory[idx1[0]].combinations[comb].creation_text;

		if (!this.inventory[idx1[0]].durable) this.discard(idx1[0], 1, false);
		if (!this.inventory[idx2[0]].durable) this.discard(idx2[0], 1, false);
		cleanArray(this.inventory);
		var str = this.add(item);
		if (str.search("space") >= 0) return "You don't have enough room for the new item.";

		str = "You combine " + getPrefix(name1) + name1 + " with " + getPrefix(name2) + name2 + " to create a " + item.item_name + "!";
		if (creation_text != null) str += creation_text;
		return creation_text;
	};

	// Lists every item currently in your inventory as well as how many of each item you have.
	this.listItems = function() {
		//cleanArray(this.inventory);
		if (!this.inventory.length) {
			return "You don't currently have any items.";
		}
		var str = "";
		for (var i = 0; i < this.inventory.length; i++) {
			if (this.inventory[i]) str += this.inventory[i].quantity + " x " + this.inventory[i].item_name + "<br/>";
		}
		return str;
	};

	// A helper function for opening chests. This was separated into another function as it was planned to also be used by
	// the functions that dealt with placing and swapping items in chests, but these functions were scrapped.
	// If the direction given is a valid direction and the wall in that direction is open and has a chest, return the direction.
	this.accessChest = function(args, l) {
		if (args.length < 2) {
			return "Where is the chest you want to open?";
		}

		//if (args.length > 1) {
		w = getDirectionIndex(args[1]);
		if (w == -1) {
			return args[1] + " is not a direction you can use an item in.";
		}

		if (!rooms[l].wall[w]) {
			return "Nice wall.";
		}
		if (!rooms[l].wall[w].is_open || !rooms[l].wall[w].chest) {
			return "There doesn't appear to be a chest in this wall.";
		}
		return w.toString();
	};

	// This function is for the 'open' command. It copies the item in the chest to your inventory,
	// records the room id and wall direction to the new item in the inventory, then sets the item in the chest to null.
	this.openChest = function(args) {
		var l = this.location;
		if (rooms[l] == null) return "error: invalid room";

		var s = this.accessChest(args, l);
		if (s.length != 1) return s;
		var w = parseInt(s);

		if (!rooms[l].wall[w].chest.item) {
			return "You attempt to take the item in the chest, only there isn't one."
		}

		var str = "You open the chest.";
		if (rooms[l].wall[w].chest.open_text) str = rooms[l].wall[w].chest.open_text;

		str += "<br/>" + this.add(rooms[l].wall[w].chest.item) + "<br/>";
		if (str.search("space") >= 0) return str;

		var idx = this.inventory.length - 1;
		this.inventory[idx]["loc"] = l;
		this.inventory[idx]["wall"] = w;

		rooms[l].wall[w].chest.item = null;
		return str;
	};
/*
	this.swapChestItem = function(args) {
		return "Swapping items from the inventory to the chest doesn't work yet.";
	};

	this.placeChestItem = function(args) {
		var l = this.location;
		if (rooms[l] == null) return "error: invalid room";

		var s = this.accessChest(args, l);
		if (s.length != 1) return s;
		var w = parseInt(s);

		if (rooms[l].wall[w].chest.item) {
			return "You try to put "
		}
	};
*/

	// This function is used for the 'punch' command. If a direction is given, it will attempt to open the wall in that direction.
	// Similar to opening a wall with an item, it checks if the 'opened_by' attribute is equal to "punch" before opening the wall.
	this.punch = function(args) {
		var l = this.location;
		if (rooms[l] == null) return "error: invalid room<br/>";

		if (args.length > 1) {
			var w = getDirectionIndex(args[1]);
			if (w == -1) {
				return args[2] + " is not a direction.<br/>";
			}

			if (rooms[l].wall[w] == null) {
				return "Your fist goes straight through the non-existent wall!<br/>";
			}
			if (rooms[l].wall[w].is_open) {
				return "You punch the wall " + dir_obj[w] + ", but it's already open! You feel like a total idiot.<br/>";
			}
			if (args[0] != rooms[l].wall[w].opened_by) {
				return "You throw your fist at the wall " + dir_obj[w] + ", but it leaves you with nothing but a sore hand.<br/>";
			}

			rooms[l].wall[w].is_open = true;
			used = true;

			return (rooms[l].wall[w].open_text || "") + " The wall has been uncovered!<br/>";
		}
		else {
			if (rooms[l].enemy && rooms[l].enemy.actor) {
				var damage = damageCalc(5, 7, rooms[l].enemy.actor.defence, this.actor.attack);
				rooms[l].enemy.actor.hp -= damage;

				var str = "You take a swing at the enemy, a smashing " + damage + "HP!<br/>";
				str += rooms[l].enemy.actor.update() + this.actor.update();
				str += checkEnemy();
				return str;
			}
		}
		return "You swing your fist in the air. That'll teach it a lesson!<br/>";
	};

	// The function for the 'inspect' command. I'd say this one is fairly self-explanatory.
	this.inspect = function(args) {
		if (args.length < 2) {
			var l = this.location;
			if (!rooms[l] || !rooms[l].enemy) {
				return "No enemy to inspect!<br/>";
			}
			return rooms[l].enemy.desc + "<br/>";
		}
		var item = findItem(this.inventory, args);
		if (item[0] == -1) {
			return "You attempt to inspect an item in your inventory, only you can't seem to find it.<br/>";
		}
		return this.inventory[item[0]].desc + "</br>";
	};

	// This is for the 'look' command. If a direction is specified, it will get the description of the wall in that direction.
	// If the user typed 'look all', it will return the descriptions of all 6 walls.
	// If the command is simply 'look', it gets the description of the current room.
	this.look = function(args) {
		var l = this.location;
		if (!rooms[l]) return "error: invalid room";
		if (!args || args.length < 2) return rooms[l].desc || "";

		var undef_wall = "The lack of a wall here provides for an excellent view!<br/>";
		var undef_ceil = "You gaze upon the stars, grateful that the person who designed this room forgot to add the ceiling.<br/>";
		var undef_floor = "To your horror, you discover that this room does not contain a floor.<br/>" +
		                  "Count yourself lucky that there aren't any physics in this game!<br/>";

		var str = "";
		var all = false;
		if (args[1] == "all" || args[1] == "a") all = true;
		for (var i = 0; i < 6; i++) {
			if (all || args[1] == direction[i].toLowerCase() || args[1] == dir_char[i]) {
				if (all) str += direction[i] + ": ";
				if (!rooms[l].wall[i]) {
					if (i == 4) str += undef_ceil;
					if (i == 5) str += undef_floor;
					else str += undef_wall;
				}
				else str += (rooms[l].wall[i].desc || "") + "<br/>";
				if (!all) return str;
			}
		}
		if (all) return str;
		return rooms[l].desc || "";
	};

	// The 'exits' command calls this function. It returns a list of every direction in which there is an exit.
	this.lookForExits = function() {
		var l = this.location;
		if (!rooms[l]) return "error: invalid room";

		var str = "";
		var exit_count = 0;
		for (var i = 0; i < 6; i++) {
			if (rooms[l].wall[i] && rooms[l].wall[i].dest_room_id && rooms[l].wall[i].is_open) {
				if (exit_count > 0) str += ", ";
				str += direction[i];
				exit_count++;
			}
		}

		if (exit_count == 0) str = "You can't find any exits to this room.";
		else if (exit_count == 1) str = "Your only option appears to be " + str.toLowerCase() + ".";
		else str = "You see exits in the following directions:<br/>" + str;

		return str;
	};

	// Used by the 'go' command. If the wall in the specified direction is open and has a door that leads to a valid room,
	// set your room location to be that of the new room.
	this.go = function(dir) {
		var l = this.location;
		var w = getDirectionIndex(dir);
		if (w == -1) {
			return dir + " is not a direction you can go.";
		}

		dir = direction[w].toLowerCase();
		if (!rooms[l].wall[w]) {
			return "Nice try, but escaping this dungeon by abusing faulty programming is not an option!";
		}

		var idx = getRoomByID(rooms[l].wall[w].dest_room_id);
		if (!rooms[l].wall[w].is_open) {
			return "The way " + dir + " doesn't appear to have an exit.";
		}
		if (idx < 0 || !rooms[idx]) {
			return "I hope you weren't betting on exiting this way, because the room this door leads to doesn't exist!";
		}

		if (rooms[l].enemy) {
			return "You attempt to escape the " + rooms[l].enemy + ", but it drags you back!";
		}

		this.location = idx;

		str = "You go " + dir + ".<br/>" + this.look(null) + "<br/>";
		if (rooms[idx].enemy) {
			str += "You encounter a " + rooms[idx].enemy.actor.actor_name + "!</br>";
			if (rooms[idx].enemy.intro) str += rooms[idx].enemy.intro + "<br/>";
		}

		return str;
	};

	// This function is called at the end of most commands. It first checks if there is enemy.
	// If so, it will execute the custom move function of that enemy. After that, it calculates status effects for the player and the enemy (if present).
	this.combat = function() {
		if (player.actor.rip) return "";

		var str = "";
		var l = this.location;
		if (!rooms[l]) return "error: invalid room";

		var e = false;
		if (rooms[l].enemy && rooms[l].enemy.actor) e = true;

		var player_old = this.actor.clone();
		var enemy_old;

		if (e) {
			enemy_old = rooms[l].enemy.actor.clone();

			var move_str = "\"" + rooms[l].enemy.move_func() + "\"<br/>";
			str += move_str ? move_str : "The enemy does nothing.";
		}

		str += this.actor.compare(player_old);
		str += this.actor.update();

		if (e) {
			str += rooms[l].enemy.actor.compare(enemy_old);
			str += rooms[l].enemy.actor.update();
		}

		return str;
	};
};
