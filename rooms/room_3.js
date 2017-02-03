var wall = {
	'desc': "Every wall is the same!"
};
north = {
	'desc': "Every wall is the same!",
	'is_open': true,
	'dest_room_id': 1
};
south = {
	'desc': "Every wall is the same!",
	'is_open': true,
	'dest_room_id': 4
};
east = wall;
west = wall;
up = {
	'desc': "But not this one!",
	'is_open': true,
	'chest': {
		'item': BurnHeal,
		'open_text': "How convenient!"
	},
};
down = wall;

var room_3 = new Room(3, "Watch out!", north, south, east, west, up, down, Gablin);