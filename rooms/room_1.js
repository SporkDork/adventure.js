north = {
	'desc': "You see a wall covered in slimy mould."
};
south = {
	'desc': "A keyhole stands out on the large, dark wall.",
	'is_open': false,
	'opened_by': "key",
	'dest_room_id': 3
};
east = {
	'desc': "This large archway looks distinctly Roman.",
	'is_open': true,
	'dest_room_id': 2
};
west = {
	'desc': "blah blah blah another wall"
};
up = {
	'desc': "This roof is painted a standard off white."
};
down = {
	'desc': "The red and white checked lino belongs in the 1950's."
};

var room_1 = new Room(1, "This room has a weird mix of themes", north, south, east, west, up, down);
