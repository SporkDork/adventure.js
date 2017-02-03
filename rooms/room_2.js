items[0] = {
	'item': Key
};
items[1] = {
	'item': Sword,
	'open_text': "It's dangerous to go alone! Take this!"
};

north = {
	'desc': "The tiles on this wall seem to be hastily plastered on.",
	'is_open': true,
	'chest': items[0]
};
south = {
	'desc': "The wall stares back at you with one of those punchable faces.",
	'is_open': false,
	'chest': items[1],
	'opened_by': "punch"
};
east = {
	'desc': "Judging by the graffiti on the wall, it appears Bob was here."
};
west = {
	'desc': "You look over to the room with conflicting wall designs.",
	'is_open': true,
	'dest_room_id': 1
};
up = {
	'desc': "As expected, the lights above are blindingly bright!"
};
down = {
	'desc': "The alternating black and white tiles suit the aesthetic."
};

var room_2 = new Room(2, "It seems like this room was a bathroom at one point.", north, south, east, west, up, down);