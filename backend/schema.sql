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

create table resource_issues (
    issue_id integer primary key autoincrement,
    resource_id integer not null,
    issue_type varchar(32) not null,
    description text not null,
    severity varchar(16) not null,
    reported_by varchar(256),
    timestamp datetime not null default current_timestamp
);

create table resource_blocks (
    resource_id integer not null,
    start_time time not null,
    end_time time not null,
    primary key (resource_id, start_time, end_time)
);
