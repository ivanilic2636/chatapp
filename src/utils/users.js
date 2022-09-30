const users = [];

//addUser, removeUser, getUser, getUsersInRoom


const addUser = ({id, username, room }) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //validate the data
    if(!username && !room){
        return {
            error: "Username and room are required"
        }
    }
    
    //check for existing user in the same room room/prolazi kroz sve juzere i proverava da li su soba i username isti kao vec postojeci user
    const checkExistingUser = users.find((user) => {
        return user.room === room && user.username === username;
    })

    //Validate username
    if(checkExistingUser){
        return{
            error: "Username is in use in this room"
        }
    }

    //Store user
    const user = {id, username, room};
    users.push(user);
    return { user }
}


//Remove User
const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    })
    if(index !== -1){
        return users.splice(index, 1)[0];
    }
}



//Gets the user
const getUser = (id) => {
     return users.find(user => user.id === id)
}


//gets All Users in room
 const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    const usersInRoom = users.filter((user) => {
        return user.room === room;
    })
    return usersInRoom;
 }

module.exports = {
    addUser,
    getUser,
    removeUser,
    getUsersInRoom
}