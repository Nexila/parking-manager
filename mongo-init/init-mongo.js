db = db.getSiblingDB("parking_manager");

db.createUser({
    user: "parking_user",
    pwd: "Parking123",
    roles: [
        {
            role: "readWrite",
            db: "parking_manager"
        }
    ]
});
