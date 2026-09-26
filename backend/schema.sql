create table stations (
	code varchar(16) primary key,
	name varchar(256),
	division varchar(256),
	state varchar(256),
	zone varchar(16),
	lat numeric(8, 5),
	lng numeric(8, 5),
	ishub boolean
);

create table time_table (
	trip_no integer references trip,
	seq integer,
	station varchar(16) references stations,
	-- number of minutes from start of timetable, as usual
	arrival_time integer,
	departure_time integer,
	distance integer,
	source_station varchar(16) references stations,
	destination_station varchar(16) references stations,
	primary key (trip_no, seq)
);

create table trains (
	train_no varchar(16) primary key,
	train_name varchar(256)
);

create table trip (
	trip_no integer primary key autoincrement,
	train_no varchar(16)
);
