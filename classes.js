// The room class. Every argument is required except 'enemy'.
// As you can see, this function shows the intended order of the directions, which must be kept consistent throughout the game engine and each of the rooms
var Room = function(id, desc, north, south, east, west, up, down, enemy) {
	this.id = id;
	this.desc = desc;
	this.wall = new Array(6);
	this.wall[0] = north;
	this.wall[1] = south;
	this.wall[2] = east;
	this.wall[3] = west;
	this.wall[4] = up;
	this.wall[5] = down;
	this.enemy = enemy;
};

// An example of a status effect function. More on this later.
function effectBurn(actor) {
	if (!actor) return "";
	var damage = damageCalc(3, 6, actor.defence);
	actor.hp -= damage;
	if (actor.is_player) {
		return "You've been burned! You take " + damage + " HP of damage!<br/>";
	}
	else {
		return "The " + actor.actor_name + " is burned! It takes " + damage + " HP of damage!<br/>";
	}
};

/*
This is the actor class. Possibly not the best choice of name, but it made sense at the time.
In this program, an actor is an object that the player and enemies inherit from. It keeps track of various statistics,
such as health, attack, defence, status and actor name, as well as other useful functions that do things
like get the actor's status, compare with another actor and so on.
*/
var Actor = function(hp, attack, defence, actor_name) {
	if (!hp) hp = 1;
	if (!attack) attack = 1;
	if (!defence) defence = 1;

	this.actor_name = actor_name;
	this.status = 0;
	this.status_str = "Normal";
	this.max_hp = hp;
	this.hp = hp;
	this.attack = attack;
	this.defence = defence;

	// This function is used to retrieve an actor's status and print it to a certain textview
	this.getStatus = function() {
		return "--- " + this.actor_name + " ---<br/>" +
		       "Status: " + this.status_str + "<br/>" +
		       "Health: " + this.hp + " / " + this.max_hp + "<br/>" +
		       "Attack: " + this.attack * 10 + "<br/>" +
		       "Defence: " + this.defence * 10 + "<br/><br/>";
	};

	// Cloning an actor -- useful for getting a copy of an actor before it changes so that it can be compared against
	this.clone = function() {
		var c = new Actor();
		for (var a in this) c[a] = this[a];
		return c;
	};

	// An array of functions that are called according to this.status. When this.status is 1, the burn function is called.
	// It's possible to add additional functions to this array during runtime.
	this.effects = [effectBurn];

	// Basically just applies status effects and checks if the actor has been killed
	this.update = function() {
		var str = "";

		// If we our status isn't normal (and not inactive) and there's a function we can call to affect our status, call that function
		if (this.status > 0 && this.effects[this.status-1])
			str += this.effects[this.status-1](this);

		// This is a bit of a hack, but it ensures the actor doesn't get unfairly punished during battle
		// by alternating the status between active and inactive every time this line is executed
		this.status *= -1;

		// If we're not in a battle, make sure we always get hit after most commands
		if (!rooms[player.location].enemy) this.status = Math.abs(this.status);

		if (this.hp <= 0) {
			if (this.is_player) str += "You died! GAME OVER!";
			this["rip"] = true;
			return str;
		}
		return "";
	};

	// This function will check for any differences in most stats between another actor, returning a list of every one
	this.compare = function(old_actor) {
		var str = "";

		if (this.actor_name != old_actor.actor_name) {
			if (this.is_player) str += "Your name is now " + this.actor_name + "!<br/>";
			else str += "The " + old_actor.actor_name + " is now a " + this.actor_name + "!<br/>";
		}

		if (this.status_str != old_actor.status_str) {
			var status_str = this.status_str.toLowerCase();
			if (status_str == "normal") status_str = "healed";

			if (this.is_player) str += "You've been " + status_str + "!<br/>";
			else str += "The " + this.actor_name + " has been " + status_str + "!<br/>";
		}

		if (this.max_hp != old_actor.max_hp) {
			var diff = this.max_hp - old_actor.max_hp;

			if (this.is_player) str += "Your ";
			else str += "The " + this.actor_name + "'s ";
			str += "max health is now " + this.max_hp + (diff >= 0 ? " HP (+" : " (") + diff + ")!<br/>";
		}

		if (this.hp != old_actor.hp) {
			var diff = this.hp - old_actor.hp;
			if (diff < 0) diff = -diff;

			// I might be bending the rules of a comparison function by putting these lines here, but they had to go somewhere!
			this.hp = Math.max(this.hp, 0);
			this.hp = Math.min(this.hp, this.max_hp);

			if (this.is_player) {
				if (this.hp < old_actor.hp) str += "The enemy strikes! You take " + Math.round(diff) + " HP of damage!<br/>";
				else str += "You gain " + Math.round(diff) + " HP!<br/>";
			}
			else {
				if (this.hp < old_actor.hp) str += "You deal " + Math.round(diff) + " HP of damage to the " + this.actor_name + "!<br/>";
				else str += "The " + this.actor_name + " gains " + Math.round(diff) + " HP! What a jerk!<br/>";
			}
		}

		if (this.attack != old_actor.attack) str += attdef(this, old_actor, this.attack - old_actor.attack, "attack");
		if (this.defence != old_actor.defence) str += attdef(this, old_actor, this.defence - old_actor.defence, "defence");

		return str + "<br/>";
	};
};
